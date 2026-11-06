import axios from 'axios'

async function getInstagramMedia(instaUrl) {
  const apiKey = global.zansxart
  if (!apiKey) throw new Error('API key Zansxart belum diatur di settings.js.')

  const { data } = await axios.get('https://api.zansxart.me/api/download/instagram', {
    params: { url: instaUrl },
    headers: { 'X-API-Key': apiKey },
    timeout: 60000
  })

  if (!data?.status) throw new Error(data?.message || 'Gagal mengambil media Instagram.')

  const media = [...new Set([
    ...(Array.isArray(data.result) ? data.result : []),
    ...(Array.isArray(data.data) ? data.data : [])
  ])].filter(url => typeof url === 'string' && /^https?:\/\//i.test(url))

  if (!media.length) throw new Error('Media Instagram tidak ditemukan.')
  return media
}

let handler = async (m, { sock, text, usedPrefix, command }) => {

    let input =
  text ||
  m.quoted?.text ||
  m.quoted?.caption ||
  m.quoted?.conversation ||
  ""

if (!input)
  return m.reply(
    `Contoh:\n${usedPrefix + command} https://www.instagram.com/reel/xyz\natau reply pesan berisi link Instagram`
  )

const igRegex =
  /https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[^\s]+/i

const match = input.match(igRegex)

if (!match)
  return m.reply("❌ Link harus dari Instagram post / reel / tv.")

const url = match[0]
    await m.reply('Wait. . .')

    try {
        const media = await getInstagramMedia(url)

        for (const mediaUrl of media) {
          const isVideo = /\.(mp4|mov|m4v)(?:$|[?#])/i.test(mediaUrl)
          await sock.sendMessage(m.chat, isVideo
            ? { video: { url: mediaUrl } }
            : { image: { url: mediaUrl } },
            { quoted: m })
        }

    } catch (e) {
        console.error(e)
        m.reply(`❌ Terjadi kesalahan: ${e.message}`)
    }
}

handler.command = ['ig', 'igdl', 'instagram', 'reel', 'reels']

export default handler