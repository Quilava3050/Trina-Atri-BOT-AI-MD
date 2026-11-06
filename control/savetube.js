import crypto from 'crypto'

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
const HEADERS = {
  "user-agent": UA,
  "content-type": "application/json",
  origin: "https://y2mate.net.co",
  referer: "https://y2mate.net.co/"
}
const KEY = Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex")

function isYoutubeUrl(value = '') {
  try {
    const url = new URL(value)
    return /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(url.hostname)
  } catch {
    return false
  }
}

async function resolveYoutubeUrl(query) {
  const { default: yts } = await import('yt-search')
  const search = await yts(query)
  const video = search?.videos?.[0]
  if (!video) throw new Error('Video tidak ditemukan.')
  return video.url
}

function decryptInfo(data) {
  const raw = Buffer.from(data, "base64")
  if (raw.length <= 16) throw new Error('Data info dari SaveTube tidak valid.')
  const iv = raw.subarray(0, 16)
  const encrypted = raw.subarray(16)
  const decipher = crypto.createDecipheriv("aes-128-cbc", KEY, iv)
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8"))
}

async function getRandomCdn() {
  const response = await fetch("https://media.savetube.vip/api/random-cdn", {
    headers: { "user-agent": UA }
  })
  if (!response.ok) throw new Error("Gagal mengambil CDN SaveTube.")
  const data = await response.json()
  if (!data.cdn) throw new Error("CDN SaveTube tidak tersedia.")
  return data.cdn
}

async function getVideoInfo(cdn, url) {
  const response = await fetch(`https://${cdn}/v2/info`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ url })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.status || typeof data.data !== "string") {
    throw new Error(data.message || "Gagal mengambil info video dari SaveTube.")
  }
  return decryptInfo(data.data)
}

function selectVideoFormat(formats = []) {
  if (!Array.isArray(formats) || !formats.length) return null

  const getQuality = (format) => {
    const value = String(format.quality || format.resolution || format.format || '')
    const dimensions = value.match(/\d{3,4}\s*x\s*(\d{3,4})/i)
    const quality = value.match(/(?:^|\D)(\d{3,4})\s*p?\b/i)
    return Number(dimensions?.[1] || quality?.[1]) || 0
  }

  for (const preferredQuality of [1080, 720]) {
    const preferredFormat = formats.find(format => getQuality(format) === preferredQuality)
    if (preferredFormat) return preferredFormat
  }

  return [...formats].sort((a, b) => getQuality(a) - getQuality(b))[0]
}

async function getDownloadUrl(cdn, key, quality, downloadType) {
  const response = await fetch(`https://${cdn}/download`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ downloadType, quality, key })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.status || !data.data?.downloadUrl) {
    throw new Error(data.message || `SaveTube gagal membuat link ${downloadType}.`)
  }
  return data.data.downloadUrl
}

function parseDuration(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string") return 0
  const parts = value.split(":").map(Number)
  if (parts.some(Number.isNaN)) return 0
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || 0
}

export async function getSavetubeDownload(input, downloadType = 'audio') {
  if (!['audio', 'video'].includes(downloadType)) {
    throw new Error(`Tipe download SaveTube tidak didukung: ${downloadType}`)
  }

  const url = isYoutubeUrl(input) ? input : await resolveYoutubeUrl(input)
  const cdn = await getRandomCdn()
  const info = await getVideoInfo(cdn, url)

  let quality
  if (downloadType === 'video') {
    const format = selectVideoFormat(info.video_formats || info.videoFormats)
    if (!format) throw new Error('SaveTube tidak menyediakan format video untuk tautan ini.')
    quality = String(format.quality || format.resolution || format.format || '360')
      .replace(/p$/i, '')
  } else {
    const format = info.audio_formats?.[0] || info.audioFormats?.[0]
    if (!format) throw new Error('SaveTube tidak menyediakan format audio untuk tautan ini.')
    quality = String(format.quality || format.abr || '128')
  }

  const download = await getDownloadUrl(cdn, info.key, quality, downloadType)
  return {
    title: info.title || 'YouTube media',
    duration: parseDuration(info.durationLabel || info.duration),
    thumbnail: info.thumbnail,
    quality,
    download,
    source: url
  }
}
