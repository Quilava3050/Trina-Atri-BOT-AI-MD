import fs from "fs"

const handler = async (m, { sock }) => {

  try {
    const path = "./control/games/tebaktebakan.json"
    if (!fs.existsSync(path)) return m.reply("❌ File tebaktebakan.json tidak ditemukan!")

    // Baca dan parse data
    const data = JSON.parse(fs.readFileSync(path, "utf-8"))
    if (!Array.isArray(data) || data.length === 0)
      return m.reply("❌ Data tebakan kosong atau rusak!")

    // Pilih soal acak
    const random = data[Math.floor(Math.random() * data.length)]
    const { soal, jawaban } = random

    // Kirim soal
    await sock.sendMessage(
      m.chat,
      {
        text: `🧠 *TEBAK-TEBAKAN*\n\n${soal}\n\n⏰ *Waktu:* 5 menit\nKetik jawabanmu langsung!\nAtau *.nyerah* kalau udah buntu 😅`,
      },
      { quoted: m }
    )

    // Simpan status game ke global
    global.game = global.game || {}
    global.game[m.chat] = {
      type: "tebaktebakan",
      soal,
      jawaban: jawaban.toLowerCase(),
      user: m.sender,
      waktu: Date.now(),
      timeout: setTimeout(() => {
        if (global.game[m.chat]) {
          sock.sendMessage(m.chat, {
            text: `⏰ Waktu habis! Jawabannya adalah *${jawaban.toUpperCase()}* 😄\nMain lagi? *.tebaktebakan*`,
          }, { quoted: m })
          delete global.game[m.chat]
        }
      }, 300000), // 5 menit
    }
  } catch (err) {
    console.error(err)
    m.reply("❌ Terjadi kesalahan saat memuat game Tebak-Tebakan.")
  }
}

handler.command = ["tebaktebakan", "tebakan", "tebakjenaka"]
export default handler