import { translate } from '@vitalets/google-translate-api'

let handler = async (m, { sock, args, usedPrefix, command }) => {
  let lang, text

  // 1. Cek apakah ada argumen bahasa + teks
  if (args.length >= 2) {
    lang = args[0] || 'id'
    text = args.slice(1).join(' ')
  } 
  // 2. Jika ada pesan yang di-reply
  else if (m.quoted && m.quoted.text) {
    lang = args[0] || 'id'
    text = m.quoted.text
  } 
  // 3. Jika input tidak sesuai
  else {
    return sock.sendMessage(m.chat, {
      text: `⚠️ Contoh penggunaan:\n${usedPrefix + command} id hello i am robot\nAtau reply pesan dengan ketik: ${usedPrefix + command} id`
    }, { quoted: m })
  }

  try {
    // Reaksi indikator proses
    await sock.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    // Proses terjemahan
    let res = await translate(text, { to: lang, autoCorrect: true }).catch(_ => null)

    // Jika bahasa tidak didukung atau API error
    if (!res) {
      await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return sock.sendMessage(m.chat, {
        text: `❌ Error: Kode bahasa "${lang}" tidak didukung atau terjadi kesalahan.`
      }, { quoted: m })
    }

    // Kirim hasil terjemahan menggunakan sock
    const caption = `🌐 *Hasil Terjemahan*\n\n` +
      `📌 *Terdeteksi dari:* ${res.from?.language?.iso || 'Auto'}\n` +
      `➡️ *Diterjemahkan ke:* ${lang}\n\n` +
      `📝 *Hasil:* ${res.text}`

    await sock.sendMessage(m.chat, { text: caption.trim() }, { quoted: m })
    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    console.error("Error Translate Plugin:", err)
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await sock.sendMessage(m.chat, {
      text: 'Terjadi kesalahan saat memproses terjemahan.'
    }, { quoted: m })
  }
}

// Informasi command
handler.help = ['translate <kode_bahasa> <teks>']
handler.tags = ['tools']
handler.command = ['translate', 'tr']

export default handler