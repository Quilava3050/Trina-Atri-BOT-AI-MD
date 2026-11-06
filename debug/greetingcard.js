{
const { generateWAMessageFromContent } = await import('@whiskeysockets/baileys')
const { randomBytes } = await import('node:crypto')
const fs = await import('node:fs/promises')

const cardOptions = String(text || '').trim().replace(/^\S+\s*/, '')
const [chatText = 'wow', cardTitle = 'Megumin Dominada BUSI', greeting = 'Hi Business'] = cardOptions
  .trim()
  .split('|')
  .map(value => value.trim())
const botNumber = String(sock.user?.id || '').split(':')[0].split('@')[0]
const thumbnail = await fs.readFile('./media/live.jpg')
const randomId = size => randomBytes(size).toString('hex')

const message = generateWAMessageFromContent(
  m.chat,
  {
    extendedTextMessage: {
      text: chatText,
      contextInfo: {
        externalAdReply: {
          title: cardTitle,
          body: greeting,
          mediaType: 1,
          thumbnail,
          sourceType: 'whatsapp',
          sourceId: String(randomBytes(4).readUInt32BE(0)),
          sourceUrl: botNumber ? `https://wa.me/${botNumber}` : 'https://whatsapp.com',
          containsAutoReply: false,
          renderLargerThumbnail: false,
          showAdAttribution: false,
          ctwaClid: `clid${randomId(8)}`,
          ref: 'referencia',
          clickToWhatsappCall: true,
          adContextPreviewDismissed: false,
          sourceApp: 'myapp',
          automatedGreetingMessageShown: true,
          greetingMessageBody: greeting,
          ctaPayload: `payload${randomId(8)}`,
          disableNudge: true,
          wtwaAdFormat: false,
          containsCtwaFlowsAutoReply: false,
          agmThumbnailStrategy: 0,
          agmTitleStrategy: 0,
          agmSubtitleStrategy: 0,
          agmHeaderInteractionStrategy: 0
        }
      }
    }
  },
  { userJid: sock.user?.id }
)

await sock.relayMessage(m.chat, message.message, {
  messageId: message.key.id
})

await reply('Greeting card test terkirim!')
}
