import fs from "fs"

const handler = async (m, { sock }) => {
  
  const dataPath = "./control/games/susunkata.json"
  if (!fs.existsSync(dataPath)) return m.reply("File susunkata.json tidak ditemukan!")

  const file = fs.readFileSync(dataPath, "utf-8")
  const soalList = JSON.parse(file)

  if (!Array.isArray(soalList) || soalList.length === 0)
    return m.reply("Data susunkata.json kosong atau rusak!")

  const random = soalList[Math.floor(Math.random() * soalList.length)]
  const { soal, tipe, jawaban } = random

  await sock.sendMessage(
    m.chat,
    {
      text: `🧩 *SUSUN KATA*\n\n🔠 Susun huruf berikut:\n> ${soal}\n\n💡 *Kategori:* ${tipe}\n⏰ *Waktu:* 5 menit\n\nKetik jawabanmu langsung!\nAtau *.nyerah* kalau udah mentok 😅`,
    },
    { quoted: m }
  )

  // Inisialisasi global game
  global.game = global.game || {}

  // Simpan sesi game di chat ini
  global.game[m.chat] = {
    type: "susunkata",
    soal,
    jawaban: jawaban.toLowerCase(),
    user: m.sender,
    waktu: Date.now(),
    timeout: setTimeout(() => {
      if (global.game[m.chat]) {
        sock.sendMessage(m.chat, {
          text: `⏰ Waktu habis! Jawabannya *${jawaban}*.\nMain lagi? *.susunkata*`,
        }, { quoted: m })
        delete global.game[m.chat]
      }
    }, 300000), // 5 menit
  }
}

handler.command = ["susunkata", "kata"]
export default handler