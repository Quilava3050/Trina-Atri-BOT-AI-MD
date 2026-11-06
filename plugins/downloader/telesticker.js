import axios from 'axios'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'

let handler = async (m, { sock, args, command, usedPrefix }) => {
  if (!args[0]) {
    return sock.sendMessage(m.chat, {
      text: `⚠️ Gunakan format: *${usedPrefix + command} <url_pack_telegram>*\n\nContoh:\n• ${usedPrefix + command} https://t.me/addstickers/SiniKenalan`
    }, { quoted: m })
  }

  const inputUrl = args[0]

  try {
    await sock.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    // Panggil API BOTCAHX
    const { data } = await axios.get('https://api.botcahx.eu.org/api/download/telesticker', {
      params: {
        apikey: global.btc,
        url: inputUrl
      }
    })

    if (!data.status || !data.result || data.result.length === 0) {
      await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return sock.sendMessage(m.chat, {
        text: `❌ Sticker pack tidak ditemukan atau URL salah.`
      }, { quoted: m })
    }

    const allStickers = data.result
    const packNameMatch = inputUrl.match(/addstickers\/([^/]+)/i)
    const packName = packNameMatch ? packNameMatch[1] : 'Telegram Pack'

    // Konversi tiap URL WebP menjadi Buffer Stiker resmi WA
    const stickersPayload = await Promise.all(
      allStickers.map(async (item) => {
        const sticker = new Sticker(item.url, {
          pack: packName,
          author: 'TRINA THE EXCLUSIVE AI',
          type: StickerTypes.FULL,
          quality: 70
        })
        const buffer = await sticker.toBuffer()
        return { data: buffer }
      })
    )

    // Cover menggunakan buffer dari stiker pertama
    const coverBuffer = stickersPayload[0].data

    await sock.sendMessage(m.chat, {
      cover: coverBuffer,
      stickers: stickersPayload,
      name: `📦 ${packName}`,
      publisher: '🌟 TRINA THE EXCLUSIVE',
      description: `Downloaded via Telegram (${allStickers.length} stickers)`
    }, { quoted: m })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    console.error("Error Telesticker Plugin:", err.response?.data || err.message)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await sock.sendMessage(m.chat, {
      text: 'Terjadi kesalahan saat mengolah sticker dari Telegram.'
    }, { quoted: m })
  }
}

handler.help = ['telesticker <url>']
handler.tags = ['sticker']
handler.command = ['telesticker', 'tgsticker', 'stele']

export default handler