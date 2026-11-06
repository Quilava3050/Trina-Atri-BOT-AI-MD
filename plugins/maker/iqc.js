import uploadImage from '../../control/ugUploade.js'
import axios from 'axios'

let handler = async (m, { sock, conn, text, usedPrefix, command }) => {
  const client = sock || conn || global.sock

  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  let teks = text ? text : (m.quoted ? m.quoted.text : '')

  let apiKey = global.zansxart

  if (/image/.test(mime)) {
    await sock.sendMessage(m.chat, { text: '⏳ Mohon tunggu sebentar...' }, { quoted: m })

    try {
      let media = await q.download()
      if (!media) throw new Error('Gagal mendownload media dari WhatsApp.')

      let imageUrl = await uploadImage(media)
      let message = teks?.trim() || ' '
      let apiUrl = `https://api.zansxart.me/api/maker/iqc?text=${encodeURIComponent(message)}&image=${encodeURIComponent(imageUrl)}`

      let res = await axios.get(apiUrl, {
        headers: { 'X-API-Key': apiKey },
        responseType: 'arraybuffer'
      })

      let buffer = Buffer.from(res.data)

      await client.sendMessage(m.chat, {
        image: buffer,
        caption: `◦ *Text* : ${message}`
      }, { quoted: m })

    } catch (e) {
      console.error("[IQC Image Error]:", e)
      await sock.sendMessage(m.chat, { text: `❌ Gagal memproses IQC gambar: ${e.message || e}` }, { quoted: m })
    }

  } 

  else {
    if (!teks) {
      return sock.sendMessage(m.chat, { 
        text: `⚠️ Kirim/reply gambar dengan teks atau masukkan teks langsung.\n\nContoh:\n*${usedPrefix + command}* aku tresno kowe` 
      }, { quoted: m })
    }

    await sock.sendMessage(m.chat, { text: '⏳ Mohon tunggu sebentar...' }, { quoted: m })

    try {
      let apiUrl = `https://api.zansxart.me/api/maker/iqc?text=${encodeURIComponent(teks)}`

      let res = await axios.get(apiUrl, {
        headers: { 'X-API-Key': apiKey },
        responseType: 'arraybuffer'
      })

      let buffer = Buffer.from(res.data)

      await client.sendMessage(m.chat, {
        image: buffer,
        caption: `◦ *Text* : ${teks}`
      }, { quoted: m })

    } catch (e) {
      console.error("[IQC Text Error]:", e)
      await sock.sendMessage(m.chat, { text: `❌ Gagal membuat IQC teks: ${e.message || e}` }, { quoted: m })
    }
  }
}

handler.help = ['iqc <teks/image>']
handler.tags = ['maker']
handler.command = ['iqc', 'fakechat', 'iphonequote']

export default handler