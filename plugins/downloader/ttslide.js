import fetch from 'node-fetch'

let handler = async (m, { sock, text, usedPrefix, command }) => {
  // Objek Fake Quote (fkontak)
  const fkontak = {
    key: {
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast"
    },
    message: {
      contactMessage: {
        displayName: global.namaOwner || "Owner",
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${global.namaOwner || "Owner"};;;\nFN:${global.namaOwner || "Owner"}\nEND:VCARD`
      }
    }
  }

  if (!text) {
    return sock.sendMessage(m.chat, { 
      text: `*Format Salah!*\n\nContoh: *${usedPrefix + command}* https://vt.tiktok.com/ZSVmowuPC/` 
    }, { quoted: fkontak })
  }

  // Validasi URL TikTok sederhan
  if (!text.includes('tiktok.com')) {
    return sock.sendMessage(m.chat, { 
      text: `❌ *URL Tidak Valid!* Pastikan tautan berasal dari TikTok.` 
    }, { quoted: fkontak })
  }

  await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const apiKey = global.btc || "umaasa"
    const apiUrl = `https://api.botcahx.eu.org/api/download/tiktokslide?apikey=${apiKey}&url=${encodeURIComponent(text.trim())}`

    const res = await fetch(apiUrl)
    const json = await res.json()

    if (!json.status || !json.result) {
      throw new Error("Gagal mengambil data dari TikTok Slide. Pastikan URL benar.")
    }

    const { title, totalSlide, images, audio } = json.result

    if (!images || images.length === 0) {
      throw new Error("Tidak ada gambar yang ditemukan pada tautan TikTok ini.")
    }

    await sock.sendMessage(m.chat, { 
      text: `🎵 *TikTok Slide Downloader*\n\n📝 *Judul:* ${title || 'Tanpa Judul'}\n📸 *Total Slide:* ${totalSlide || images.length}\n\n_Mengirimkan slide gambar..._` 
    }, { quoted: fkontak })

    // 1. Kirim setiap slide gambar
    for (let i = 0; i < images.length; i++) {
      await sock.sendMessage(m.chat, { 
        image: { url: images[i] },
        caption: `📸 *Slide ${i + 1}/${images.length}*`
      }, { quoted: fkontak })
    }

    // 2. Kirim Audio/Musik jika tersedia
    if (audio && audio.length > 0 && audio[0]) {
      await sock.sendMessage(m.chat, { 
        audio: { url: audio[0] },
        mimetype: 'audio/mp4',
        fileName: 'tiktok_slide_audio.mp3'
      }, { quoted: fkontak })
    }

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { 
      text: `❌ *Error:* ${e.message}` 
    }, { quoted: fkontak })
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
  }
}

handler.help = ['tiktokslide <url>']
handler.tags = ['downloader']
handler.command = ['tiktokslide', 'ttslide', 'ttslide-dl']

export default handler