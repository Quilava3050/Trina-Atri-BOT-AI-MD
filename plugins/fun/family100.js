import fs from "fs"

const handler = async (m, { sock }) => {

  try {
    const dataPath = "./control/games/family100.json"
    if (!fs.existsSync(dataPath)) return m.reply("❌ File family100.json tidak ditemukan!")

    // Baca file JSON
    const file = fs.readFileSync(dataPath, "utf-8")
    const soalList = JSON.parse(file)

    if (!Array.isArray(soalList) || soalList.length === 0)
      return m.reply("❌ Data family100.json kosong atau rusak!")

    // Pilih soal acak
    const random = soalList[Math.floor(Math.random() * soalList.length)]
    const { soal, jawaban } = random

    // Kirim pertanyaan ke user
    await sock.sendMessage(
      m.chat,
      {
        text: `👨‍👩‍👧‍👦 *FAMILY 100*\n\n💬 Pertanyaannya:\n> ${soal}\n\n💡 Ada *${jawaban.length}* jawaban benar!\n\nKetik jawabanmu satu per satu.\n⏰ *Waktu:* 5 menit\nKetik *.nyerah* kalau menyerah 😅`,
      },
      { quoted: m }
    )

    // Simpan data game ke global
    global.game = global.game || {}
    global.game[m.chat] = {
      type: "family100",
      soal,
      jawaban: jawaban.map(v => v.toLowerCase()),
      ditemukan: [],
      user: m.sender,
      waktu: Date.now(),
      timeout: setTimeout(() => {
        if (global.game[m.chat]) {
          const belum = global.game[m.chat].jawaban
            .filter(j => !global.game[m.chat].ditemukan.includes(j))
          sock.sendMessage(m.chat, {
            text: `⏰ Waktu habis!\n\nJawaban yang belum disebut:\n${belum.map(j => `• ${j}`).join("\n")}\n\nMain lagi? *.family100*`,
          }, { quoted: m })
          delete global.game[m.chat]
        }
      }, 300000), // 5 menit
    }
  } catch (err) {
    console.error(err)
    m.reply("❌ Terjadi kesalahan saat membaca data Family 100.")
  }
}

handler.command = ["family100", "fam100"]
export default handler