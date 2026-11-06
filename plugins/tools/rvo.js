import { downloadContentFromMessage } from "@whiskeysockets/baileys"

const handler = async (m, { sock, example }) => {
  
  if (!m.quoted)
    return m.reply(example("reply pesan viewOnce nya!"))

  const quotedMsg = m.quoted.message || m.quoted.fakeObj?.message
  const type = Object.keys(quotedMsg || {})[0]

  if (!quotedMsg?.[type]?.viewOnce && m.quoted.mtype !== "viewOnceMessageV2")
    return m.reply("Pesan itu bukan *ViewOnce!*")

  try {
    const mediaStream = await downloadContentFromMessage(
      quotedMsg[type],
      /image/.test(type) ? "image" : /video/.test(type) ? "video" : "audio"
    )

    let buffer = Buffer.from([])
    for await (const chunk of mediaStream) buffer = Buffer.concat([buffer, chunk])

    if (/video/.test(type)) {
      await sock.sendMessage(
        m.chat,
        { video: buffer, caption: quotedMsg[type].caption || "" },
        { quoted: m }
      )
    } else if (/image/.test(type)) {
      await sock.sendMessage(
        m.chat,
        { image: buffer, caption: quotedMsg[type].caption || "" },
        { quoted: m }
      )
    } else if (/audio/.test(type)) {
      await sock.sendMessage(
        m.chat,
        { audio: buffer, mimetype: "audio/mpeg", ptt: true },
        { quoted: m }
      )
    } else {
      m.reply("⚠️ Jenis file tidak didukung untuk view once.")
    }
  } catch (err) {
    console.error("❌ RVO Error:", err)
    m.reply("Terjadi kesalahan saat membuka pesan view once.")
  }
}

handler.command = ["rvo", "readviewonce"]

export default handler