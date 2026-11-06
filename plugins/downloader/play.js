import yts from 'yt-search'
import crypto from 'crypto'

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
const HEADERS = { 
  "user-agent": UA, 
  "content-type": "application/json", 
  origin: "https://y2mate.net.co", 
  referer: "https://y2mate.net.co/" 
}
const KEY = Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex")

function sanitizeFilename(name = 'audio') {
  return name.replace(/[\\/:*?"<>|]+/g, '').slice(0, 100)
}

function decryptInfo(b64) {
  const raw = Buffer.from(b64, "base64")
  const iv = raw.subarray(0, 16)
  const data = raw.subarray(16)
  const decipher = crypto.createDecipheriv("aes-128-cbc", KEY, iv)
  const out = Buffer.concat([decipher.update(data), decipher.final()])
  return JSON.parse(out.toString("utf8"))
}

async function getRandomCdn() {
  const r = await fetch("https://media.savetube.vip/api/random-cdn", { headers: { "user-agent": UA } })
  if (!r.ok) throw new Error("Gagal mengambil CDN savetube")
  const j = await r.json()
  return j.cdn
}

async function getInfo(cdn, url) {
  const r = await fetch(`https://${cdn}/v2/info`, { method: "POST", headers: HEADERS, body: JSON.stringify({ url }) })
  const j = await r.json().catch(() => ({}))
  if (!j.status || typeof j.data !== "string") {
    throw new Error(j.message || "Gagal mengambil info video")
  }
  return decryptInfo(j.data)
}

async function getDownloadUrl(cdn, key, quality, downloadType) {
  const r = await fetch(`https://${cdn}/download`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ downloadType, quality, key }),
  })
  const j = await r.json().catch(() => ({}))
  if (!j.status || !j.data?.downloadUrl) throw new Error(j.message || "Gagal membuat link unduhan")
  return j.data.downloadUrl
}

async function savetubeAudio(url, quality) {
  const cdn = await getRandomCdn()
  const info = await getInfo(cdn, url)
  const audioFormats = (info.audio_formats || []).map(f => String(f.quality || f.abr || "128")).filter(Boolean)
  const finalQuality = quality || audioFormats[0] || "128"
  const downloadUrl = await getDownloadUrl(cdn, info.key, finalQuality, "audio")

  return {
    title: info.title || null,
    duration: info.durationLabel || info.duration || null,
    thumbnail: info.thumbnail || null,
    quality: finalQuality,
    downloadUrl,
  }
}

let handler = async (m, { sock, text, command, usedPrefix }) => {
  if (!text) return m.reply(`Penggunaan:\n${usedPrefix}${command} judul lagu`);

  m.reply("Mencari audio...");

  try {
    const { videos } = await yts(text)
    if (!videos.length) return m.reply("Lagu tidak ditemukan.")

    const video = videos[0]
    const result = await savetubeAudio(video.url)

    if (!result.downloadUrl) return m.reply("Audio tidak tersedia.")

    const fileName = sanitizeFilename(video.title)

    const infoText = `Y O U T U B E  P L A Y\n` +
      `───────────────────\n` +
      `Title     : ${video.title}\n` +
      `Channel   : ${video.author.name}\n` +
      `Duration  : ${video.timestamp || video.duration}\n` +
      `Views     : ${video.views.toLocaleString()}\n` +
      `Uploaded  : ${video.ago}\n` +
      `URL       : ${video.url}\n` +
      `───────────────────`;

    // Kirim Thumbnail + Informasi Lagu
    await sock.sendMessage(m.chat, {
      image: { url: video.thumbnail },
      caption: `\`\`\`${infoText}\`\`\``,
      contextInfo: {
        isForwarded: true,
        forwardingScore: 99,
        forwardedNewsletterMessageInfo: {
          newsletterJid: global.idChannel,
          serverMessageId: null,
          newsletterName: global.namaChannel
        }
      }
    }, { quoted: m });

    // Kirim File Audio
    const audioResponse = await fetch(result.downloadUrl, {
      headers: { "user-agent": UA }
    });
    if (!audioResponse.ok) {
      throw new Error(`Gagal mengunduh audio: HTTP ${audioResponse.status}`);
    }
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    await sock.sendMessage(m.chat, {
      audio: audioBuffer,
      mimetype: "audio/mpeg",
      fileName: `${fileName}.mp3`,
      ptt: false
    }, { quoted: m });

  } catch (e) {
    console.error("[Play Error]:", e);
    m.reply("Terjadi kesalahan saat memproses audio.");
  }
}

handler.command = ['play', 'song', 'ytplay'];
export default handler;