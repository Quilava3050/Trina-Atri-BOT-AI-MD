import axios from 'axios'

let handler = async (m, { sock, args, command, usedPrefix }) => {
  if (!args[0]) {
    return sock.sendMessage(m.chat, {
      text: `⚠️ Gunakan format: *${usedPrefix + command} <query> <jumlah?>*\n\nContoh:\n• ${usedPrefix + command} furina (1 gambar + tombol)\n• ${usedPrefix + command} furina 5 (5 gambar sebagai album, maks 10)`
    }, { quoted: m })
  }

  let count = 1
  let query = args.join(' ')

  const lastArg = args[args.length - 1]
  if (!isNaN(lastArg) && parseInt(lastArg) > 0) {
    count = parseInt(lastArg)
    query = args.slice(0, -1).join(' ')
  }

  try {
    await sock.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    const { data } = await axios.get('https://api.zansxart.me/api/anime/pixiv', {
      params: {
        apikey: global.zansxart,
        query: query,
        page: 1
      }
    })

    if (!data.status || !data.result || data.result.length === 0) {
      await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return sock.sendMessage(m.chat, {
        text: `❌ Artwork tidak ditemukan untuk pencarian: *${query}*`
      }, { quoted: m })
    }

    const shuffled = data.result.sort(() => 0.5 - Math.random())

    // 1. JIKA USER MINTA LEBIH DARI 1 (ALBUM MODE - MAKSIMAL 10 GAMBAR)
    if (count > 1) {
      const maxCount = Math.min(count, 10, shuffled.length)
      const selected = shuffled.slice(0, maxCount)

      const album = selected.map((v, i) => ({
        image: { url: v.urls?.regular || v.urls?.thumb },
        caption: i === 0 ? `🎨 *PIXIV ALBUM*\n📌 *Query:* ${query}\n📦 *Total:* ${selected.length} gambar` : undefined
      }))

      // Kirim sekaligus sebagai Native Album Message
      await sock.sendMessage(m.chat, { album }, { quoted: m })

    } 
    // 2. JIKA USER CUMA KETIK NAMA (SINGLE MODE - PAKE BUTTON)
    else {
      const item = shuffled[0]

      const caption = `🎨 *PIXIV SEARCH*\n\n` +
        `📌 *Judul:* ${item.title}\n` +
        `👤 *Author:* ${item.author?.name || 'Unknown'} (ID: ${item.author?.id || '-'})\n` +
        `📄 *Halaman:* ${item.pageCount || 1}\n` +
        `🆔 *ID Artwork:* ${item.id}\n` +
        `🏷️ *Tags:* ${item.tags ? item.tags.slice(0, 5).join(', ') : '-'}`

      await sock.sendMessage(m.chat, {
        image: { url: item.urls?.regular || item.urls?.thumb },
        caption: caption,
        footer: 'Klik tombol di bawah untuk cari artwork lain',
        buttons: [
          {
            buttonId: `${usedPrefix}${command} ${query}`,
            buttonText: { displayText: 'Next 🔄' },
            type: 1
          }
        ],
        headerType: 4
      }, { quoted: m })
    }

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    console.error("Error Pixiv Plugin:", err.response?.data || err.message)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await sock.sendMessage(m.chat, {
      text: 'Terjadi kesalahan saat mengambil gambar dari Pixiv.'
    }, { quoted: m })
  }
}

handler.help = ['pixiv <query> <jumlah?>']
handler.tags = ['anime']
handler.command = ['pixiv']

export default handler