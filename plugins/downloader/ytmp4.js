import axios from 'axios'
import { getSavetubeDownload } from '../../control/savetube.js'

let handler = async (m, { sock, conn, text, usedPrefix, command }) => {
  const client = sock || conn || global.sock
  const input = text?.trim()

  if (!input) {
    return sock.sendMessage(m.chat, { 
      text: `⚠️ Masukkan URL YouTube!\n\nContoh:\n*${usedPrefix + command}* https://youtu.be/TM4UNT4HGfE` 
    }, { quoted: m })
  }

  await sock.sendMessage(m.chat, { text: '⏳ Sedang memproses dan mengunduh video...' }, { quoted: m })

  try {
    const result = await getSavetubeDownload(input, 'video')
    const videoRes = await axios.get(result.download, {
      responseType: 'arraybuffer',
      timeout: 120000,
      maxContentLength: 500 * 1024 * 1024,
      maxBodyLength: 500 * 1024 * 1024
    })

    const videoBuffer = Buffer.from(videoRes.data)
    const contentType = String(videoRes.headers['content-type'] || '').toLowerCase()
    if (contentType.includes('application/json') || videoBuffer.toString('utf8', 0, 1) === '{') {
      let responseBody
      try {
        responseBody = JSON.parse(videoBuffer.toString('utf8'))
      } catch {
        throw new Error('API mengembalikan respons JSON, bukan file MP4.')
      }

      throw new Error(responseBody.hint || responseBody.message || 'API mengembalikan metadata preview, bukan file MP4.')
    }

    if (videoBuffer.length < 12 || videoBuffer.toString('ascii', 4, 8) !== 'ftyp') {
      throw new Error('Data yang diterima bukan file MP4 yang valid. API mungkin masih mengirim preview metadata.')
    }

    const sizeInMB = videoBuffer.length / (1024 * 1024)

    const captionText = `Judul: ${result.title}\nKualitas: ${result.quality}p\nUkuran file: ${sizeInMB.toFixed(2)} MB`

    if (sizeInMB > 20) {
      await client.sendMessage(m.chat, {
        document: videoBuffer,
        mimetype: 'video/mp4',
        fileName: 'youtube_video.mp4',
        caption: captionText
      }, { quoted: m })
    } else {
      await client.sendMessage(m.chat, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption: captionText
      }, { quoted: m })
    }

  } catch (e) {
    console.error('[YTMP4 Error]:', e)
    const responseData = e.response?.data
    const responseText = Buffer.isBuffer(responseData) || responseData instanceof ArrayBuffer
      ? Buffer.from(responseData).toString('utf8').slice(0, 500)
      : responseData?.message || responseData
    await sock.sendMessage(m.chat, { 
      text: `❌ Gagal mengunduh video: ${responseText || e.message || e}` 
    }, { quoted: m })
  }
}

handler.help = ['ytmp4 <url>']
handler.tags = ['downloader']
handler.command = ['ytmp4', 'ytv', 'ytvideo']

export default handler