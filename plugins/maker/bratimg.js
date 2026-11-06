import axios from "axios"

const handler = async (m, { sock, text, reply, command, usedPrefix }) => {
  if (!text) return reply(`Example: *${usedPrefix}${command}* teksnya`)

  const apiKey = global.zansxart
  if (!apiKey) return reply("API Key belum dikonfigurasi di global.zansxart.")

  const apiBase = global.APIs?.zansxart || "https://api.zansxart.me"

  try {
    const response = await axios.get(`${apiBase}/api/maker/brat`, {
      params: { text },
      headers: { "X-API-Key": apiKey },
      responseType: "arraybuffer",
      timeout: 30000
    })

    const image = Buffer.from(response.data)
    const contentType = String(response.headers["content-type"] || "").toLowerCase()
    if (!image.length || !contentType.startsWith("image/")) {
      let detail = "API tidak mengembalikan gambar yang valid."
      try {
        const body = JSON.parse(image.toString("utf8"))
        detail = body.message || body.error || body._hint || detail
      } catch {}
      throw new Error(detail)
    }

    await sock.sendImageAsSticker(m.chat, image, m, { author: "its me Trina" })
  } catch (error) {
    console.error("[BRAT] Gagal membuat sticker:", error)
    const status = error?.cause?.response?.status || error?.response?.status
    const reason = status
      ? `Layanan gambar merespons HTTP ${status}.`
      : String(error?.message || "Terjadi kesalahan yang tidak diketahui.")
    await reply(`Gagal membuat sticker brat. ${reason}`)
  }
}

handler.command = ["brat"]
export default handler