import fetch from 'node-fetch';

let handler = async (m, { sock, conn, text, usedPrefix, command }) => {
   const client = sock || conn;
   const apiKey = global.zansxart;

   if (!apiKey) {
      return m.reply('API Key belum dikonfigurasi di global.zansxart.');
   }

   // Ambil teks dari pesan atau dari pesan yang di-reply
   let codeText = text;
   if (!codeText && m.quoted && m.quoted.text) {
      codeText = m.quoted.text;
   }

   if (!codeText) {
      return m.reply(
         `Masukkan kode atau balas pesan berisi kode yang ingin dibuat Carbon!\n\n` +
         `*Contoh Penggunaan:*\n` +
         `• *${usedPrefix + command} console.log('Hello');*\n` +
         `• *${usedPrefix + command} const a = 1; | main.js* _(dengan nama file)_`
      );
   }

   // Default nama file dan tema dikunci ke 'nord'
   let title = 'script.js';
   const theme = 'nord';

   // Parsus jika pengguna menyertakan nama file setelah pemisah '|'
   if (codeText.includes('|')) {
      const parts = codeText.split('|').map(p => p.trim());
      codeText = parts[0];
      if (parts[1]) title = parts[1];
   }

   await m.reply('Sedang membuat gambar Carbon...');

   try {
      const endpoint = `https://api.zansxart.me/api/maker/carbon?code=${encodeURIComponent(codeText)}&title=${encodeURIComponent(title)}&theme=${theme}`;
      
      const res = await fetch(endpoint, {
         method: 'GET',
         headers: {
            'X-API-Key': apiKey,
         },
      });

      if (!res.ok) {
         return m.reply(`Gagal membuat Carbon (HTTP Status: ${res.status}).`);
      }

      const buffer = await res.buffer();

      let caption = `✨ *Carbon Code Snippet*\n`;
      caption += `• *File:* \`${title}\`\n`;
      caption += `• *Theme:* \`${theme}\``;

      await client.sendMessage(
         m.chat,
         {
            image: buffer,
            caption: caption,
         },
         { quoted: m }
      );
   } catch (e) {
      console.error('[carbon error]', e);
      await m.reply('Terjadi kesalahan saat memproses gambar: ' + (e?.message || e));
   }
};

handler.help = ['carbon <kode>', 'carbon <kode> | <filename>'];
handler.tags = ['maker', 'tools'];
handler.command = ['carbon']

export default handler;