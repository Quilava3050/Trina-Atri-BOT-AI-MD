import axios from 'axios'

const handler = async (m, { sock, text, reply, usedPrefix, command }) => {

  if (!text) {
    return reply(`Ex:\n${usedPrefix}${command} nasi kebuli`)
  }

  reply('Wait...')

  try {
    const api = `${global.api.free3}/search/resep?q=${encodeURIComponent(text)}`
    const { data } = await axios.get(api)

    // Cek respon API
    if (!data?.status || !data?.result || data.result.length === 0) {
      return reply('❌ Resep masakan tidak ditemukan. Coba menu yang lain bwang!')
    }

    // Ambil 1 resep paling atas (paling relevan)
    const res = data.result[0]

    // Bikin caption mantap pake format rapi
    let caption = `*🍳 RESEP: ${res.judul.toUpperCase()}*\n\n`
    caption += `› ⏱️ *Waktu Masak:* ${res.waktu_masak || '-'}\n`
    caption += `› 🍽️ *Hasil/Porsi:* ${res.hasil || '-'}\n`
    caption += `› 📊 *Tingkat Kesulitan:* ${res.tingkat_kesulitan || '-'}\n\n`
    
    caption += `*🛒 BAHAN-BAHAN:*\n`
    caption += `${res.bahan || '-'}\n\n`
    
    caption += `*👨‍🍳 CARA MEMBUAT:*\n`
    caption += `${res.langkah_langkah || '-'}\n\n`
    
    caption += `🔗 *Link Sumber:* ${res.link || '-'}\n`

    // Kirim pesan pake foto makanannya
    await sock.sendMessage(m.chat, {
      image: { url: res.thumbnail },
      caption: caption
    }, { quoted: m })

  } catch (e) {
    console.error('[Resep Search Error]:', e.response?.data || e.message)
    reply(`❌ Error Server/API: ${e.response?.data?.message || e.message}`)
  }
}

handler.command = ["resep", "masak", "caramasak"]
export default handler