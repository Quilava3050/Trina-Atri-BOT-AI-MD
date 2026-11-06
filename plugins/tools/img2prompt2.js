import axios from 'axios'
import uploadTop4top from '../../control/uploadTop4top.js'

let handler = async (m, { sock, usedPrefix, command }) => {
  const apiKey = global.zansxart
  if (!apiKey) {
    return sock.sendMessage(m.chat, { text: '⚠️ `global.zansxart` belum di-set di config!' }, { quoted: m })
  }

  // 1. Cek media gambar (reply atau kirim langsung)
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || q.mediaType || ''

  if (!/image/g.test(mime) || /webp/g.test(mime)) {
    return sock.sendMessage(m.chat, { 
      text: `🖼️ *IMAGE TO PROMPT (ZANSXART)*\n\n📌 *Cara Penggunaan:*\nKirim atau reply gambar dengan caption *${usedPrefix + command}*` 
    }, { quoted: m })
  }

  await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

  try {
    // 2. Download & upload media via Top4top
    const imgBuffer = await q.download?.()
    if (!imgBuffer) throw new Error('Gagal mengunduh gambar dari WhatsApp.')

    const imageUrl = await uploadTop4top(imgBuffer)

    // 3. Fetch data dari API Zansxart dengan Custom Header
    const endpoint = `https://api.zansxart.me/api/ai/imagetoprompt?url=${encodeURIComponent(imageUrl)}`
    const { data } = await axios.get(endpoint, {
      headers: {
        'X-API-Key': apiKey
      },
      timeout: 60000
    })

    if (!data.status || !data.result) {
      throw new Error(data.message || 'Gagal menganalisis gambar.')
    }

    const { prompt, negative_prompt, style, tags, description } = data.result

    // 4. Susun pesan balasan secara rapi
    let txt = `✨ *IMAGE TO PROMPT GENERATOR*\n\n`
    if (style) txt += `🎨 *Style:* ${style}\n`
    if (description) txt += `📝 *Description:* ${description}\n\n`
    
    txt += `📌 *Prompt:*\n\`\`\`${prompt}\`\`\`\n\n`
    
    if (negative_prompt) {
      txt += `🚫 *Negative Prompt:*\n\`\`\`${negative_prompt}\`\`\`\n\n`
    }
    
    if (tags && tags.length > 0) {
      txt += `🏷️ *Tags:* ${tags.map(t => `#${t.replace(/\s+/g, '_')}`).join(', ')}`
    }

    // 5. Kirim hasil
    await sock.sendMessage(m.chat, { text: txt.trim() }, { quoted: m })
    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    sock.sendMessage(m.chat, { 
      text: `❌ *Gagal memproses gambar:*\n${e.message || e}` 
    }, { quoted: m })
  }
}

handler.help = ['img2prompt2', 'i2p']
handler.tags = ['tools', 'ai']
handler.command = ['img2prompt2', 'i2p']

export default handler