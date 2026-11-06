import axios from 'axios'
import fs from 'fs'
import { ImageUploadService } from 'node-upload-images'

const handler = async (m, { sock, text, reply, usedPrefix, command }) => {
  
  if (!text) {
    return reply(`Contoh: *${usedPrefix + command} Qilatri* reply foto/ kirim foto dengan caption`)
  }

  const nickName = text.substring(0, 20)

  const qmsg = m.quoted ? m.quoted : m
  const mime = (qmsg.msg || qmsg).mimetype || ''

  if (!/image/.test(mime)) {
    return reply(`Contoh: *${usedPrefix + command} Qilatri* reply foto/ kirim foto dengan caption`)
  }

  reply('Wait...')

  let mediaPath; 

  try {
    mediaPath = await sock.downloadAndSaveMediaMessage(qmsg)
    
    const service = new ImageUploadService('pixhost.to')
    let buffer = fs.readFileSync(mediaPath)
    
    // Tarik link dari uploader
    let { directLink } = await service.uploadFromBinary(buffer, 'trina.png')

    // Langsung hapus file temporary
    if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath)

    if (!directLink) {
      return reply("❌ Gagal mendapatkan URL dari Pixhost.")
    }

    // Cek apakah linknya valid HTTP dan gak kepanjangan
    if (!directLink.startsWith('http') || directLink.length > 500) {
      return reply(`⚠️ *PANTES EROR 414 BWANG!*\n\nTernyata uploader lu ngasih output yang kepanjangan/bukan link. Liat nih hasilnya:\n\n${directLink.substring(0, 200)}... (kepanjangan)`)
    }

    // Tembak API NexRay pake URL directLink (Digabung langsung ke URL biar aman)
    const apiLobby = `${global.api.free3}/maker/fakelobyml?avatar=${encodeURIComponent(directLink)}&nickname=${encodeURIComponent(nickName)}`
    
    const { data } = await axios.get(apiLobby, { responseType: 'arraybuffer' })

    try {
      const jsonCheck = JSON.parse(data.toString())
      if (jsonCheck && jsonCheck.status === false) {
        return reply(`❌ Error API: ${jsonCheck.message || 'Gagal membuat lobby.'}`)
      }
    } catch (e) {
      // Abaikan, datanya murni gambar
    }

    await sock.sendMessage(m.chat, { 
      image: Buffer.from(data), 
      caption: `🎮 *FAKE LOBBY MLBB* 🎮\n› Nickname: *${nickName}*\n\n_Maker by ${global.namaBot}_` 
    }, { quoted: m })

  } catch (e) {
    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath)
    console.error('[Lobby ML Maker Error]:', e.response?.data || e.message || e)
    reply(`❌ Terjadi kesalahan sistem: ${e.response?.status === 414 ? '414 URI Too Long (Teks/URL kepanjangan)' : (e.message || e)}`)
  }
}

handler.command = ["lobyml", "fakelobyml", "lobby"]
export default handler