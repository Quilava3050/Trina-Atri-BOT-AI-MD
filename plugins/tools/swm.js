import fs from "fs"

const handler = async (m, { sock, text, reply, example, mess }) => {

  if (!text)
    return reply(example(`wm nya dengan reply sticker *(Trina doesn't support animated sticker)*`))

  if (!m.quoted)
    return reply(example(`wm nya dengan reply sticker *(Trina doesn't support animated sticker)*`))

  const qmsg = m.quoted
  const mime = (qmsg.msg || qmsg).mimetype || ""
  const packname = "by"
  const author = text.trim()

  if (!/webp/.test(mime))
    return reply("⚠️ Reply ke sticker aja bang, bukan foto/video.")

  await reply("Wait...")

  try {
    const media = await sock.downloadAndSaveMediaMessage(qmsg)

    await sock.sendImageAsSticker(
      m.chat,
      media,
      m,
      { packname, author }
    )

    fs.unlinkSync(media)
  } catch (err) {
    console.error("❌ Error .swm:", err)
    reply("❌ Gagal mengubah watermark sticker.")
  }
}

handler.command = ["swm"]

export default handler