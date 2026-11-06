const handler = async (m, { sock, reply }) => {
  try {
    const owners = [
      ['6282113148932', 'Dhieka Ananda Aquila', 'Player FF'],
      ['60138068178', global.namaBot, 'Bot WhatsApp']
    ]

    const contacts = owners.map(([number, name, about]) => ({
      displayName: name,
      vcard: `
BEGIN:VCARD
VERSION:3.0
N:${name}
FN:${name}
ORG:${about}
TEL;type=CELL;type=VOICE;waid=${number}:${number}
END:VCARD`
    }))

    // Kirim semua kontak dalam satu bubble/list
    await sock.sendMessage(
      m.chat,
      {
        contacts: {
          displayName: `${owners.length} Owner`,
          contacts
        }
      },
      { quoted: m }
    )

    // Kirim pesan teks
    await reply(`Hai kak *${m.pushName}*, ini adalah pengembang ku *Trina*!`)
  } catch (e) {
    console.error(e)
    await reply("❌ Terjadi error saat mengirim kontak owner!")
  }
}

handler.command = ["owner", "own", "dev"]
export default handler