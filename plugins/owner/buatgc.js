const handler = async (m, { sock, text, reply, example }) => {

  if (!text) return reply(example("nama grup nya apa?"))

  const res = await sock.groupCreate(text, [])
  const urlGrup = "https://chat.whatsapp.com/" + await sock.groupInviteCode(res.id)

  const teks = `*Grup WhatsApp Berhasil Dibuat ✅*\n\n- Nama Grup: *${text}*\n- Link: ${urlGrup}`
  m.reply(teks)
}

handler.command = ["buatgc", "cgc"]
handler.owner = true

export default handler