import fs from "fs"

const handler = async (m, { sock }) => {

  try {
    const dataPath = "./control/games/caklontong.json"
    if (!fs.existsSync(dataPath)) return m.reply("File caklontong.json tidak ditemukan!")

    const file = fs.readFileSync(dataPath, "utf-8")
    const soalList = JSON.parse(file)

    if (!Array.isArray(soalList) || soalList.length === 0)
      return m.reply("❌ Data caklontong.json kosong atau rusak!")

    // Pilih soal acak
    const random = soalList[Math.floor(Math.random() * soalList.length)]
    const { soal, jawaban, deskripsi } = random

    // Kirim pesan soal
    await sock.sendMessage(
      m.chat,
      {
        text: `🎯 *CAK LONTONG*\n\n> ${soal}\n\n⏰ *Waktu:* 5 menit\nKetik jawabanmu langsung!\nAtau *.nyerah* kalau udah pusing 🤣`,
      },
      { quoted: m }
    )

    // Simpan data game ke global
    global.game = global.game || {}
    global.game[m.chat] = {
      type: "caklontong",
      soal,
      jawaban: jawaban.toLowerCase(),
      deskripsi,
      user: m.sender,
      waktu: Date.now(),
      timeout: setTimeout(() => {
        if (global.game[m.chat]) {
          sock.sendMessage(m.chat, {
            text: `⏰ Waktu habis!\nJawabannya *${jawaban}*.\n💡 ${deskripsi || ''}\nMain lagi? *.caklontong*`,
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

handler.command = ["caklontong"]
export default handler