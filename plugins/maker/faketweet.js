import axios from 'axios'
import { UploadFileUgu } from '../../control/ugUploade.js'

let handler = async (m, { sock, text, usedPrefix, command }) => {
  const apiKey = global.anabot
  if (!apiKey) {
    return sock.sendMessage(m.chat, { text: '⚠️ `global.anabot` belum di-set!' }, { quoted: m })
  }

  if (!text) {
    const usage = `✍️ *FAKE TWEET MAKER*

📌 *Penggunaan:*
1. **Pake PP Sendiri:**
   └ *${usedPrefix + command} me,username,teks*

2. **Pake Gambar (Kirim/Reply Gambar):**
   └ *${usedPrefix + command} username,teks*

💡 *Contoh:*
• *${usedPrefix + command} me,kanda,aku ai*
• Reply gambar + *${usedPrefix + command} kanda,Hello World*`

    return sock.sendMessage(m.chat, { text: usage }, { quoted: m })
  }

  await sock.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''
    let avatarUrl = ''
    let username = ''
    let messageText = ''

    let parts = text.split(',').map(v => v.trim())

    if (parts[0].toLowerCase() === 'me') {
      username = parts[1] || m.sender.split('@')[0]
      messageText = parts.slice(2).join(',').trim()

      try {
        avatarUrl = await sock.profilePictureUrl(m.sender, 'image')
      } catch {
        avatarUrl = 'https://files.catbox.moe/9ibkfl.jpg'
      }
    } else if (mime.startsWith('image/')) {
      username = parts[0] || m.sender.split('@')[0]
      messageText = parts.slice(1).join(',').trim()

      const mediaBuffer = await q.download()
      avatarUrl = await UploadFileUgu(mediaBuffer)
    } else {
      username = parts[0] || m.sender.split('@')[0]
      messageText = parts.slice(1).join(',').trim()

      try {
        avatarUrl = await sock.profilePictureUrl(m.sender, 'image')
      } catch {
        avatarUrl = 'https://i.top4top.io/p_3917a9ojd1.jpg'
      }
    }

    if (!messageText) {
      return sock.sendMessage(m.chat, { text: '⚠️ Teks tweet tidak boleh kosong!' }, { quoted: m })
    }

    // Hit API anabot dengan URL param yang sudah di-encode
    const endpoint = `https://anabot.my.id/api/maker/generateFakeTweet?text=${encodeURIComponent(messageText)}&displayName=${encodeURIComponent(username)}&username=${encodeURIComponent(username)}&avatar=${encodeURIComponent(avatarUrl)}&verified=true&backgroundColor=%2315202b&apikey=${apiKey}`

    const { data } = await axios.get(endpoint, {
      responseType: 'arraybuffer'
    })

    await sock.sendMessage(m.chat, { 
      image: Buffer.from(data),
      caption: `✨ Fake Tweet berhasil dibuat!`
    }, { quoted: m })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    sock.sendMessage(m.chat, { text: `❌ Gagal: ${e.response?.status === 500 ? 'Server anabot gagal mengambil/membaca gambar avatar tersebut.' : (e.message || e)}` }, { quoted: m })
  }
}

handler.help = ['ftweet']
handler.tags = ['maker']
handler.command = ['faketweet', 'ftweet', 'tweet']

export default handler