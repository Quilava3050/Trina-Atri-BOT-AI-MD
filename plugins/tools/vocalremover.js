import axios from 'axios'
import uploadTop4top from '../../control/uploadTop4top.js'

let handler = async (m, { sock, usedPrefix, command }) => {
  const apiKey = global.btc
  if (!apiKey) {
    return sock.sendMessage(m.chat, { text: '⚠️ `global.btc` belum di-set di config!' }, { quoted: m })
  }

  // 1. Cek media audio / vn (reply atau kirim langsung)
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || q.mediaType || ''

  if (!/audio/g.test(mime)) {
    return sock.sendMessage(m.chat, { 
      text: `🎙️ *VOICE / VOCAL REMOVER*\n\n📌 *Cara Penggunaan:*\nKirim atau reply audio/voice note dengan caption *${usedPrefix + command}*` 
    }, { quoted: m })
  }

  await sock.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

  try {
    // 2. Download audio buffer
    const audioBuffer = await q.download?.()
    if (!audioBuffer) throw new Error('Gagal mengunduh file audio dari WhatsApp.')

    // 3. Upload media via Top4top
    const audioUrl = await uploadTop4top(audioBuffer)

    // 4. Fetch data dari API Botcahx
    const endpoint = `https://api.botcahx.eu.org/api/tools/voiceremover?apikey=${apiKey}&url=${encodeURIComponent(audioUrl)}`
    const { data } = await axios.get(endpoint, { timeout: 180000 })

    if (!data.status || !data.result || data.result.error) {
      throw new Error(data.result?.message || data.message || 'Gagal memproses audio.')
    }

    const { vocal_path, instrumental_path } = data.result

    if (!vocal_path || !instrumental_path) {
      throw new Error('URL hasil pemisahan vokal/instrumen tidak ditemukan.')
    }

    // 5. Download hasil audio ke Buffer
    const [vocalRes, instRes] = await Promise.all([
      axios.get(vocal_path, { responseType: 'arraybuffer', timeout: 60000 }),
      axios.get(instrumental_path, { responseType: 'arraybuffer', timeout: 60000 })
    ])

    // 6. Kirim Audio Vokal
    await sock.sendMessage(m.chat, {
      audio: Buffer.from(vocalRes.data),
      mimetype: 'audio/mpeg',
      fileName: 'vocals.mp3',
      ptt: false
    }, { quoted: m })

    // 7. Kirim Audio Instrumen / Accompaniment
    await sock.sendMessage(m.chat, {
      audio: Buffer.from(instRes.data),
      mimetype: 'audio/mpeg',
      fileName: 'accompaniment.mp3',
      ptt: false
    }, { quoted: m })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    
    let errMsg = e.message || e
    if (e.response && e.response.status === 524) {
      errMsg = 'Server AI mengalami Timeout (524). Server pemroses sedang sibuk atau durasi audio terlalu panjang.'
    }

    sock.sendMessage(m.chat, { 
      text: `❌ *Gagal memproses audio:*\n${errMsg}` 
    }, { quoted: m })
  }
}

handler.help = ['voiceremover', 'vocalremover']
handler.tags = ['tools']
handler.command = ['voiceremover', 'vocalremover','vrm']

export default handler