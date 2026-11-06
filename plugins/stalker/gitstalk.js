import axios from 'axios'

let handler = async (m, { sock, text, usedPrefix, command }) => {
  try {
    let username = text?.trim()?.replace('@', '')

    if (!username) {
      return sock.sendMessage(m.chat, { 
        text: `⚠️ *Masukkan username GitHub!*\n\n*Contoh:*\n${usedPrefix + command} Quilava3050` 
      }, { quoted: m })
    }

    await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

    let apiKey = global.btc || 'umaasa'
    let url = `https://api.botcahx.eu.org/api/stalk/github?apikey=${encodeURIComponent(apiKey)}&username=${encodeURIComponent(username)}`

    let { data } = await axios.get(url)

    if (!data.status || !data.result || !data.result.user) {
      await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return sock.sendMessage(m.chat, { 
        text: '❌ Username tidak ditemukan atau API sedang bermasalah.' 
      }, { quoted: m })
    }

    let user = data.result.user

    // Format tanggal pembuatan akun
    let createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : '-'

    let caption = `🐙 *GITHUB STALKER*

• *ID:* ${user.idUser}
• *Username:* ${user.username}
• *Nama:* ${user.name || '-'}
• *Tipe:* ${user.type}
• *Perusahaan:* ${user.company || '-'}
• *Blog/Website:* ${user.blog || '-'}
• *Bio:* ${user.bio || '-'}
• *Dibuat Pada:* ${createdAt}

📊 *STATISTIK*
• *Repository Publik:* ${user.publicRepos.toLocaleString()}
• *Gist Publik:* ${user.publicGists.toLocaleString()}
• *Pengikut:* ${user.followers.toLocaleString()}
• *Mengikuti:* ${user.following.toLocaleString()}

🔗 *Link Profile:* ${user.githubUrl}`

    await sock.sendMessage(m.chat, {
      image: { url: user.avatarUrl },
      caption: caption
    }, { quoted: m })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('[GITHUB STALK ERROR]:', e)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await sock.sendMessage(m.chat, { 
      text: `❌ *Gagal Mengambil Data:*\n${e.message || e}` 
    }, { quoted: m })
  }
}

handler.help = ['gitstalk <username>']
handler.tags = ['tools']
handler.command = ['gitstalk', 'githubstalk', 'ghstalk']

export default handler