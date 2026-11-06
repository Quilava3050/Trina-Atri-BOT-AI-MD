import axios from 'axios'

let handler = async (m, { sock, text, usedPrefix, command }) => {
  try {
    let id = text?.trim()

    if (!id) {
      return sock.sendMessage(m.chat, { 
        text: `⚠️ *Masukkan ID Free Fire!*\n\n*Contoh:*\n${usedPrefix + command} 3131512676` 
      }, { quoted: m })
    }

    if (isNaN(id)) {
      return sock.sendMessage(m.chat, { 
        text: '❌ *ID harus berupa angka!*' 
      }, { quoted: m })
    }

    await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

    let apiKey = global.btc || 'umaasa'
    let url = `https://api.botcahx.eu.org/api/stalk/ff?apikey=${encodeURIComponent(apiKey)}&id=${encodeURIComponent(id)}`

    let { data } = await axios.get(url)

    if (!data.status || !data.result || !data.result.userNameGame) {
      await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return sock.sendMessage(m.chat, { 
        text: '❌ ID tidak ditemukan atau API sedang bermasalah.' 
      }, { quoted: m })
    }

    let caption = `🎮 *FREE FIRE STALKER*

• *ID:* ${id}
• *Nickname:* ${data.result.userNameGame}`

    await sock.sendMessage(m.chat, { text: caption }, { quoted: m })
    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('[FF STALK ERROR]:', e)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await sock.sendMessage(m.chat, { 
      text: `❌ *Gagal Mengambil Data:*\n${e.message || e}` 
    }, { quoted: m })
  }
}

handler.help = ['ffstalk <id>']
handler.tags = ['tools']
handler.command = ['ffstalk', 'stalkff', 'freethink']

export default handler