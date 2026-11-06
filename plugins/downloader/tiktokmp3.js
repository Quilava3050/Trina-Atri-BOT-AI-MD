import axios from 'axios'

let handler = async (m, { sock, text, usedPrefix, command }) => {
  const apiKey = global.btc
  if (!apiKey) {
    return sock.sendMessage(m.chat, { text: '⚠️ `global.btc` belum di-set di config!' }, { quoted: m })
  }

  let url = text?.trim()
  if (!url && m.quoted && m.quoted.text) {
    url = m.quoted.text.trim()
  }

  const tiktokRegex = /(https?:\/\/(?:vt|vm|www|v)\.tiktok\.com\/[^\s]+|https?:\/\/(?:www\.)?tiktok\.com\/@[^\s]+\/video\/[0-9]+)/i
  const match = url ? url.match(tiktokRegex) : null

  if (!match) {
    return sock.sendMessage(m.chat, { 
      text: `🎵 *TIKTOK AUDIO DOWNLOADER*\n\n📌 *Cara Penggunaan:*\n• *${usedPrefix + command} <link tiktok>*\n• Reply pesan yang berisi link TikTok dengan perintah *${usedPrefix + command}*` 
    }, { quoted: m })
  }

  const targetUrl = match[0]
  await sock.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

  try {
    const endpoint = `https://api.botcahx.eu.org/api/download/tiktok?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}`
    const { data } = await axios.get(endpoint)

    if (!data.status || !data.result || !data.result.audio || data.result.audio.length === 0) {
      throw new Error('Gagal mengambil audio dari link TikTok tersebut.')
    }

    const result = data.result
    const audioUrl = Array.isArray(result.audio) ? result.audio[0] : result.audio
    const title = result.title_audio || result.title || 'TikTok Audio'

    // 3. Download Audio ke Buffer
    const audioRes = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    })

    await sock.sendMessage(m.chat, {
      audio: Buffer.from(audioRes.data),
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`,
      ptt: false
    }, { quoted: m })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    sock.sendMessage(m.chat, { text: `❌ Gagal mengunduh audio: ${e.message || e}` }, { quoted: m })
  }
}

handler.help = ['ttmp3 <url>', 'tikitokmp3']
handler.tags = ['downloader']
handler.command = ['ttmp3','tiktokmp3']

export default handler