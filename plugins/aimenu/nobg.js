import fetch from 'node-fetch'
import FormData from 'form-data'

async function pixa(buffer) {
  const form = new FormData()
  form.append('image', buffer, {
    filename: 'image.jpg',
    contentType: 'image/jpeg'
  })
  form.append('format', 'png')
  form.append('model', 'v1')

  const res = await fetch('https://api2.pixelcut.app/image/matte/v1', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
      'x-locale': 'en',
      'x-client-version': 'web:pixa.com:4a5b0af2',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'origin': 'https://www.pixa.com',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://www.pixa.com/',
      'accept-language': 'id-ID,id;q=0.9,en-AU;q=0.8,en;q=0.7,en-US;q=0.6'
    },
    body: form
  })

  if (!res.ok) throw new Error('Request failed')

  return Buffer.from(await res.arrayBuffer())
}

let handler = async (m, { sock }) => {
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

  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''

    if (!mime.startsWith('image/')) {
      return sock.sendMessage(m.chat, { text: 'Kirim atau reply gambar' }, { quoted: fkontak })
    }

    await sock.sendMessage(m.chat, { text: 'Processing...' }, { quoted: fkontak })

    const img = await q.download()
    const out = await pixa(img)

    await sock.sendMessage(m.chat, { image: out }, { quoted: fkontak })

  } catch (e) {
    await sock.sendMessage(m.chat, { text: e.message }, { quoted: fkontak })
  }
}

handler.help = ['nobg']
handler.tags = ['ai']
handler.command = ['rmbg', 'nobg'];
handler.limit = true

export default handler