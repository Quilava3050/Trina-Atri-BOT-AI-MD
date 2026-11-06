import fetch from 'node-fetch';

let handler = async (m, { sock, conn, text, usedPrefix, command }) => {
   const client = sock || conn;
   const apiKey = global.zansxart;

   if (!apiKey) {
      return m.reply('API Key belum dikonfigurasi di global.zansxart.');
   }

   if (!text) {
      return m.reply(`Masukkan kata kunci pencarian!\n\nContoh:\n• *${usedPrefix + command} hinata*`);
   }

   await m.reply('Lagi nyari dan mengunduh gambar...');

   try {
      const endpoint = `https://api.zansxart.me/api/anime/r34?query=${encodeURIComponent(text)}&limit=20&type=all`;
      const res = await fetch(endpoint, {
         method: 'GET',
         headers: {
            'X-API-Key': apiKey,
         },
      });

      const json = await res.json();

      if (!json.status || !json.result || json.result.length === 0) {
         return m.reply(`Gambar dengan kata kunci *"${text}"* tidak ditemukan.`);
      }

      // Filter item yang memiliki URL media valid
      const validItems = json.result.filter(i => i.file_url || i.sample_url || i.preview_url);

      if (validItems.length === 0) {
         return m.reply('Tidak ada gambar valid yang bisa diambil.');
      }

      // Ambil hingga 10 gambar pertama dari hasil pencarian
      const selected = validItems.slice(0, 10);

      // Unduh tiap gambar ke bentuk Buffer secara paralel untuk menghindari error Stream/404 dari Baileys
      const downloadedImages = await Promise.all(
         selected.map(async (item) => {
            const mediaUrl = item.file_url || item.sample_url || item.preview_url;
            try {
               const imgRes = await fetch(mediaUrl, {
                  headers: {
                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                     'Referer': 'https://rule34.xxx/',
                  },
               });

               if (!imgRes.ok) return null;
               return await imgRes.buffer();
            } catch (e) {
               return null;
            }
         })
      );

      // Filter hasil unduhan yang berhasil (non-null)
      const validBuffers = downloadedImages.filter(buf => buf !== null);

      if (validBuffers.length === 0) {
         return m.reply('Gagal mengunduh gambar dari server sumber.');
      }

      // Susun struktur payload album
      const album = validBuffers.map((buffer, i) => ({
         image: buffer,
         caption: i === 0 ? `🔞 *Rule34 Result for:* ${text} (${validBuffers.length} Gambar)` : undefined,
      }));

      // Kirim album gambar
      await client.sendMessage(
         m.chat,
         { album },
         { quoted: m }
      );
   } catch (e) {
      console.error('[r34 error]', e);
      await m.reply('Gagal mengambil data dari API: ' + (e?.message || e));
   }
};

handler.help = ['r34 <query>', 'rule34 <query>'];
handler.tags = ['nsfw', 'anime'];
handler.command = ['r34','rule34']
handler.private = true

export default handler;