import { prepareWAMessageMedia, generateWAMessageFromContent } from '@whiskeysockets/baileys'
import { fileTypeFromBuffer } from 'file-type'

// 🔹 Fungsi Uploader Uguu.se (API Resmi, Anti-Error Parsing)
async function uploadToUguu(buffer) {
  const { ext } = (await fileTypeFromBuffer(buffer)) || { ext: 'mp4' }
  const formData = new FormData()
  const file = new File([buffer], `video_${Date.now()}.${ext}`, { type: `video/${ext}` })
  formData.append('files[]', file)

  const res = await fetch('https://uguu.se/upload.php', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: formData
  })

  if (!res.ok) throw new Error(`Uguu upload failed with status ${res.status}`)
  
  const json = await res.json()
  if (!json.success || !json.files?.[0]?.url) {
    throw new Error('Gagal mendapatkan URL dari Uguu.se')
  }

  return json.files[0].url
}

let handler = async (m, { sock, conn, usedPrefix, command }) => {
  const client = sock || conn || global.sock
  
  let targetJid = global.idChannel
  if (targetJid && !targetJid.endsWith('@newsletter')) {
    targetJid = `${targetJid}@newsletter`
  }

  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mtype || ''

  if (!/video/.test(mime)) {
    return sock.sendMessage(m.chat, { 
      text: `⚠️ Kirim atau reply video yang mau dijadikan Foto Live ke Channel!` 
    }, { quoted: m })
  }

  await sock.sendMessage(m.chat, { text: '⏳ Mengunduh & mengunggah video ke Uguu...' }, { quoted: m })

  try {
    // 1. Download video buffer
    let videoBuffer = await q.download()
    if (!videoBuffer) throw new Error('Gagal mendownload video.')

    // 2. Upload video ke Uguu.se
    let videoUrl = await uploadToUguu(videoBuffer)
    if (!videoUrl) throw new Error('Gagal mengunggah video.')

    const upload = client.waUploadToServer || conn?.waUploadToServer

    // 3. Prepare Image Media (pake thumbLive)
    const image = await prepareWAMessageMedia(
      { image: global.thumbLive },
      { upload, jid: targetJid }
    )

    // 4. Prepare Video Media (pake Direct URL Uguu)
    const video = await prepareWAMessageMedia(
      { video: { url: videoUrl } },
      { upload, jid: targetJid }
    )

    // 5. Generate Parent Message (Image)
    const msg = generateWAMessageFromContent(
      targetJid,
      {
        imageMessage: {
          ...image.imageMessage,
          contextInfo: {
            pairedMediaType: 5,
            statusSourceType: 0
          }
        }
      },
      { userJid: client.user?.id }
    )

    const parentKey = {
      remoteJid: targetJid,
      fromMe: true,
      id: msg.key.id,
      participant: client.user?.id
    }

    // 6. Relay Pesan Pertama (Image)
    await client.relayMessage(targetJid, msg.message, {
      messageId: msg.key.id,
      additionalAttributes: { type: 'text' }
    })

    // Jeda 1 detik
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 7. Relay Pesan Kedua (Video)
    await client.relayMessage(
      targetJid,
      {
        videoMessage: {
          ...video.videoMessage,
          contextInfo: {
            pairedMediaType: 6,
            statusSourceType: 0
          }
        },
        messageContextInfo: {
          messageAssociation: {
            associationType: 12,
            parentMessageKey: parentKey
          }
        }
      },
      { additionalAttributes: { type: 'text' } }
    )

    await sock.sendMessage(m.chat, { text: '✅ Foto Live berhasil terkirim ke Channel!' }, { quoted: m })

  } catch (e) {
    console.error("[Live Photo Error]:", e)
    await sock.sendMessage(m.chat, { text: `❌ Gagal mengirim: ${e.message || e}` }, { quoted: m })
  }
}

handler.help = ['livech']
handler.tags = ['owner']
handler.command = ['livech', 'photolivech']
handler.owner = true

export default handler