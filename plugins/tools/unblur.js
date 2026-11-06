import axios from 'axios'
import FormData from 'form-data'

const TARGET_URL = 'https://cloudinary.com/tools/image-upscale'
const SIGNER_URL = 'https://cloudinary-tools.netlify.app/.netlify/functions/sign-upload-params'

const FALLBACK_CONFIG = {
  cloudName: 'dtz0urit6',
  apiKey: '985946268373735',
  uploadPreset: 'cloudinary-tools'
}

const client = axios.create({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Referer: TARGET_URL
  }
})

async function getDynamicConfig() {
  try {
    const htmlParams = await client.get(TARGET_URL)
    const scriptMatch = htmlParams.data.match(/src="([^"]*\/app\.js[^"]*)"/)

    if (!scriptMatch) throw new Error('Path app.js tidak ditemukan')

    const appJsUrl = new URL(scriptMatch[1], TARGET_URL).href
    const jsParams = await client.get(appJsUrl)
    const jsContent = jsParams.data

    const cloudNameMatch = jsContent.match(
      /cloudName\s*=\s*\(isLocal\)\s*\?\s*'[^']+'\s*:\s*'([^']+)'/
    )
    const apiKeyMatch = jsContent.match(
      /api_key\s*=\s*\(isLocal\)\s*\?\s*'[^']+'\s*:\s*'([^']+)'/
    )
    const presetMatch = jsContent.match(
      /uploadPreset\s*=\s*\(isLocal\)\s*\?\s*'[^']+'\s*:\s*'([^']+)'/
    )

    if (cloudNameMatch && apiKeyMatch && presetMatch) {
      return {
        cloudName: cloudNameMatch[1],
        apiKey: apiKeyMatch[1],
        uploadPreset: presetMatch[1]
      }
    }

    return FALLBACK_CONFIG
  } catch {
    return FALLBACK_CONFIG
  }
}

async function getSignature(config, timestamp) {
  const payload = {
    paramsToSign: {
      source: 'uw',
      timestamp,
      upload_preset: config.uploadPreset
    }
  }

  const response = await client.post(SIGNER_URL, payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.data.signature) {
    throw new Error('Signature kosong')
  }

  return response.data.signature
}

async function uploadImage(config, signature, timestamp, imageBuffer) {
  const form = new FormData()

  form.append('file', imageBuffer, {
    filename: 'input.jpg'
  })

  form.append('api_key', config.apiKey)
  form.append('timestamp', timestamp)
  form.append('upload_preset', config.uploadPreset)
  form.append('signature', signature)
  form.append('source', 'uw')

  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`

  const response = await client.post(uploadUrl, form, {
    headers: {
      ...form.getHeaders()
    }
  })

  return response.data
}

async function hdr(buffer) {
  const config = await getDynamicConfig()
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await getSignature(config, timestamp)

  const uploadResult = await uploadImage(
    config,
    signature,
    timestamp,
    buffer
  )

  const transformation = 'e_upscale,q_auto,f_auto'
  const imageUrl = `https://res.cloudinary.com/${config.cloudName}/image/upload/${transformation}/${uploadResult.public_id}`

  const result = await axios.get(imageUrl, {
    responseType: 'arraybuffer'
  })

  return Buffer.from(result.data)
}

let handler = async (m, { sock, usedPrefix, command }) => {
  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/^image\/(png|jpe?g)$/i.test(mime)) {
      return sock.sendMessage(m.chat, {
        text: `Kirim / tag gambar dengan caption *${usedPrefix + command}*`
      }, { quoted: m })
    }

    await sock.sendMessage(m.chat, {
      react: { text: '⏳', key: m.key }
    })

    const buffer = await q.download()
    const result = await hdr(buffer)

    await sock.sendMessage(m.chat, {
      image: result,
      caption: '✨ Gambar berhasil dijernihkan'
    }, { quoted: m })

    await sock.sendMessage(m.chat, {
      react: { text: '✅', key: m.key }
    })
  } catch (e) {
    console.error(e)
    sock.sendMessage(m.chat, {
      text: '❌ Gagal menjernihkan gambar, coba lagi nanti'
    }, { quoted: m })
  }
}

handler.command = ['hd', 'jernih']
handler.help = ['hd', 'jernih']

export default handler