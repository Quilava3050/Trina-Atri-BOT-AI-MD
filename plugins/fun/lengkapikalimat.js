import fs from "fs"

const handler = async (m, { sock }) => {
  
  try {
    const dataPath = "./control/games/tebakkalimat.json"
    if (!fs.existsSync(dataPath)) return m.reply("❌ File tebakkalimat.json tidak ditemukan!")

    // Baca & parse data JSON
    const file = fs.readFileSync(dataPath, "utf-8")
    const soalList = JSON.parse(file)

    if (!Array.isArray(soalList) || soalList.length === 0)
      return m.reply("❌ Data tebakkalimat.json kosong atau rusak!")

    // Pilih soal acak
    const random = soalList[Math.floor(Math.random() * soalList.length)]
    const { soal, jawaban } = random

    // Kirim pertanyaan ke user
    await sock.sendMessage(
      m.chat,
      {
        text: `✍️ *LENGKAPI KALIMAT*\n\n> ${soal}\n\n⏰ *Waktu:* 5 menit\nKetik jawabanmu langsung!\nAtau *.nyerah* kalau mentok 😅`,
      },
      { quoted: m }
    )

    // Simpan status game
    global.game = global.game || {}
    global.game[m.chat] = {
      type: "lengkapikalimat",
      soal,
      jawaban: jawaban.toLowerCase(),
      user: m.sender,
      waktu: Date.now(),
      timeout: setTimeout(() => {
        if (global.game[m.chat]) {
          sock.sendMessage(m.chat, {
            text: `⏰ Waktu habis! Jawabannya *${jawaban}*.\nMain lagi? *.lengkapikalimat*`,
          }, { quoted: m })
          delete global.game[m.chat]
        }
      }, 300000), // 5 menit
    }
  } catch (err) {
    console.error(err)
    m.reply("❌ Terjadi kesalahan saat membaca data game Lengkapi Kalimat.")
  }
}

handler.command = ["lengkapikalimat", "kalimat"]
export default handler