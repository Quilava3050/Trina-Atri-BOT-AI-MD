import axios from "axios"

async function anakbaik(url) {
  try {
    const redirect = await axios.get(url, {
      maxRedirects: 5,
      headers: { "User-Agent": "Mozilla/5.0" }
    })

    const finalUrl = redirect.request.res.responseUrl
    const { data } = await axios.get(finalUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    })

    // ambil semua mp4
    const videos = [...data.matchAll(/"contentUrl":"(https:\/\/v1\.pinimg\.com\/videos\/[^"]+\.mp4)"/g)].map(v => v[1])

    if (videos.length > 0) {
      return { type: "video", media: videos }
    }

    // Ambil HANYA dari JSON data Pinterest (bukan dari tag img UI)
    // Pinterest nyimpen data di __PWS_DATA__ atau __PWS_INITIAL_STRING__
    const jsonMatch = data.match(/__PWS_DATA__\s*=\s*({.+?})\s*;/) ||
                      data.match(/__PWS_INITIAL_STRING__[^>]+>(.+?)<\/script>/)

    let images = []

    if (jsonMatch) {
      // ambil dari JSON block
      const raw = jsonMatch[1]
      images = [...new Set(
        [...raw.matchAll(/https:\/\/i\.pinimg\.com\/originals\/[^"\\]+\.(jpg|jpeg|png|webp)/g)]
          .map(i => i[0])
      )]
    }

    // fallback: ambil dari "orig" key di JSON response
    if (images.length === 0) {
      images = [...new Set(
        [...data.matchAll(/"orig"\s*:\s*\{[^}]*"url"\s*:\s*"(https:\/\/i\.pinimg\.com\/originals\/[^"]+)"/g)]
          .map(i => i[1])
      )]
    }

    if (images.length > 0) {
      return { type: "image", media: images }
    }

    return { error: "Media tidak ditemukan" }

  } catch (e) {
    return { error: e.message }
  }
}

const handler = async (m, { sock, args, usedPrefix }) => {
  try {
  
    let input =
  args[0] ||
  m.quoted?.text ||
  m.quoted?.caption ||
  m.quoted?.conversation ||
  ""

if (!input)
  return m.reply(
    `Contoh:\n${usedPrefix}pindl https://pin.it/xxxx\natau reply pesan berisi link Pinterest`
  )

const pinRegex =
  /https?:\/\/(www\.)?(pin\.it|pinterest\.com)\/[^\s]+/i

const match = input.match(pinRegex)

if (!match)
  return m.reply("❌ Link harus dari Pinterest.")

let url = match[0]

    m.reply("Wait...")

    let res = await anakbaik(url)
    if (res.error) return m.reply(res.error)

    if (res.type === "video") {
      for (let vid of res.media) {
        await sock.sendMessage(m.chat, { video: { url: vid } }, { quoted: m })
      }
    }

    if (res.type === "image") {
      for (let img of res.media) {
        await sock.sendMessage(m.chat, { image: { url: img } }, { quoted: m })
      }
    }

  } catch (e) {
    m.reply(e.message)
  }
}

handler.command = ["pindl", "pinterest"]
export default handler