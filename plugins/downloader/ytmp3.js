import axios from 'axios'
import { getSavetubeDownload } from '../../control/savetube.js'

function sanitizeFilename(name = 'audio') {
  return name.replace(/[\\/:*?"<>|]+/g, '').slice(0, 100)
}

async function getThumbBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' })
    return Buffer.from(res.data)
  } catch (e) {
    return null
  }
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return `${m}:${String(s).padStart(2, '0')}`
}

let handler = async (m, { sock, text, command, usedPrefix }) => {
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

  if (!text) {
    return sock.sendMessage(m.chat, {
      text: `Contoh:\n${usedPrefix + command} https://youtu.be/xxxx\n${usedPrefix + command} judul lagu`
    }, { quoted: fkontak })
  }

  await sock.sendMessage(m.chat, {
    react: { text: '⏳', key: m.key }
  })

  try {
    const result = await getSavetubeDownload(text, 'audio')

    const fileName = `${sanitizeFilename(result.title)}.mp3`
    const isLong = result.duration >= 30 * 60

    const infoText = `乂 *YT-MP3*

⭔ *Title* : ${result.title}
⭔ *Duration* : ${formatDuration(result.duration)}
⭔ *Format* : ${isLong ? '📄 Dokumen (>30 menit)' : '🎵 Audio MP3'}
⭔ *URL* : ${result.source}

${global.wm || ''}`.trim()

    const thumbBuffer = await getThumbBuffer(result.thumbnail)

    // Kirim pesan teks preview tanpa externalAdReply via relayMessage
    await sock.relayMessage(
      m.chat,
      {
        extendedTextMessage: {
          text: infoText,
          matchedText: result.source,
          description: global.wm || '© bot',
          title: result.title,
          previewType: 'NONE',
          jpegThumbnail: thumbBuffer
        }
      },
      {}
    )

    // Kirim Audio / Dokumen
    if (isLong) {
      await sock.sendMessage(
        m.chat,
        {
          document: { url: result.download },
          mimetype: 'audio/mpeg',
          fileName
        },
        { quoted: fkontak }
      )
    } else {
      await sock.sendMessage(
        m.chat,
        {
          audio: { url: result.download },
          mimetype: 'audio/mpeg',
          fileName
        },
        { quoted: fkontak }
      )
    }

    await sock.sendMessage(m.chat, {
      react: { text: '🎵', key: m.key }
    })
  } catch (e) {
    console.error('[YTMP3 Error]:', e)

    await sock.sendMessage(m.chat, {
      react: { text: '❌', key: m.key }
    })

    await sock.sendMessage(m.chat, {
      text: `❌ Terjadi kesalahan saat mengambil audio.\n${e.message || ''}`
    }, { quoted: fkontak })
  }
}

handler.command = ['ytmp3', 'yta']
handler.help = ['ytmp3 <url/judul>']

export default handler