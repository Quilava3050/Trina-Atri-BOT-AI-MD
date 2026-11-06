import {
  generateMessageIDV2,
  jidDecode,
  jidNormalizedUser,
  isJidGroup,
  isLidUser,
  prepareWAMessageMedia
} from '@whiskeysockets/baileys'

export class SPRError extends Error {
  constructor(message, code, meta = {}) {
    super(message)
    this.name = 'SPRError'
    this.code = code
    this.meta = meta
  }
}

const sleep = ms => new Promise(res => setTimeout(res, ms))

const chunkArray = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

const uniq = arr => [...new Set(arr)]

const safeNormalize = jid => {
  if (!jid) return null
  try {
    return jidNormalizedUser(jid)
  } catch {
    return jid
  }
}

export function extractReplyTarget(quotedMessageInfo) {
  const lid = quotedMessageInfo?.key?.participant
  const pn = quotedMessageInfo?.key?.participantAlt
  const jid = pn || lid
  if (!jid) {
    throw new SPRError('Tidak ada target pada pesan yang di-reply', 'NO_REPLY_TARGET')
  }
  return { lid, pn, jid }
}

export function isLidJid(jid) {
  return isLidUser(jid)
}

export function decodeJid(jid) {
  return jidDecode(jid)
}

export async function resolveGroupParticipants(sock, jid, filters = {}) {
  const { adminsOnly = false, excludeIds = [], excludeMe = true } = filters

  if (!isJidGroup(jid)) {
    throw new SPRError('resolveGroupParticipants hanya berlaku untuk grup', 'NOT_A_GROUP')
  }

  const meta = await sock.groupMetadata(jid)
  const meId = safeNormalize(sock.user?.id)
  const meLid = safeNormalize(sock.authState?.creds?.me?.lid)

  let participants = meta.participants.map(p => p.id)

  if (adminsOnly) {
    participants = meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => p.id)
  }

  participants = participants.filter(id => !excludeIds.includes(id))

  if (excludeMe) {
    participants = participants.filter(id => id !== meId && id !== meLid)
  }

  return uniq(participants.map(safeNormalize))
}

async function resolveTargets(sock, jid, opts) {
  const {
    mode = 'only',
    only = [],
    include = [],
    exclude = [],
    adminsOnly = false,
    includeMe = false,
    excludeMe = true
  } = opts

  const groupChat = isJidGroup(jid)
  const meId = safeNormalize(sock.user?.id)
  const meLid = safeNormalize(sock.authState?.creds?.me?.lid)

  let targets = []

  if (mode === 'only') {
    if (!only.length) {
      throw new SPRError('mode "only" butuh array target di opts.only', 'EMPTY_ONLY')
    }
    targets = [...only]
  } else if (mode === 'include') {
    if (!include.length) {
      throw new SPRError('mode "include" butuh array target di opts.include', 'EMPTY_INCLUDE')
    }
    targets = [...include]
  } else if (mode === 'exclude') {
    if (!groupChat) {
      throw new SPRError('mode "exclude" hanya berlaku untuk grup', 'NOT_A_GROUP')
    }
    targets = await resolveGroupParticipants(sock, jid, {
      adminsOnly,
      excludeIds: exclude,
      excludeMe: false
    })
  } else if (mode === 'admins') {
    if (!groupChat) {
      throw new SPRError('mode "admins" hanya berlaku untuk grup', 'NOT_A_GROUP')
    }
    targets = await resolveGroupParticipants(sock, jid, {
      adminsOnly: true,
      excludeIds: exclude,
      excludeMe: false
    })
  } else if (mode === 'all') {
    if (!groupChat) {
      throw new SPRError('mode "all" hanya berlaku untuk grup', 'NOT_A_GROUP')
    }
    targets = await resolveGroupParticipants(sock, jid, {
      excludeIds: exclude,
      excludeMe: false
    })
  } else {
    throw new SPRError(`mode tidak dikenal: ${mode}`, 'UNKNOWN_MODE', { mode })
  }

  targets = targets.filter(Boolean).map(safeNormalize)

  if (includeMe && meId && !targets.includes(meId)) {
    targets.push(meId)
  }

  if (excludeMe) {
    targets = targets.filter(id => id !== meId && id !== meLid)
  }

  targets = uniq(targets)

  if (!targets.length) {
    throw new SPRError('Target kosong setelah filtering, tidak ada yang dikirimi pesan.', 'EMPTY_TARGETS')
  }

  return targets
}

async function resolveDevices(sock, targets, deviceMode, useCache) {
  if (!deviceMode) {
    return uniq(targets)
  }

  const devices = await sock.getUSyncDevices(targets, useCache, false)
  let deviceJids = devices.map(d => d.jid)

  if (!deviceJids.length) {
    deviceJids = targets
  }

  return uniq(deviceJids)
}

