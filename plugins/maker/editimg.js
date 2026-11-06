import axios from 'axios'
import uploadTop4top from '../../control/uploadTop4top.js'

let handler = async (m, { sock, usedPrefix, command, args, text }) => {
  const apiKey = global.btc
  if (!apiKey) {
    return sock.sendMessage(m.chat, { text: '⚠️ `global.btc` belum di-set di config!' }, { quoted: m })
  }

  const promptText = text || args.join(' ')
  if (!promptText) {
    return sock.sendMessage(m.chat, { 
      text: `🎨 *AI IMAGE EDITING*\n\n📌 *Cara Penggunaan:*\nKirim atau reply gambar dengan caption:\n*${usedPrefix + command} <instruksi edit>*\n\n💡 *Contoh:*\n• *${usedPrefix + command} ubah warna rambut jadi merah*\n• *${usedPrefix + command} tambahkan kacamata hitam*` 
    }, { quoted: m })
  }

  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || q.mediaType || ''

  if (!/image/g.test(mime) || /webp/g.test(mime)) {
    return sock.sendMessage(m.chat, { 
      text: `⚠️ Harap kirim atau reply gambar (bukan stiker) dengan caption *${usedPrefix + command}*` 
    }, { quoted: m })
  }

  await sock.sendMessage(m.chat, { react: { text: '🍟', key: m.key } })

  try {
    const startTime = new Date()

    const imgBuffer = await q.download?.()
    if (!imgBuffer) throw new Error('Gagal mengunduh gambar dari WhatsApp.')

    const imageUrl = await uploadTop4top(imgBuffer, mime)

    const { data: submitData } = await axios.post("https://api.botcahx.eu.org/api/maker/imgedit", {
      text: promptText,
      url: imageUrl,
      apikey: apiKey
    })

    if (!submitData.status || !submitData.jobId) {
      throw new Error(submitData.message || 'Gagal submit job ke server AI.')
    }

    const jobId = submitData.jobId
    const jobType = submitData.type || 'imgedit'

    const resultBuffer = await pollJobResult(jobType, jobId, { isJsonResult: true })

    const processTime = new Date() - startTime

    await sock.sendMessage(m.chat, {
      image: resultBuffer,
      caption: `🍟 *Fetching*: ${processTime} ms\n📋 *Prompt*: ${promptText}`
    }, { quoted: m })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    
    let errMsg = e.message || e
    if (typeof e === 'string') errMsg = e
    
    sock.sendMessage(m.chat, { 
      text: `❌ *[ ! ] Identifikasi Gagal:*\n${errMsg}` 
    }, { quoted: m })
  }
}

handler.help = ['editimg <prompt>']
handler.tags = ['maker']
handler.command = ['editimg']

export default handler

async function pollJobResult(type, jobId, opts = {}) {
  const intervalMs = opts.intervalMs || 3000
  const timeoutMs = opts.timeoutMs || 240000
  const isJsonResult = !!opts.isJsonResult
  const startedAt = Date.now()
  const statusUrl = 'https://api.botcahx.eu.org/api/maker/status/editing-image'

  while (true) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timeout menunggu hasil job (${type}/${jobId}).`)
    }

    const res = await axios.get(statusUrl, {
      params: { type, jobId },
      responseType: 'arraybuffer',
      validateStatus: () => true
    })

    const contentType = (res.headers['content-type'] || '').toLowerCase()
    const isJson = contentType.includes('application/json')

    if (isJson) {
      let data
      try {
        data = JSON.parse(Buffer.from(res.data).toString('utf-8'))
      } catch {
        throw new Error(`Gagal parse response status job (${type}/${jobId}).`)
      }

      if (data.status === 'pending') {
        await new Promise(r => setTimeout(r, intervalMs))
        continue
      }

      if (data.status === false) {
        throw new Error(data.message || `Job ${type}/${jobId} gagal diproses.`)
      }

      const resultUrl = data.result || data.url || data.data?.result || data.data?.url

      if (isJsonResult) {
        if (resultUrl) {
          const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer' })
          return Buffer.from(imgRes.data)
        }
        await new Promise(r => setTimeout(r, intervalMs))
        continue
      }

      await new Promise(r => setTimeout(r, intervalMs))
      continue
    }

    return Buffer.from(res.data)
  }
}