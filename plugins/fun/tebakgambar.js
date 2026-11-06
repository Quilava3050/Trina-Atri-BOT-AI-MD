import fs from "fs"

const handler = async (m, { sock }) => {

  try {
    const dataPath = "./control/games/tebakgambar.json"
    if (!fs.existsSync(dataPath)) return m.reply("File tebakgambar.json tidak ditemukan!")

    const file = fs.readFileSync(dataPath, "utf-8")
    const soalList = JSON.parse(file)

    if (!Array.isArray(soalList) || soalList.length === 0)
      return m.reply("Data tebakgambar.json kosong atau rusak!")

    const random = soalList[Math.floor(Math.random() * soalList.length)]
    const { img, jawaban, deskripsi } = random

    await sock.sendMessage(
      m.chat,
      {
        image: { url: img },
        caption: `🧠 *TEBAK GAMBAR*\n\nLihat gambar di atas dan tebak maksudnya!\n\n⏰ *Waktu:* 5 menit dari sekarang\nKetik jawabanmu langsung di chat ini.\nKalau nyerah, ketik *.nyerah* 😅`,
      },
      { quoted: m }
    )

    // Simpan status game
    global.game = global.game || {}
    global.game[m.chat] = {
      type: "tebakgambar",
      soal: img,
      jawaban: jawaban.toLowerCase(),
      deskripsi,
      user: m.sender,
      waktu: Date.now(),
      timeout: setTimeout(() => {
        if (global.game[m.chat]) {
          sock.sendMessage(m.chat, {
            text: `⏰ Waktu habis!\nJawabannya adalah *${jawaban}* 🧩\n💡 ${deskripsi || ''}\n\nMain lagi? *.tebakgambar*`,
          }, { quoted: m })
          delete global.game[m.chat]
        }
      }, 300000), // 5 menit
    }
  } catch (err) {
    console.error(err)
    m.reply("❌ Terjadi kesalahan saat membaca data game.")
  }
}

handler.command = ["tebakgambar"]
export default handler