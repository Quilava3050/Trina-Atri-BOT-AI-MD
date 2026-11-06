import { downloadTikTok } from '../../control/lib/tiktok.js'

const handler = async (m, extra) => {
   
   const sock = extra?.sock || extra?.conn || global.conn || global.sock
   const args = extra?.args || []
   const command = extra?.command || 'tiktok'

   if (!args[0]) return m.reply(`Contoh:\n.${command} https://vt.tiktok.com/ZSY5SgvHE/`)
   if (!args[0].includes('tiktok.com')) return m.reply('❌ Link tidak valid!')

   // Kirim pesan tunggu / reaksi
   if (typeof global.waitRandom === 'function') {
      await global.waitRandom(sock, m)
   } else if (global.wait) {
      await m.reply(global.wait)
   }

   try {
      // Panggil fungsi eksternal dari control/lib/tiktok.js
      await downloadTikTok(args[0], m, sock)
   } catch (e) {
      console.error('[TikTok DL Error]:', e)
      return m.reply('Ada kesalahan saat mengunduh TikTok! Hubungi owner.')
   }
}

handler.help = ['tiktok <url>']
handler.tags = ['downloader']
handler.command = ['tiktok', 'tt', 'ttdl', 'tiktokdl']

export default handler