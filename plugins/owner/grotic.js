import fs from 'fs/promises'
import path from 'path'

const AUDIO_MIME_TYPES = {
  '.aac': 'audio/aac',
  '.aiff': 'audio/aiff',
  '.alac': 'audio/alac',
  '.amr': 'audio/amr',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.mid': 'audio/midi',
  '.midi': 'audio/midi',
  '.mp3': 'audio/mpeg',
  '.mpga': 'audio/mpeg',
  '.mpeg': 'audio/mpeg',
  '.oga': 'audio/ogg',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg; codecs=opus',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.wma': 'audio/x-ms-wma',
  '.3gp': 'audio/3gpp'
}

const MAX_AUDIO_SIZE = 100 * 1024 * 1024

const handler = async (m, { text, reply, sock }) => {
  const requestedPath = text?.trim().replace(/^["']|["']$/g, '')
  if (!requestedPath) {
    return reply('Masukkan lokasi audio.\nContoh: .grotic media/voice1.mpeg')
  }

  const filePath = path.resolve(requestedPath)
  const extension = path.extname(filePath).toLowerCase()
  const mimetype = AUDIO_MIME_TYPES[extension]

  if (!mimetype) {
    return reply(`Format audio tidak didukung. Gunakan: ${Object.keys(AUDIO_MIME_TYPES).join(', ')}`)
  }

  try {
    const fileInfo = await fs.stat(filePath)
    if (!fileInfo.isFile()) {
      return reply('Path tersebut bukan file audio.')
    }

    if (fileInfo.size > MAX_AUDIO_SIZE) {
      return reply('Ukuran audio terlalu besar. Maksimal 100 MB.')
    }

    const audio = await fs.readFile(filePath)
    await sock.sendMessage(m.chat, {
      audio,
      mimetype,
      fileName: path.basename(filePath),
      ptt: false
    }, { quoted: m })
  } catch (error) {
    if (error.code === 'ENOENT') {
      return reply(`File audio tidak ditemukan:\n${requestedPath}`)
    }

    console.error('[GROTIC] Gagal membaca audio:', error)
    return reply(`Gagal mengambil audio: ${error.message}`)
  }
}

handler.help = ['grotic <path audio>']
handler.tags = ['owner']
handler.command = ['grotic']
handler.owner = true

export default handler