import yts from "yt-search"
import axios from "axios"
import crypto from "crypto"
import fs from "fs"
import { execFile } from "child_process"
import { promisify } from "util"
import decode from "audio-decode"
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"

const execFileAsync = promisify(execFile)

async function generateWaveform(buffer) {
  try {
    const audioBuffer = await decode(buffer)
    const rawData = audioBuffer.getChannelData(0)
    const samples = 64
    const blockSize = Math.floor(rawData.length / samples)
    const waveform = new Uint8Array(samples)

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize
      const end = i === samples - 1 ? rawData.length : start + blockSize
      let max = 0
      for (let j = start; j < end; j++) {
        const value = Math.abs(rawData[j])
        if (value > max) max = value
      }
      waveform[i] = Math.min(255, Math.floor(max * 255))
    }
    return waveform
  } catch (error) {
    console.error("[PLAYCH] Gagal membuat waveform:", error)
    return new Uint8Array(64).fill(0)
  }
}

let handler = async (m, { sock, text, usedPrefix, command }) => {
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

  if (!text) return sock.sendMessage(m.chat, { 
    text: `*Contoh penggunaan:*\n› ${usedPrefix + command} judul lagu\n› ${usedPrefix + command} idch|judul lagu \n\n*Cara cek idch*\n› ${usedPrefix}idch link ch nya` 
  }, { quoted: fkontak })

  let targetChannel = global.idChannel
  let query = text

  if (text.includes("|")) {
    const [chan, judul] = text.split("|")
    if (chan.includes("@newsletter")) {
      targetChannel = chan.trim()
      query = judul.trim()
    }
  }

  await sock.sendMessage(m.chat, { text: "Wait..." }, { quoted: fkontak })

  const tmpMp3 = `./tmp_${crypto.randomUUID()}.mp3`
  const tmpOpus = `./tmp_${crypto.randomUUID()}.opus`

  try {
    const search = await yts(query);
    const video = search.videos[0];
    
    if (!video) return sock.sendMessage(m.chat, { text: "❌ Lagu tidak ditemukan." }, { quoted: fkontak });

    // Menggunakan Scraper Savetube dari fitur conn
    const dl = await savetube.download(video.url, 'mp3')

    if (!dl?.status || !dl.result?.download) {
      return sock.sendMessage(m.chat, { text: "❌ Gagal mendapatkan link audio dari server Savetube." }, { quoted: fkontak });
    }

    const audioUrl = dl.result.download;
    const resAudio = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(tmpMp3, Buffer.from(resAudio.data));

    if (!fs.existsSync(tmpMp3)) return sock.sendMessage(m.chat, { text: "❌ Gagal mendownload." }, { quoted: fkontak })

    try {
      await execFileAsync(ffmpegInstaller.path, [
        "-y", "-i", tmpMp3, "-c:a", "libopus", "-b:a", "64k",
        "-vbr", "on", "-compression_level", "10", tmpOpus
      ], { maxBuffer: 10 * 1024 * 1024 })

      if (!fs.existsSync(tmpOpus)) throw new Error("Gagal konversi ke Opus")

      const buffer = fs.readFileSync(tmpOpus)
      const waveform = await generateWaveform(buffer)

      // Kirim audio ke channel tanpa externalAdReply (pakai contextInfo newsletter)
      await sock.sendMessage(targetChannel, {
        audio: buffer,
        mimetype: "audio/ogg; codecs=opus", 
        ptt: true,
        waveform,
        contextInfo: {
          forwardingScore: 9999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: targetChannel,
            newsletterName: `🎵 ${dl.result.title || video.title}`,
            serverMessageId: -1
          }
        }
      })

      await sock.sendMessage(m.chat, { text: "Success send song to channel!" }, { quoted: fkontak })
    } catch (err) {
      console.error(err)
      await sock.sendMessage(m.chat, { text: "❌ Error saat konversi: " + err.message }, { quoted: fkontak })
    } finally {
      // Hapus semua file temporary
      if (fs.existsSync(tmpMp3)) fs.unlinkSync(tmpMp3)
      if (fs.existsSync(tmpOpus)) fs.unlinkSync(tmpOpus)
    }

  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { text: `❌ Error: ${e.message}` }, { quoted: fkontak })
  }
}

handler.command = ["playch", "songch"]
handler.owner = true

export default handler

// Scraper Engine Savetube
const savetube = {
  api: {
    base: "https://media.savetube.vip/api",
    cdn: "/random-cdn",
    info: "/v2/info",
    download: "/download"
  },
  headers: {
    accept: '*/*',
    'content-type': 'application/json',
    origin: 'https://yt.savetube.me',
    referer: 'https://yt.savetube.me/',
    'user-agent': 'Postify/1.0.0'
  },
  formats: ['144','240','360','480','720','1080','mp3'],
  crypto: {
    hexToBuffer: h => Buffer.from(h.match(/.{1,2}/g).join(''), 'hex'),
    decrypt: async enc => {
      const key = savetube.crypto.hexToBuffer('C5D58EF67A7584E4A29F6C35BBC4EB12')
      const data = Buffer.from(enc, 'base64')
      const iv = data.slice(0,16)
      const content = data.slice(16)
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
      const dec = Buffer.concat([decipher.update(content), decipher.final()])
      return JSON.parse(dec.toString())
    }
  },
  youtube: url => {
    const r = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ]
    for (let x of r) if (x.test(url)) return url.match(x)[1]
    return null
  },
  request: async (endpoint, data={}, method='post') => {
    const res = await axios({
      method,
      url: `${endpoint.startsWith('http') ? '' : savetube.api.base}${endpoint}`,
      data: method==='post' ? data : undefined,
      params: method==='get' ? data : undefined,
      headers: savetube.headers
    })
    return res.data
  },
  getCDN: async () => {
    const r = await savetube.request(savetube.api.cdn, {}, 'get')
    return r.cdn
  },
  download: async (link, format) => {
    const id = savetube.youtube(link)
    const cdn = await savetube.getCDN()
    const info = await savetube.request(`https://${cdn}${savetube.api.info}`, { url: `https://youtube.com/watch?v=${id}` })
    const dec = await savetube.crypto.decrypt(info.data)
    const dl = await savetube.request(`https://${cdn}${savetube.api.download}`, {
      id,
      downloadType: 'audio',
      quality: '128',
      key: dec.key
    })
    return {
      status: true,
      result: {
        title: dec.title,
        thumbnail: dec.thumbnail,
        duration: dec.duration,
        download: dl.data.downloadUrl
      }
    }
  }
}