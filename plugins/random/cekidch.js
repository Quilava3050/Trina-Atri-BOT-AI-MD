const handler = async (m, { sock, text, reply, example }) => {

  if (!text)
    return reply(example("linkchnya"))

  if (!text.includes("https://whatsapp.com/channel/"))
    return reply("⚠️ Link tautan tidak valid!")

  try {
    const result = text.split("https://whatsapp.com/channel/")[1]
    const res = await sock.newsletterMetadata("invite", result)

    if (!res?.id)
      return reply("Tidak dapat menemukan ID channel dari link tersebut.")

    const teks = `${res.id}`
    return m.reply(teks)
  } catch (err) {
    console.error("❌ cekidch Error:", err)
    m.reply("Terjadi kesalahan saat mengambil ID channel!")
  }
}

handler.command = ["cekidch", "idch"]

export default handler