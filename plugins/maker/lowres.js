import sharp from 'sharp'

let handler = async (m, { sock, text, usedPrefix, command }) => {
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || ''

  if (!mime.startsWith('image/')) {
    return sock.sendMessage(m.chat, { 
      text: `🖼️ *LOW QUALITY / MOLDY IMAGE GENERATOR*\n\n📌 *Cara Penggunaan:*\nKirim atau reply gambar dengan perintah *${usedPrefix + command} [level]*\n\n💡 *Contoh:*\n• Reply gambar + *${usedPrefix + command}*\n• Reply gambar + *${usedPrefix + command} 30* (Makin kecil angka, makin hancur)` 
    }, { quoted: m })
  }

  await sock.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

  try {
    const imgBuffer = await q.download()

    let targetSize = parseInt(text) || 50
    if (targetSize < 10) targetSize = 10
    if (targetSize > 200) targetSize = 200

    const metadata = await sharp(imgBuffer).metadata()
    const origWidth = metadata.width || 800
    const origHeight = metadata.height || 800

    const processedBuffer = await sharp(imgBuffer)
      .resize(targetSize, null, { fit: 'contain' })
      .resize(origWidth, origHeight, { kernel: sharp.kernel.nearest })
      .jpeg({ quality: 1, chromaSubsampling: '4:2:0' })
      .toBuffer()

    await sock.sendMessage(m.chat, {
      image: processedBuffer,
      caption: `🗑️ *Kualitas berhasil diturunkan!* (Size: ${targetSize}px)`
    }, { quoted: m })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    sock.sendMessage(m.chat, { text: `❌ Gagal memproses gambar: ${e.message || e}` }, { quoted: m })
  }
}

handler.help = ['lowqual <level>', 'moldy', 'lowres']
handler.tags = ['maker']
handler.command = ['lowqual','moldy','lowres']

export default handler