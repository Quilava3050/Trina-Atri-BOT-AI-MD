import fs from 'node:fs'
import path from 'node:path'
import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys'

// TARGET CHANNEL / NEWSLETTER
const TARGET_CHANNEL_JID = '120363418430349552@newsletter'
const GROUP_STICKER_DIR = path.join(process.cwd(), 'LibStickerReact')
const chEmojis = ['💛', '❤️', '🔥', '✨', '👍',"😊","🤩", "🎉", "😍", "🤔", "👀", "😳", "❤", "😎","🤍", "🥰", "⭐", "😭"]
const swEmojis = ["😊", "👍", "🤩", "🎉", "😍", "🤔", "👀", "😳", "❤", "😎", "🇵🇸", "🤍", "🥰", "⭐", "😭"]

const reactedChIds = new Set()
const reactedSwIds = new Set() // Cache agar SW tidak direact berkali-kali
const readSwIds = new Set()
const reactedGroupMessageIds = new Set()
const groupKeywordCooldowns = new Map()
const groupRandomCooldowns = new Map()
const reactedGroupStickerMessageIds = new Set()
const groupStickerKeywordCooldowns = new Map()
const groupStickerRandomCooldowns = new Map()
let groupStickerFiles
let groupStickerDirectoryWarningLogged = false

const groupKeywordReactions = [
  { keywords: ['terima kasih', 'makasih', 'thanks', 'thank you', 'tq', '🙏'], emoji: '🙏' },
  { keywords: ['wkwk', 'haha', 'ngakak', 'lol', 'lucu', 'kocak'], emoji: '😂' },
  { keywords: ['selamat', 'congrats', 'congratulations', 'happy birthday', 'hbd'], emoji: '🎉' },
  { keywords: ['semangat', 'gas', 'ayo bisa', 'you can do it'], emoji: '🔥' },
  { keywords: ['sedih', 'nangis', 'galau', 'kecewa', 'kasihan'], emoji: '🥺' },
  { keywords: ['sayang', 'love', 'cinta', 'kangen'], emoji: '❤️' },
  { keywords: ['setuju', 'benar', 'bener', 'betul', 'agree'], emoji: '💯' },
  { keywords: ['keren', 'mantap', 'hebat', 'bagus', 'good job', 'nice'], emoji: '👏' },
  { keywords: ['wow', 'wah', 'serius', 'kaget', 'astaga'], emoji: '😳' },
  { keywords: ['selamat pagi', 'pagi'], emoji: '🌅' },
  { keywords: ['selamat malam', 'malam'], emoji: '🌙' },
  { keywords: ['amin', 'aamiin', 'semoga'], emoji: '🤲' },
  { keywords: ['makan', 'lapar', 'kuliner', 'enak'], emoji: '😋' },
  { keywords: ['tidak', 'nggak', 'gak setuju', 'nope'], emoji: '🙅' },
  { keywords: ['halo', 'hai', 'hi', 'assalamualaikum'], emoji: '👋' }
]
const groupRandomEmojis = [
  '👍', '👎', '✨', '🔥', '😂', '🤣', '💯', '🙌', '👏', '🤝',
  '👀', '🤔', '😎', '😍', '🥰', '😇', '🥳', '😱', '😴', '🤯',
  '💪', '🙏', '❤️', '💖', '💥', '🎉', '🌟', '☝️', '🫡', '🗿',
  '🐱', '🐣', '🍀', '🌹', '☕', '🍜', '⚡', '🚀', '💐', '🎶'
]
const GROUP_KEYWORD_COOLDOWN_MS = 8 * 1000
const GROUP_RANDOM_COOLDOWN_MS = 45 * 1000
const GROUP_RANDOM_REACTION_CHANCE = 0.08

function getGroupMessageText(message) {
  let content = message

  while (content?.ephemeralMessage?.message || content?.viewOnceMessage?.message || content?.viewOnceMessageV2?.message) {
    content = content.ephemeralMessage?.message || content.viewOnceMessage?.message || content.viewOnceMessageV2?.message
  }

  return content?.conversation ||
    content?.extendedTextMessage?.text ||
    content?.imageMessage?.caption ||
    content?.videoMessage?.caption ||
    content?.documentMessage?.caption ||
    ''
}

function getGroupKeywordEmoji(text) {
  const normalizedText = text.toLowerCase()
  return groupKeywordReactions.find(({ keywords }) =>
    keywords.some(keyword => normalizedText.includes(keyword))
  )?.emoji
}

