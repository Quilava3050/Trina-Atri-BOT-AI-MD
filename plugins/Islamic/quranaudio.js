import fetch from "node-fetch"

let handler = async (m, { sock, text, reply, usedPrefix, command }) => {

  if (!text) return m.reply(`Contoh : ${usedPrefix + command} 1\n\nKetik *.listsurah* Untuk Melihat Daftar Surat`)

  try {
    const todi = await fetch('https://raw.githubusercontent.com/dcode-al/database/refs/heads/main/Islami/quranaudio.json')
    const data = await todi.json()
    const tod = data[text - 1]

    if (!tod) return reply('❌ Nomor surah tidak ditemukan.')

    const arti = tod.asma.translation.id
    const audio = tod.audio
    const asma = tod.asma.ar.short
    const ayat = tod.ayatCount
    const keterangan = tod.tafsir
    const nama = tod.asma.id.short
    const nomor = tod.number
    const tempat = tod.type

    const quran = `*乂 QURAN AUDIO*

*Nama* : ${nama}
*Asma* : ${asma}
*Surat Ke* : ${nomor}
*Arti* : ${arti}
*Total Ayat* : ${ayat}
*Type* : ${tempat}
*Keterangan* : ${keterangan}\n\n_Loading Audio..._`

    await reply(quran)
    await sock.sendMessage(m.chat, {
      audio: { url: audio },
      mimetype: 'audio/mpeg'
    }, { quoted: m })
  } catch (error) {
    console.error(error)
    m.reply('⚠️ Terjadi kesalahan')
  }
}

handler.command = ["quranaudio", "alquranaudio"]

export default handler