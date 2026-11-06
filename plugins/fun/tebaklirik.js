import fs from "fs"

const handler = async (m, { sock }) => {

  try {
    const path = "./control/games/tebaklirik.json"
    if (!fs.existsSync(path)) return m.reply("❌ File tebaklirik.json tidak ditemukan!")

    // Baca data
    const data = JSON.parse(fs.readFileSync(path, "utf-8"))
    if (!Array.isArray(data) || data.length === 0)
      return m.reply("❌ Data tebaklirik.json kosong atau rusak!")

    // Pilih acak
    const random = data[Math.floor(Math.random() * data.length)]
    const { soal, jawaban } = random

    // Kirim soal
    await sock.sendMessage(
      m.chat,
      {
        text: `🎵 *TEBAK LIRIK*\n\nLengkapi lirik lagu berikut:\n\n> ${soal}\n\n⏰ *Waktu:* 5 menit\nKetik jawabanmu langsung!\nAtau *.nyerah* kalau udah buntu 😅`,
      },
      { quoted: m }
    )

    // Simpan data ke global
    global.game = global.game || {}
    global.game[m.chat] = {
      type: "tebaklirik",
      soal,
      jawaban: jawaban.toLowerCase(),
      user: m.sender,
      waktu: Date.now(),
      timeout: setTimeout(() => {
        if (global.game[m.chat]) {
          sock.sendMessage(m.chat, {
            text: `⏰ Waktu habis! Jawabannya adalah *${jawaban.toUpperCase()}* 🎤\nMain lagi? *.tebaklirik*`,
          }, { quoted: m })
          delete global.game[m.chat]
        }
      }, 300000), // 5 menit
    }
  } catch (err) {
    console.error(err)
    m.reply("❌ Terjadi kesalahan saat memuat data game Tebak Lirik.")
  }
}

handler.command = ["tebaklirik", "lirik"]
export default handler