import axios from 'axios'

const handler = async (m, { sock, reply, example, args, usedPrefix, command }) => {

  if (!args[0]) {
    return reply(`Ex:\n${usedPrefix}${command} link\n\nContoh: ${usedPrefix}${command} https://www.facebook.com/share/v/1GPTVpKDiQ/`)
  }

  const url = args[0]

  // Validasi simpel biar gak dimasukin link aneh-aneh
  if (!url.includes('facebook.com') && !url.includes('fb.watch') && !url.includes('fb.gg')) {
    return reply('❌ Link harus dari Facebook!')
  }

  reply('Wait...')

  try {
    const api = `${global.api.free3}/downloader/facebook?url=${encodeURIComponent(url)}`
    const { data } = await axios.get(api)

    // Cek respon API sesuai JSON lu
    if (!data?.status || !data?.result) {
      return reply('❌ Gagal mengambil data dari server API.')
    }

    const res = data.result

    // Prioritaskan kualitas HD, kalau kosong pake SD
    const videoUrl = res.video_hd || res.video_sd

    if (!videoUrl) {
      return reply('❌ Link video tidak ditemukan dalam respon API.')
    }

    // Bikin caption estetik dari data JSON
    await sock.sendMessage(m.chat, { 
      video: { url: videoUrl }
    }, { quoted: m })

  } catch (e) {
    console.error('[FB Downloader Error]:', e.response?.data || e.message)
    reply(`❌ Error Server/API: ${e.response?.data?.message || e.message}`)
  }
}

handler.command = ["fbdl", "fb", "facebook"]
export default handler;