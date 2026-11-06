import axios from "axios"

const handler = async (m, { sock, text, reply }) => {
  
  if (!text) return reply(`Awali URL dengan http:// atau https://`)
  try {
    const gt = await axios.get(text, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0 Safari/537.36"
      },
      responseType: 'arraybuffer',
      maxRedirects: 5,
      timeout: 15000
    })
    await reply("Waiting. . .")
    const contentType = gt.headers['content-type'] || ''
    console.log(`Content-Type: ${contentType}`)

    const dataBuffer = Buffer.from(gt.data, 'binary')

    // JSON
    if (/json/i.test(contentType)) {
      try {
        const jsonData = JSON.parse(dataBuffer.toString('utf8'))
        return reply(JSON.stringify(jsonData, null, 2))
      } catch {
        return reply(dataBuffer.toString('utf8'))
      }
    }

    // Text
    if (/text/i.test(contentType)) {
      return reply(dataBuffer.toString('utf8'))
    }

    // Image / WebP
    if (/image\/webp/i.test(contentType) || /\.webp$/i.test(text)) {
      return sock.sendImageAsSticker(m.chat, text, m, { packname: "im", author: "Trina" })
    }
    if (/image/i.test(contentType)) {
      return sock.sendMessage(m.chat, { image: { url: text } }, { quoted: m })
    }

    // Video
    if (/video/i.test(contentType)) {
      return sock.sendMessage(m.chat, { video: { url: text } }, { quoted: m })
    }

    // Audio / MP3
    if (/audio/i.test(contentType) || /\.mp3$/i.test(text)) {
      return sock.sendMessage(m.chat, { audio: { url: text } }, { quoted: m })
    }

    // Zip
    if (/application\/zip/i.test(contentType) || /application\/x-zip-compressed/i.test(contentType)) {
      return sock.sendMessage(m.chat, { document: { url: text }, fileName: text.split("/").pop() }, { quoted: m })
    }

    // PDF
    if (/application\/pdf/i.test(contentType) || /\.pdf$/i.test(text)) {
      return sock.sendMessage(m.chat, { document: { url: text }, fileName: text.split("/").pop() }, { quoted: m })
    }

    // Fallback
    return reply(`MIME tidak dikenali: ${contentType}\n\nTeks / Data:\n${dataBuffer.toString('utf8')}`)
  } catch (error) {
    console.error(`Terjadi kesalahan: ${error}`)
    return reply(`Terjadi kesalahan saat mengakses URL:\n${error.message}`)
  }
}

handler.command = ["get"]
export default handler