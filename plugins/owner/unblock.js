const handler = async (m, { sock, text, reply, example, mess }) => {

  let target
  if (m.mentionedJid?.length) target = m.mentionedJid[0]
  else if (m.quoted) target = m.quoted.sender
  else if (text) target = text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
  else return m.reply(example("628xxxx atau @tag/reply pesan"))

  try {
    await sock.updateBlockStatus(target, "unblock")
    m.reply(`✅ Nomor *${target.split("@")[0]}* berhasil di-unblock.`)
  } catch (e) {
    console.error(e)
    m.reply("❌ Gagal membuka blokir nomor.")
  }
}

handler.command = ["unblock", "unblok"]
handler.owner = true

export default handler