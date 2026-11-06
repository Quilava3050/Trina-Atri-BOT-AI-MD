const { generateWAMessageFromContent } = await import('@whiskeysockets/baileys')
const axios = (await import('axios')).default

let jid = m.chat

let urlGambar = 'https://cdn.ornzora.eu.cc/e5596d94-d434-4265-b0ec-eee03e8a1487-FIORA.jpg'
let res = await axios.get(urlGambar.trim(), { responseType: 'arraybuffer' })
let thumbnailBuffer = Buffer.from(res.data)

let msg = generateWAMessageFromContent(jid, {
  buttonsMessage: {
    contentText: "Halo dunia",
    footerText: "Footer Message",
    headerType: 6,
    locationMessage: {
      degreesLatitude: 0,
      degreesLongitude: 0,
      name: "🚀 NIXCODE",
      address: "Buttons Message",
      jpegThumbnail: thumbnailBuffer
    },
    buttons: [
      {
        buttonId: "Trina",
        buttonText: {
          displayText: "📡 Menu"
        },
        type: 1,
        nativeFlowInfo: {
          name: "single_select",
          paramsJson: JSON.stringify({
            title: "Click Here!",
            sections: [
              {
                title: "Fiora Sylvie",
                highlight_label: "",
                rows: [
                  {
                    header: "",
                    title: "Nixel",
                    description: "",
                    id: ".menu"
                  }
                ]
              }
            ]
          })
        }
      },
      {
        buttonId: ".profile",
        buttonText: {
          displayText: "👤 Profile"
        },
        type: 1
      }
    ],
    contextInfo: {
      mentionedJid: [],
      groupMentions: [],
      statusAttributions: []
    }
  }
}, { userJid: sock.user.id, quoted: m })

await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
'Pesan buttons berhasil terkirim!'