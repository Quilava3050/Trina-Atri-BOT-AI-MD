import axios from 'axios'

const handler = async (m, { sock, text, reply, usedPrefix, command }) => {
  
  if (!text) {
    return reply(`Contoh: ${usedPrefix + command} url nya`)
  }

  // Validasi simpel biar user masukin link yang bener
  if (!/^https?:\/\//.test(text)) {
    return reply('Link harus diawali dengan http:// atau https:// bwang!')
  }

  reply('Wait...')

  try {
    const api = `${global.api.free3}/tools/webtozip?url=${encodeURIComponent(text)}`
    const { data } = await axios.get(api)

    // Cek respon API sesuai struktur JSON lu
    if (!data?.status || !data?.result?.downloadUrl) {
      return reply(`❌ Gagal nge-zip website. Detail: ${data?.result?.error?.text || 'Server error'}`)
    }

    const res = data.result
    const zipUrl = res.downloadUrl

    // Download file ZIP-nya jadi Buffer
    const zipData = await axios.get(zipUrl, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(zipData.data)

    // Bersihin nama URL biar asik dijadiin nama file ZIP
    const rawDomain = text.replace(/^https?:\/\//, '').replace(/\/$/, '')

    // Kirim file ZIP-nya sebagai Document ke chat WA
    await sock.sendMessage(m.chat, { 
      document: buffer, 
      fileName: `${rawDomain}_clone.zip`,
      mimetype: 'application/zip',
      caption: `📦 *WEB TO ZIP RESULT*\n\n› 🌐 *URL:* ${res.url}\n› 🗂️ *Total File:* ${res.copiedFilesAmount} files\n\n_Tools by ${global.namaBot}_` 
    }, { quoted: m })

  } catch (e) {
    console.error('[Web2Zip Error]:', e.response?.data || e.message || e)
    reply(`❌ Terjadi kesalahan sistem: ${e.message}`)
  }
}

handler.command = ["webtozip", "web2zip", "cloneweb"]

export default handler