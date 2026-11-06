const RETENTION_MS = 24 * 60 * 60 * 1000
const MAX_ITEMS_PER_GROUP = 100
const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage']
const cache = new Map()

const unwrapMessage = (message) => {
  let content = message
  while (content?.ephemeralMessage?.message || content?.viewOnceMessage?.message || content?.viewOnceMessageV2?.message) {
    content = content.ephemeralMessage?.message || content.viewOnceMessage?.message || content.viewOnceMessageV2?.message
  }
  return content
}

const getEntryMap = (chat) => {
  let entries = cache.get(chat)
  if (!entries) {
    entries = new Map()
    cache.set(chat, entries)
  }
  return entries
}

const prune = (entries) => {
  const expiredAt = Date.now() - RETENTION_MS
  for (const [id, entry] of entries) {
    if (entry.timestamp < expiredAt) entries.delete(id)
  }
  while (entries.size > MAX_ITEMS_PER_GROUP) {
    entries.delete(entries.keys().next().value)
  }
}

export const captureAntiDeleteMessage = async (sock, message, enabled) => {
  const chat = message.key?.remoteJid
  if (!enabled || !chat?.endsWith('@g.us') || !message.message || !message.key?.id) return

  const content = unwrapMessage(message.message)
  if (!content) return

  const type = MEDIA_TYPES.find((candidate) => content[candidate]) ||
    (content.conversation || content.extendedTextMessage ? 'text' : null)
  if (!type) return

  const media = type === 'text' ? null : content[type]
  let buffer = null
  if (media) {
    try {
      buffer = await sock.downloadM(media, type.replace(/Message$/, ''))
    } catch (error) {
      console.error('[ANTIDELETE] Gagal menyimpan media:', error)
      return
    }
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) return
  }

  const text = content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    content.documentMessage?.caption ||
    ''
  const sender = message.key.participant || message.key.remoteJid
  const entries = getEntryMap(chat)
  prune(entries)
  entries.set(message.key.id, {
    timestamp: Date.now(),
    sender,
    type,
    text,
    buffer,
    mimetype: media?.mimetype || '',
    fileName: media?.fileName || media?.filename || '',
    ptt: Boolean(media?.ptt),
    gifPlayback: Boolean(media?.gifPlayback)
  })
}

export const restoreAntiDeleteMessage = async (sock, key, chat, enabled) => {
  if (!enabled || !chat?.endsWith('@g.us') || !key?.id) return

  const entries = cache.get(chat)
  const entry = entries?.get(key.id)
  if (!entry) return
  entries.delete(key.id)

  const mentions = entry.sender ? [entry.sender] : []
  await sock.sendMessage(chat, {
    text: `⚠️ Pesan dari @${(entry.sender || '').split('@')[0]} telah dihapus.`,
    mentions
  })

  if (entry.type === 'text') {
    if (entry.text) await sock.sendMessage(chat, { text: entry.text, mentions })
    return
  }

  if (entry.type === 'imageMessage') {
    await sock.sendMessage(chat, { image: entry.buffer, caption: entry.text || undefined, mentions })
  } else if (entry.type === 'videoMessage') {
    await sock.sendMessage(chat, { video: entry.buffer, caption: entry.text || undefined, gifPlayback: entry.gifPlayback, mentions })
  } else if (entry.type === 'audioMessage') {
    await sock.sendMessage(chat, { audio: entry.buffer, mimetype: entry.mimetype || 'audio/ogg', ptt: entry.ptt })
  } else if (entry.type === 'documentMessage') {
    await sock.sendMessage(chat, {
      document: entry.buffer,
      mimetype: entry.mimetype || 'application/octet-stream',
      fileName: entry.fileName || 'deleted-message',
      caption: entry.text || undefined,
      mentions
    })
  } else if (entry.type === 'stickerMessage') {
    await sock.sendMessage(chat, { sticker: entry.buffer })
  }
}