function getGroupStickerFiles() {
  if (groupStickerFiles) return groupStickerFiles

  try {
    groupStickerFiles = fs.readdirSync(GROUP_STICKER_DIR, { withFileTypes: true })
      .filter(entry => entry.isFile() && /\.webp$/i.test(entry.name))
      .map(entry => path.join(GROUP_STICKER_DIR, entry.name))
  } catch (error) {
    if (!groupStickerDirectoryWarningLogged) {
      console.error('[AUTO GROUP STICKER] Gagal membaca folder stiker:', error.message)
      groupStickerDirectoryWarningLogged = true
    }
    groupStickerFiles = []
  }

  if (!groupStickerFiles.length && !groupStickerDirectoryWarningLogged) {
    console.warn(`[AUTO GROUP STICKER] Tidak ada file WebP di ${GROUP_STICKER_DIR}`)
    groupStickerDirectoryWarningLogged = true
  }
  return groupStickerFiles
}

async function sendGroupStickerReaction(sock, message, chatJid) {
  const files = getGroupStickerFiles()
  if (!files.length) return false
  if (typeof sock.waUploadToServer !== 'function' || typeof sock.relayMessage !== 'function') {
    throw new Error('Socket belum menyediakan uploader media atau relayMessage.')
  }

  const stickerPath = files[Math.floor(Math.random() * files.length)]
  const stickerBuffer = await fs.promises.readFile(stickerPath)
  const media = await prepareWAMessageMedia(
    { sticker: stickerBuffer },
    { upload: sock.waUploadToServer }
  )
  if (!media?.stickerMessage) throw new Error('Baileys gagal menyiapkan file stiker.')

  const stickerReaction = generateWAMessageFromContent(chatJid, {
    messageContextInfo: {
      messageAssociation: {
        associationType: 11,
        parentMessageKey: message.key
      }
    },
    stickerMessage: media.stickerMessage
  }, { userJid: sock.user?.id })

  await sock.relayMessage(chatJid, stickerReaction.message, {
    messageId: stickerReaction.key.id
  })
  return path.basename(stickerPath)
}

