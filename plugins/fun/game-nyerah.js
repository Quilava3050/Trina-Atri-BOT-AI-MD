const handler = async (m, { sock }) => {
  if (!global.game || !global.game[m.chat])
    return m.reply("Tidak ada game yang sedang berlangsung di chat ini.")

  const game = global.game[m.chat]

  await sock.sendMessage(m.chat, {
    text: `😅 *Menyerah ya?*\n\n🎮 Game: *${game.type.toUpperCase()}*\n🧠 Jawaban: *${game.jawaban}*${
      game.deskripsi ? `\n💡 ${game.deskripsi}` : ""
    }\n\nMau main lagi? *.${game.type}*`,
  }, { quoted: m })

  clearTimeout(game.timeout)
  delete global.game[m.chat]
}

handler.command = ["nyerah"]
export default handler