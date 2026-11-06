import axios from 'axios'

let handler = async (m, { sock, text, usedPrefix, command }) => {
  try {
    let username = text?.trim()?.replace('@', '')

    if (!username) {
      return sock.sendMessage(m.chat, { 
        text: `⚠️ *Masukkan username Instagram!*\n\n*Contoh:*\n${usedPrefix + command} dhiekaaquila` 
      }, { quoted: m })
    }

    await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

    let apiKey = global.btc || 'umaasa'
    let url = `https://api.botcahx.eu.org/api/stalk/ig?apikey=${encodeURIComponent(apiKey)}&username=${encodeURIComponent(username)}`

    let { data } = await axios.get(url)

    if (!data.status || !data.result) {
      await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return sock.sendMessage(m.chat, { 
        text: '❌ Username tidak ditemukan atau API sedang bermasalah.' 
      }, { quoted: m })
    }

    let res = data.result
    let caption = `📸 *INSTAGRAM STALKER*

• *ID:* ${res.id}
• *Username:* @${res.username}
• *Nama:* ${res.fullName || '-'}
• *Status:* ${res.isVerified ? 'Verified ✅' : 'Biasa ❌'} | ${res.isPrivate ? 'Privat 🔒' : 'Publik 🔓'}
• *Kategori:* ${res.category || '-'}
• *Akun Bisnis:* ${res.isBusiness ? 'Ya 💼' : 'Tidak ❌'}
• *Bio:* ${res.bio || '-'}
• *Link Bio:* ${res.externalUrl || '-'}

📊 *STATISTIK*
• *Pengikut:* ${res.followers.toLocaleString()}
• *Mengikuti:* ${res.following.toLocaleString()}
• *Total Postingan:* ${res.postsCount.toLocaleString()}`

    let avatarUrl = res.photoUrlHd || res.photoUrl

    await sock.sendMessage(m.chat, {
      image: { url: avatarUrl },
      caption: caption
    }, { quoted: m })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('[IG STALK ERROR]:', e)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await sock.sendMessage(m.chat, { 
      text: `❌ *Gagal Mengambil Data:*\n${e.message || e}` 
    }, { quoted: m })
  }
}

handler.help = ['igstalk <username>']
handler.tags = ['tools']
handler.command = ['igstalk', 'instagramstalk', 'stalkig']

export default handler
