const { prepareWAMessageMedia, generateWAMessageFromContent } = await import('@whiskeysockets/baileys')
const fs = await import('node:fs/promises')

let jid = m.chat

// Prepare Image Media
const image = await prepareWAMessageMedia(
  {
    image: await fs.readFile('./media/live.jpg')
  },
  {
    upload: sock.waUploadToServer
  }
)

// Prepare Video Media
const video = await prepareWAMessageMedia(
  {
    video: {
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
    }
  },
  {
    upload: sock.waUploadToServer
  }
)

// Generate Parent Message (Image)
const msg = generateWAMessageFromContent(
  jid,
  {
    imageMessage: {
      ...image.imageMessage,
      caption: 'Tes caption pada paired media.',
      contextInfo: {
        pairedMediaType: 5,
        statusSourceType: 0
      }
    }
  },
  { userJid: sock.user.id, quoted: m }
)

// Kirim Pesan Pertama (Image)
await sock.relayMessage(jid, msg.message, {
  messageId: msg.key.id
})

// Kirim Pesan Kedua (Video) dengan Message Association
await sock.relayMessage(
  jid,
  {
    videoMessage: {
      ...video.videoMessage,
      contextInfo: {
        pairedMediaType: 6,
        statusSourceType: 0
      }
    },
    messageContextInfo: {
      messageAssociation: {
        associationType: 12,
        parentMessageKey: msg.key
      }
    }
  },
  {}
)

'Pesan Paired Media berhasil terkirim!'