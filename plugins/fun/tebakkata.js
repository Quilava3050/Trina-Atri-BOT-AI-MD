import fs from "fs"

const handler = async (m, { sock }) => {

  try {
    const dataPath = "./control/games/tebakkata.json"
    if (!fs.existsSync(dataPath)) return m.reply("❌ File tebakkata.json tidak ditemukan!")

    // Baca dan parse data JSON
    const file = fs.readFileSync(dataPath, "utf-8")
    const soalList = JSON.parse(file)

    if (!Array.isArray(soalList) || soalList.length === 0)
      return m.reply("❌ Data tebakkata.json kosong atau rusak!")

    // Pilih soal acak
    const random = soalList[Math.floor(Math.random() * soalList.length)]
    const { soal, jawaban } = random

    // Kirim pertanyaan
    await sock.sendMessage(
      m.chat,
      {
        text: `🧩 *TEBAK KATA*\n\n🔤 Petunjuk:\n> ${soal}\n\n⏰ *Waktu:* 5 menit\nKetik jawabanmu langsung!\nAtau *.nyerah* kalau mentok 😅`,
      },
      { quoted: m }
    )

    // Simpan data game ke global
    global.game = global.game || {}
    global.game[m.chat] = {
      type: "tebakkata",
      soal,
      jawaban: jawaban.toLowerCase(),
      user: m.sender,
      waktu: Date.now(),
      timeout: setTimeout(() => {
        if (global.game[m.chat]) {
          sock.sendMessage(m.chat, {
            text: `⏰ Waktu habis! Jawabannya *${jawaban.toUpperCase()}*.\nMain lagi? *.tebakkata*`,
          }, { quoted: m })
          delete global.game[m.chat]
        }
      }, 300000), // 5 menit
    }
  } catch (err) {
    console.error(err)
    m.reply("❌ Terjadi kesalahan saat membaca data game Tebak Kata.")
  }
}

handler.command = ["tebakkata", "katatebak"]
export default handler