async function relayToDevice(sock, jid, message, deviceJid, params) {
  const { msgId, count, additionalAttributes, additionalNodes, maxRetries, retryDelayMs, logger } = params

  let attempt = 0
  let lastError = null

  while (attempt <= maxRetries) {
    try {
      const id = await sock.relayMessage(jid, message, {
        messageId: msgId,
        participant: { jid: deviceJid, count: count + attempt },
        additionalAttributes,
        additionalNodes
      })

      return { jid: deviceJid, ok: true, id, attempts: attempt + 1 }
    } catch (err) {
      lastError = err
      logger?.warn?.(
        { jid: deviceJid, attempt: attempt + 1, err: err?.message },
        'sPR relay attempt failed'
      )
      attempt += 1
      if (attempt <= maxRetries) {
        await sleep(retryDelayMs * attempt)
      }
    }
  }

  return {
    jid: deviceJid,
    ok: false,
    error: lastError?.message || String(lastError),
    attempts: attempt
  }
}

export default async function sPR(sock, jid, message, opts = {}) {
  const {
    mode = 'only',
    only = [],
    include = [],
    exclude = [],
    adminsOnly = false,
    messageId,
    count = 0,
    additionalAttributes,
    additionalNodes,
    deviceMode = true,
    useDeviceCache = true,
    includeMe = false,
    excludeMe = true,
    concurrency = 4,
    maxRetries = 1,
    retryDelayMs = 800,
    throwOnFail = false,
    ensureSessions = true
  } = opts

  if (!sock) throw new SPRError('sock tidak boleh kosong', 'NO_SOCK')
  if (!jid) throw new SPRError('jid tujuan tidak boleh kosong', 'NO_JID')
  if (!message || typeof message !== 'object') {
    throw new SPRError('message harus berupa objek proto.IMessage', 'INVALID_MESSAGE')
  }

  const logger = sock.logger

  const msgId = messageId || generateMessageIDV2(sock.user?.id)

  const targets = await resolveTargets(sock, jid, {
    mode,
    only,
    include,
    exclude,
    adminsOnly,
    includeMe,
    excludeMe
  })

  const deviceJids = await resolveDevices(sock, targets, deviceMode, useDeviceCache)

  if (ensureSessions) {
    await sock.assertSessions(deviceJids, false)
  }

  const results = []
  const batches = chunkArray(deviceJids, Math.max(1, concurrency))

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(deviceJid =>
        relayToDevice(sock, jid, message, deviceJid, {
          msgId,
          count,
          additionalAttributes,
          additionalNodes,
          maxRetries,
          retryDelayMs,
          logger
        })
      )
    )
    results.push(...batchResults)
  }

  const failed = results.filter(r => !r.ok)
  const succeeded = results.filter(r => r.ok)

  if (throwOnFail && failed.length) {
    throw new SPRError('Sebagian atau semua target gagal menerima pesan', 'PARTIAL_OR_TOTAL_FAILURE', {
      failed,
      succeeded
    })
  }

  return {
    messageId: msgId,
    targets: deviceJids,
    succeeded,
    failed,
    results
  }
}

export async function sendPrivateText(sock, jid, text, opts = {}) {
  const message = { extendedTextMessage: { text } }
  return sPR(sock, jid, message, opts)
}

export async function sendPrivateImage(sock, jid, imageSource, opts = {}) {
  const { caption = '', mimetype, jpegThumbnail, ...sPROpts } = opts

  const { imageMessage } = await prepareWAMessageMedia(
    { image: imageSource, mimetype, jpegThumbnail },
    { upload: sock.waUploadToServer }
  )

  const message = {
    imageMessage: {
      ...imageMessage,
      caption
    }
  }

  return sPR(sock, jid, message, sPROpts)
}

export async function sendPrivateReplyFromQuoted(sock, jid, quotedMessageInfo, message, opts = {}) {
  const { pn, lid } = extractReplyTarget(quotedMessageInfo)
  const includeJids = [lid]
  if (pn) includeJids.push(pn)

  return sPR(sock, jid, message, {
    ...opts,
    mode: 'include',
    include: includeJids
  })
}

export async function buildOnlyListFromMentions(sock, jid, mentionedJids = [], filters = {}) {
  const normalized = uniq(mentionedJids.map(safeNormalize))
  if (!normalized.length) {
    throw new SPRError('Tidak ada mention yang valid', 'EMPTY_MENTIONS')
  }

  if (filters.groupOnly && isJidGroup(jid)) {
    const meta = await sock.groupMetadata(jid)
    const memberIds = new Set(meta.participants.map(p => p.id))
    return normalized.filter(id => memberIds.has(id))
  }

  return normalized
}