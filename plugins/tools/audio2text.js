import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

let handler = async (m, { sock }) => {
  if (!global.groqKey) {
    return m.reply('API key Groq belum dikonfigurasi. Atur environment variable GROQ_API_KEY terlebih dahulu.')
  }

  // 1. Cek apakah pesan yang di-reply/dikirim adalah audio atau voice note
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || ''

  if (!/audio/.test(mime)) {
    return m.reply('Harap reply atau kirim pesan suara/audio dengan ketik *.stt*')
  }

  m.reply('Sedang mengunduh dan memproses audio...')

  let tempFilePath = null

  try {
    // 2. Download media audio dari WhatsApp
    const messageType = q.mtype ? q.mtype.replace(/Message/i, '') : 'audio'
    const stream = await downloadContentFromMessage(q.msg || q, messageType)
    
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    // 3. Simpan sementara ke direktori lokal
    const tempFileName = `audio_${Date.now()}.mp3`
    tempFilePath = path.join('./', tempFileName)
    fs.writeFileSync(tempFilePath, buffer)

    // 4. Kirim ke Groq Whisper API untuk Transkripsi
    const groq = new Groq({ apiKey: global.groqKey })
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-large-v3', // Model Whisper terbaik
      language: 'id', // Bahasa Indonesia (bisa dihapus jika ingin auto-detect)
      response_format: 'text'
    })

    // 5. Kirim hasil transkripsi ke user
    await m.reply(`*Hasil Transkripsi Audio:*\n\n"${transcription}"`)

  } catch (error) {
    console.error('STT Error:', error)
    await m.reply(`Gagal memproses audio: ${error.message || error}`)
  } finally {
    // 6. Hapus file sampah sementara
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }
  }
}

handler.command = ['audio2text']
export default handler