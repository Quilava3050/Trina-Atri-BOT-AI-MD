import uploadImage from '../../control/uploadTop4top.js'
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

let handler = async (m, { sock }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''

  if (!mime) {
    return sock.sendMessage(m.chat, { 
      text: '⚠️ Balas atau kirim media (Gambar/Video/Audio) dengan caption *.tourl*' 
    }, { quoted: m })
  }

  if (!/image|video|audio/i.test(mime)) {
    return sock.sendMessage(m.chat, { 
      text: '⚠️ Fitur ini hanya mendukung media Gambar, Video, dan Audio!' 
    }, { quoted: m })
  }

  await sock.sendMessage(m.chat, { text: '⏳ Sedang mengunggah media ke Top4top...' }, { quoted: m })

  try {
    let media = await q.download()
    if (!media) throw new Error('Gagal mendownload media')

    let url = await uploadImage(media)
    let captionText = `◦ *URL Media* : ${url}\n◦ *Mimetype* : ${mime}`

    let msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: captionText
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: 'Trina Media Uploader'
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                {
                  name: 'cta_copy',
                  buttonParamsJson: JSON.stringify({
                    display_text: 'Salin Link URL',
                    id: 'copy_url',
                    copy_code: url
                  })
                }
              ]
            })
          })
        }
      }
    }, { quoted: m })

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

  } catch (err) {
    console.error('Error tourl:', err)
    await sock.sendMessage(m.chat, { 
      text: `❌ Gagal mengunggah media: ${err.message || err}` 
    }, { quoted: m })
  }
}

handler.help = ['tourl', 'upload']
handler.tags = ['tools']
handler.command = ['tourl', 'upload', 'top4top']

export default handler