import fs from "fs"

const handler = async (m, { sock }) => {

  try {
    const dataPath = "./control/games/siapaaku.json"
    if (!fs.existsSync(dataPath)) return m.reply("❌ File siapaaku.json tidak ditemukan!")

    // Baca file JSON
    const file = fs.readFileSync(dataPath, "utf-8")
    const soalList = JSON.parse(file)

    if (!Array.isArray(soalList) || soalList.length === 0)
      return m.reply("❌ Data siapaaku.json kosong atau rusak!")

    // Ambil soal acak
    const random = soalList[Math.floor(Math.random() * soalList.length)]
    const { soal, jawaban } = random

    // Kirim pertanyaan ke chat
    await sock.sendMessage(
      m.chat,
      {
        text: `🕵️‍♂️ *SIAPA AKU*\n\n${soal}\n\n⏰ *Waktu:* 5 menit\nKetik jawabanmu langsung!\nAtau *.nyerah* kalau udah bingung 😅`,
      },
      { quoted: m }
    )

    // Simpan status game
    global.game = global.game || {}
    global.game[m.chat] = {
      type: "siapaaku",
      soal,
      jawaban: jawaban.toLowerCase(),
      user: m.sender,
      waktu: Date.now(),
      timeout: setTimeout(() => {
        if (global.game[m.chat]) {
          sock.sendMessage(m.chat, {
            text: `⏰ Waktu habis!\nJawabannya adalah *${jawaban}* 🧩\nMain lagi? *.siapaaku*`,
          }, { quoted: m })
          delete global.game[m.chat]
        }
      }, 300000), // 5 menit
    }
  } catch (err) {
    console.error(err)
    m.reply("❌ Terjadi kesalahan saat membaca data game Siapa Aku.")
  }
}

handler.command = ["siapaaku", "tebaksiapaaku"]
export default handler