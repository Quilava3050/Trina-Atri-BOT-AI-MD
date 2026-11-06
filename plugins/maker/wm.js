import { Sticker, StickerTypes } from 'wa-sticker-formatter'

let handler = async (m, { sock, text, usedPrefix, command }) => {
  try {
    // 1. Cek apakah user me-reply pesan
    if (!m.quoted) {
      return sock.sendMessage(m.chat, { 
        text: `⚠️ *Reply stiker yang ingin diubah watermark-nya!*\n\n*Contoh:*\n${usedPrefix + command} MyPack|MyAuthor` 
      }, { quoted: m })
    }

    // 2. Cek apakah media yang di-reply adalah stiker (WebP)
    let mime = m.quoted.mimetype || m.quoted.mediaType || ''
    if (!/webp/.test(mime)) {
      return sock.sendMessage(m.chat, { 
        text: '❌ *Pesan yang di-reply bukan stiker!* Harap reply stiker format `.webp`.' 
      }, { quoted: m })
    }

    await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    // 3. Download buffer stiker
    let img = await m.quoted.download()
    if (!img) {
      await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return sock.sendMessage(m.chat, { 
        text: '❌ Gagal mengunduh stiker. Silakan coba lagi.' 
      }, { quoted: m })
    }

    // 4. Parsing packname dan author
    let [packname, ...author] = (text || '').split('|')
    author = (author || []).join('|')

    packname = packname?.trim() || global.stickpack || 'Sticker Pack'
    author = author?.trim() || global.stickauth || 'Bot'

    // 5. Injeksi Exif Metadata Baru
    const stickerObj = new Sticker(img, {
      pack: packname,
      author: author,
      type: StickerTypes.FULL,
      quality: 100
    })

    const stikerBuffer = await stickerObj.toBuffer()

    // 6. Kirim Stiker Hasil WM
    await sock.sendMessage(m.chat, { sticker: stikerBuffer }, { quoted: m })
    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('[WM STICKER ERROR]:', e)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    
    // Kirim rincian error langsung ke WA
    await sock.sendMessage(m.chat, { 
      text: `❌ *Proses WM Gagal:*\n${e.message || e}` 
    }, { quoted: m })
  }
}

handler.help = ['wm <packname|author>']
handler.command = ['wm', 'colong', 'take']

export default handler