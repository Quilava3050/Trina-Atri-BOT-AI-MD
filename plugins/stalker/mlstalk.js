import axios from 'axios'

let handler = async (m, { sock, args, command, usedPrefix }) => {
  // Objek Fake Quote (fkontak)
  const fkontak = {
    key: {
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast"
    },
    message: {
      contactMessage: {
        displayName: global.namaOwner || "Owner",
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${global.namaOwner || "Owner"};;;\nFN:${global.namaOwner || "Owner"}\nEND:VCARD`
      }
    }
  }

  if (args.length < 2) {
    return sock.sendMessage(m.chat, {
      text: `⚠️ *Format salah!*\n\nGunakan format: *${usedPrefix + command} <id> <zone>*\nContoh: *${usedPrefix + command} 950769946 12774*`
    }, { quoted: fkontak })
  }

  let [id, zone] = args

  await sock.sendMessage(m.chat, {
    react: { text: '🔍', key: m.key }
  })

  try {
    const payload = {
      code: "MOBILE_LEGENDS",
      data: {
        userId: String(id),
        zoneId: String(zone)
      }
    }

    let res = await axios.post("https://gopay.co.id/games/v1/order/user-account", payload, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    })

    let { message, data } = res.data

    if (message !== "Success" || !data?.username) {
      await sock.sendMessage(m.chat, {
        react: { text: '❌', key: m.key }
      })

      return sock.sendMessage(m.chat, {
        text: '❌ Gagal mengambil data. Pastikan User ID dan Zone ID benar!'
      }, { quoted: fkontak })
    }

    let username = data.username
    let country = data.countryOrigin ? data.countryOrigin.toUpperCase() : "UNKNOWN"

    let messageText = `🎮 *MOBILE LEGENDS STALKER*\n\n` +
                      `👤 *Username:* ${username}\n` +
                      `🆔 *User ID:* ${id}\n` +
                      `🌐 *Zone ID:* ${zone}\n` +
                      `🚩 *Region:* ${country}`

    await sock.sendMessage(m.chat, {
      text: messageText
    }, { quoted: fkontak })

    await sock.sendMessage(m.chat, {
      react: { text: '✅', key: m.key }
    })

  } catch (e) {
    console.error('[ML STALK ERROR]:', e)

    await sock.sendMessage(m.chat, {
      react: { text: '❌', key: m.key }
    })

    sock.sendMessage(m.chat, {
      text: '❌ Terjadi kesalahan saat mengecek ID. Pastikan ID dan Zone valid.'
    }, { quoted: fkontak })
  }
}

handler.help = ['ml <id> <zone>']
handler.tags = ['stalk']
handler.command = ['ml', 'mlstalk']

export default handler