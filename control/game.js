import similarity from "similarity"

export default async function checkGame(m, sock) {
  if (!global.game) global.game = {}
  if (m.text?.startsWith('.') || m.text?.startsWith('!') || m.text?.startsWith('/')) return

  const game = global.game[m.chat]
  if (!game) return

  const jawabanUser = m.text?.toLowerCase().trim()
  if (!jawabanUser) return
  if (game.user && m.sender !== game.user) return

  if (jawabanUser === game.jawaban.toLowerCase()) {
    await sock.sendMessage(m.chat, {
      text: `🎉 *Horeee Benar!* 

Jawabannya adalah *${game.jawaban}* 👏${game.deskripsi ? `\n💡 ${game.deskripsi}` : ""}\n\n

🎮 Mau main lagi? *.${game.type}*`,
    }, { quoted: m })
    clearTimeout(game.timeout)
    delete global.game[m.chat]
  } else if (similarity(jawabanUser, game.jawaban) >= 0.72) {
    await sock.sendMessage(m.chat, { text: `*🤩 Ayoooo, Hampir benar!*` }, { quoted: m })
  } else {
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
  }
}