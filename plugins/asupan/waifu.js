import axios from 'axios'

let handler = async (m, { sock, command, usedPrefix }) => {
  try {
    // Reaksi indikator proses
    await sock.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    // Panggil API Botcahx menggunakan API Key dari global.btc
    const response = await axios.get('https://api.botcahx.eu.org/api/anime/waifu', {
      params: {
        apikey: global.btc
      },
      responseType: 'arraybuffer'
    })

    // Konversi hasil binary ke Buffer
    const imageBuffer = Buffer.from(response.data)

    // Kirim gambar beserta Tombol Interactive (Quick Reply)
    await sock.sendMessage(m.chat, {
      image: imageBuffer,
      caption: '✨ *Random Waifu*',
      footer: 'Klik tombol di bawah untuk gambar lainnya',
      buttons: [
        {
          buttonId: `${usedPrefix}${command}`,
          buttonText: { displayText: 'Next 🔄' },
          type: 1
        }
      ],
      headerType: 4
    }, { quoted: m })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    console.error("Error Random Waifu Plugin:", err.response?.data || err.message)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await sock.sendMessage(m.chat, {
      text: 'Gagal mengambil gambar waifu. Pastikan global.btc sudah terisi dengan benar.'
    }, { quoted: m })
  }
}

// Informasi command
handler.help = ['waifu']
handler.tags = ['anime']
handler.command = ['waifu', 'randomwaifu']

export default handler