import fs from "fs"

const handler = async (m, { sock }) => {
  
  try {
    const path = "./control/games/tebakkimia.json"
    if (!fs.existsSync(path)) return m.reply("❌ File tebakkimia.json tidak ditemukan!")

    // Baca data kimia
    const data = JSON.parse(fs.readFileSync(path, "utf-8"))
    if (!Array.isArray(data) || data.length === 0)
      return m.reply("❌ Data tebakkimia.json kosong atau rusak!")

    // Pilih acak
    const random = data[Math.floor(Math.random() * data.length)]
    const { unsur, lambang } = random

    // Kirim pertanyaan
    await sock.sendMessage(
      m.chat,
      {
        text: `🧪 *TEBAK UNSUR KIMIA*\n\nSimbol kimia berikut mewakili unsur apa?\n\n🔤 Lambang: *${lambang}*\n\n⏰ *Waktu:* 5 menit\nKetik jawabanmu langsung!\nAtau *.nyerah* kalau nggak tahu 😅`,
      },
      { quoted: m }
    )

    // Simpan data ke global
    global.game = global.game || {}
    global.game[m.chat] = {
      type: "tebakkimia",
      soal: lambang,
      jawaban: unsur.toLowerCase(),
      user: m.sender,
      waktu: Date.now(),
      timeout: setTimeout(() => {
        if (global.game[m.chat]) {
          sock.sendMessage(m.chat, {
            text: `⏰ Waktu habis! Jawabannya *${unsur.toUpperCase()}* 🧠\nMain lagi? *.tebakkimia*`,
          }, { quoted: m })
          delete global.game[m.chat]
        }
      }, 300000), // 5 menit
    }
  } catch (err) {
    console.error(err)
    m.reply("❌ Terjadi kesalahan saat memuat data game Tebak Kimia.")
  }
}

handler.command = ["tebakkimia", "unsurkimia", "kimia"]
export default handler