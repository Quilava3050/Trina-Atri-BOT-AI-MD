import axios from 'axios'

const handler = async (m, { sock, text, reply, usedPrefix, command }) => {
  
  if (!text) {
    return reply(`Ex: ${usedPrefix + command} text nya`)
  }

  const tulisan = text.substring(0, 500)

  reply('Wait...')

  try {
   
    const apiNulis = `${global.api.free3}/maker/nulis?text=${encodeURIComponent(tulisan)}`
    
    // Tarik hasil langsung berupa arraybuffer (file gambar mentah)
    const { data } = await axios.get(apiNulis, { responseType: 'arraybuffer' })

    // Validasi jaga-jaga kalau API lagi limit atau ngeluarin JSON error
    try {
      const jsonCheck = JSON.parse(data.toString())
      if (jsonCheck && jsonCheck.status === false) {
        return reply(`❌ Error dari API: ${jsonCheck.message || 'Gagal memproses tulisan.'}`)
      }
    } catch (e) {
      // Kalo parse eror, berarti aman (datanya murni gambar)
    }

    // Kirim hasil gambar tulisan ke chat
    await sock.sendMessage(m.chat, { 
      image: Buffer.from(data), 
      caption: `Result` 
    }, { quoted: m })

  } catch (e) {
    console.error('[Nulis Maker Error]:', e.response?.data || e.message)
    reply(`❌ Terjadi kesalahan sistem: ${e.response?.status === 414 ? 'Teks kepanjangan bwang' : e.message}`)
  }
}

handler.command = ["nulis", "nulisbuku", "write"]
export default handler