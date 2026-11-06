import fetch from "node-fetch"

let handler = async (m, { sock, text, reply, usedPrefix, command }) => {

  if (!text)
    return reply(`Masukkan nama nabi!\n*Contoh:* ${usedPrefix + command} adam`)

  try {
    const nabi = text.toLowerCase()
    const res = await fetch(`https://raw.githubusercontent.com/ZeroChanBot/Api-Freee/a9da6483809a1fbf164cdf1dfbfc6a17f2814577/data/kisahNabi/${nabi}.json`)

    if (!res.ok)
      return reply(`*Kisah Nabi '${text}' tidak ditemukan!*\nCoba coba nama nabi lain, pastikan huruf kecil semua!`)

    const kisah = await res.json()
    const hasil = `*📜 Kisah Nabi ${kisah.name} 🌿*

- 📅 *Tahun Lahir:* ${kisah.thn_kelahiran || "-"}
- 🏠 *Tempat Lahir:* ${kisah.tmp || "-"}
- ⏳ *Usia:* ${kisah.usia || "-"}

📖 *Perjalanan Hidup / Kisah:*
${kisah.description || "-"}`

    await reply(hasil)
  } catch (err) {
    console.error(err)
    reply("⚠️ Terjadi kesalahan saat mengambil kisah nabi.")
  }
}

handler.command = ["kisahnabi"]

export default handler