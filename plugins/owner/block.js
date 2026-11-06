const handler = async (m, { sock, text, reply, example }) => {

  let target
  if (m.mentionedJid?.length) target = m.mentionedJid[0]
  else if (m.quoted) target = m.quoted.sender
  else if (text) target = text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
  else return m.reply(example("628xxxx atau @tag/reply pesan"))

  try {
    await sock.updateBlockStatus(target, "block")
    m.reply(`✅ Nomor *${target.split("@")[0]}* berhasil diblokir.`)
  } catch (e) {
    console.error(e)
    m.reply("❌ Gagal memblokir nomor.")
  }
}

handler.command = ["block", "blok"]
handler.owner = true

export default handler