import axios from 'axios'
import FormData from 'form-data'
import crypto from 'crypto'
import fs from 'fs'
import { join } from 'path'

let handler = async (m, { sock, usedPrefix, command }) => {
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

  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  
  if (!/image\/(jpe?g|png|webp)/.test(mime)) {
    return sock.sendMessage(m.chat, { 
      text: `Kirim atau balas gambar dengan perintah *${usedPrefix + command}* untuk menghapus watermark!` 
    }, { quoted: fkontak })
  }

  await sock.sendMessage(m.chat, { text: '_Sedang diproses, tunggu sebentar ya..._' }, { quoted: fkontak })

  try {
    let img = await q.download()
    let fileName = join('./tmp', `${Date.now()}.jpg`)
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')
    fs.writeFileSync(fileName, img)

    // Proses Unwatermark
    let result = await unwatermark(fileName)
    
    if (result && result.output_url) {
      await sock.sendMessage(m.chat, { 
        image: { url: result.output_url }, 
        caption: `✅ *Berhasil menghapus watermark!*` 
      }, { quoted: fkontak })
    } else {
      await sock.sendMessage(m.chat, { text: 'Gagal memproses gambar.' }, { quoted: fkontak })
    }

    // Hapus file temporary
    if (fs.existsSync(fileName)) fs.unlinkSync(fileName)
  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { text: 'Terjadi kesalahan saat memproses gambar.' }, { quoted: fkontak })
  }
}

handler.help = ['removewm']
handler.tags = ['ai']
handler.command = ['removewm', 'nowm'];

export default handler

// --- FUNGSI INTI (Sudah disesuaikan ke ESM) ---

async function createjob(img, productSerial) {
  const form = new FormData()
  form.append('original_image_file', fs.createReadStream(img))
  form.append('output_format', 'jpg')
  form.append('is_remove_text', 'true')
  form.append('is_remove_logo', 'true')
  form.append('is_enhancer', 'true')

  const r = await axios.post('https://api.unwatermark.ai/api/web/v1/image-watermark-auto-remove-upgrade/create-job',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Product-Serial': productSerial,
        'Product-Code': '067003',
        'origin': 'https://unwatermark.ai',
        'referer': 'https://unwatermark.ai/'
      }
    }
  )
  return r.data.result.job_id
}

async function getjob(jobId, productSerial) {
  const r = await axios.get(`https://api.unwatermark.ai/api/web/v1/image-watermark-auto-remove-upgrade/get-job/${jobId}`,
    {
      headers: {
        'Product-Serial': productSerial,
        'Product-Code': '067003',
        'origin': 'https://unwatermark.ai',
        'referer': 'https://unwatermark.ai/'
      }
    }
  )
  return r.data
}

async function unwatermark(img) {
  const productSerial = crypto.randomUUID()
  const jobId = await createjob(img, productSerial)

  // Polling tiap 3 detik sampai selesai
  for (let i = 0; i < 20; i++) { // Maksimal 60 detik (20 kali loop)
    await new Promise(r => setTimeout(r, 3000))
    const s = await getjob(jobId, productSerial)

    if (s.code === 100000 && s.result?.output_url) {
      return {
        output_url: Array.isArray(s.result.output_url) ? s.result.output_url[0] : s.result.output_url
      }
    }
    if (s.code === 100001) continue // Masih proses
  }
  return null
}