import axios from 'axios'

let handler = async (m, { sock, conn }) => {
  const client = sock || conn
  try {
    const { data } = await axios.get('https://api.ipify.org?format=json')
    const ip = data.ip || data

    if (m.reply) {
      await m.reply(`🌐 IP VPS Kamu: *${ip}*`)
    } else {
      await client.sendMessage(m.chat, { text: `🌐 IP VPS Kamu: *${ip}*` }, { quoted: m })
    }
  } catch (e) {
    console.error(e)
    if (m.reply) {
      await m.reply('❌ Terjadi kesalahan saat memproses permintaan.')
    } else {
      await client.sendMessage(m.chat, { text: '❌ Terjadi kesalahan saat memproses permintaan.' }, { quoted: m })
    }
  }
}

handler.help = ['myip']
handler.tags = ['owner']
handler.command = ['myip']
handler.owner = true

export default handler