export function startAutoEvent(sock) {
  if (!sock || !sock.ev) return

  // Pancingan Keep-Alive khusus Newsletter
  if (!global.newsletterInterval) {
    global.newsletterInterval = setInterval(async () => {
      try {
        if (sock?.newsletterMetadata) {
          await sock.newsletterMetadata('jid', TARGET_CHANNEL_JID).catch(() => null)
        }
      } catch (e) {}
    }, 10 * 60 * 1000)
  }

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const messages = chatUpdate.messages || []
      for (const m of messages) {
        if (!m || !m.key) continue

        // 🛑 ABORT JIKA INI MERUPAKAN PESAN REAKSI / PROTOCOL MESSAGE (Bikin Looping)
        if (m.message?.reactionMessage || m.message?.protocolMessage) continue

        const fromJid = m.key.remoteJid || m.key.participant

        /* ================= 0. AUTO REACT GROUP ================= */
        if (global.grupreact && fromJid?.endsWith('@g.us') && !m.key.fromMe && m.key.id && typeof sock.sendMessage === 'function' && !reactedGroupMessageIds.has(m.key.id)) {
          reactedGroupMessageIds.add(m.key.id)
          setTimeout(() => reactedGroupMessageIds.delete(m.key.id), 3600000)

          const text = getGroupMessageText(m.message)
          const keywordEmoji = getGroupKeywordEmoji(text)
          const now = Date.now()
          let emoji

          if (keywordEmoji) {
            const lastKeywordReaction = groupKeywordCooldowns.get(fromJid) || 0
            if (now - lastKeywordReaction >= GROUP_KEYWORD_COOLDOWN_MS) {
              emoji = keywordEmoji
              groupKeywordCooldowns.set(fromJid, now)
            }
          } else {
            const lastRandomReaction = groupRandomCooldowns.get(fromJid) || 0
            if (now - lastRandomReaction >= GROUP_RANDOM_COOLDOWN_MS && Math.random() < GROUP_RANDOM_REACTION_CHANCE) {
              emoji = groupRandomEmojis[Math.floor(Math.random() * groupRandomEmojis.length)]
              groupRandomCooldowns.set(fromJid, now)
            }
          }

          if (emoji) {
            await sock.sendMessage(fromJid, { react: { text: emoji, key: m.key } })
            console.log(`[AUTO GROUP] React ${emoji} ke pesan di ${fromJid}`)
          }
        }

        /* ================= 0.1 AUTO STICKER REACT GROUP ================= */
        if (
          global.grupstickerreact &&
          fromJid?.endsWith('@g.us') &&
          !m.key.fromMe &&
          m.key.id &&
          !reactedGroupStickerMessageIds.has(`${fromJid}:${m.key.id}`)
        ) {
          const reactionKey = `${fromJid}:${m.key.id}`
          reactedGroupStickerMessageIds.add(reactionKey)
          setTimeout(() => reactedGroupStickerMessageIds.delete(reactionKey), 3600000)

          const text = getGroupMessageText(m.message)
          const hasKeyword = Boolean(getGroupKeywordEmoji(text))
          const now = Date.now()
          let shouldReact = false

          if (hasKeyword) {
            const lastKeywordReaction = groupStickerKeywordCooldowns.get(fromJid) || 0
            if (now - lastKeywordReaction >= GROUP_KEYWORD_COOLDOWN_MS) {
              shouldReact = true
              groupStickerKeywordCooldowns.set(fromJid, now)
            }
          } else {
            const lastRandomReaction = groupStickerRandomCooldowns.get(fromJid) || 0
            if (now - lastRandomReaction >= GROUP_RANDOM_COOLDOWN_MS && Math.random() < GROUP_RANDOM_REACTION_CHANCE) {
              shouldReact = true
              groupStickerRandomCooldowns.set(fromJid, now)
            }
          }

          if (shouldReact) {
            try {
              const stickerName = await sendGroupStickerReaction(sock, m, fromJid)
              if (stickerName) {
                console.log(`[AUTO GROUP STICKER] React ${stickerName} ke pesan di ${fromJid}`)
              }
            } catch (error) {
              console.error('[AUTO GROUP STICKER] Gagal mengirim stiker:', error.message)
            }
          }
        }

        /* ================= 1. AUTO REACT CHANNEL ================= */
        if (fromJid === TARGET_CHANNEL_JID) {
          const messageId = m.key.server_id || m.newsletterServerId || m.key.id
          if (!messageId) continue

          const idStr = String(messageId)
          if (reactedChIds.has(idStr)) continue

          reactedChIds.add(idStr)
          setTimeout(() => reactedChIds.delete(idStr), 3600000)

          const randomEmoji = chEmojis[Math.floor(Math.random() * chEmojis.length)]
          console.log(`\n[NEWSLETTER DETECTED] Server ID: ${idStr} | Reaksi: ${randomEmoji}`)

          await new Promise((resolve) => setTimeout(resolve, 2000))

          if (typeof sock.newsletterReactMessage === 'function') {
            await sock.newsletterReactMessage(TARGET_CHANNEL_JID, idStr, randomEmoji)
              .then(() => console.log(`[NEWSLETTER SUCCESS] Reaksi ${randomEmoji} terkirim!`))
              .catch((e) => console.error('[NEWSLETTER FAILED]', e?.message || e))
          } else if (typeof sock.sendMessage === 'function') {
            await sock.sendMessage(TARGET_CHANNEL_JID, {
              react: { text: randomEmoji, key: m.key }
            }).catch(() => null)
          }
        }

        /* ================= 2. AUTO READ & REACT SW ================= */
        if (fromJid === 'status@broadcast') {
          const rawBotId = sock.user?.id || sock.user?.jid || ''
          const botJid = rawBotId.split(':')[0] + '@s.whatsapp.net'
          const senderJid = m.key.participant || m.participant

          // Abaikan jika status dari bot sendiri atau jika dari pesan reaksi
          if (!senderJid || senderJid === botJid) continue

          // Read and react have independent switches and deduplication.
          const swId = m.key.id

          if (global.readsw && typeof sock.readMessages === 'function' && (!swId || !readSwIds.has(swId))) {
            if (swId) {
              readSwIds.add(swId)
              setTimeout(() => readSwIds.delete(swId), 3600000)
            }
            await sock.readMessages([m.key]).catch(() => null)
          }

          if (global.reactsw && typeof sock.sendMessage === 'function' && (!swId || !reactedSwIds.has(swId))) {
            if (swId) {
              reactedSwIds.add(swId)
              setTimeout(() => reactedSwIds.delete(swId), 3600000)
            }
            const likeEmoji = swEmojis[Math.floor(Math.random() * swEmojis.length)]
            await sock.sendMessage(
              'status@broadcast',
              { react: { text: likeEmoji, key: m.key } },
              { statusJidList: [senderJid] }
            ).catch(() => null)

            const senderNumber = senderJid.split('@')[0]
            console.log(`[AUTO SW] React ${likeEmoji} ke SW: ${senderNumber}`)
          }
        }

      }
    } catch (err) {
      console.error('Error Auto Event (CH/SW):', err)
    }
  })
}