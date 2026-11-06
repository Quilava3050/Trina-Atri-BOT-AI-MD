import fetch from 'node-fetch';
import { UploadFileUgu } from '../../control/ugUploade.js';

let handler = async (m, { sock, conn, text, usedPrefix, command }) => {
   const client = sock || conn;
   const apiKey = global.zansxart;

   if (!apiKey) {
      return m.reply('API Key belum dikonfigurasi di global.zansxart.');
   }

   const listEffect = ['slowed', 'slowed-reverb', 'nightcore', 'bassboost', 'chipmunk', 'robot', '8d', 'reverse'];

   const q = m.quoted ? m.quoted : m;
   const mime = (q.msg || q).mimetype || '';

   if (!/audio/.test(mime)) {
      return m.reply(
         `Balas (reply) audio atau vn yang ingin diubah dengan menyebutkan nama efek!\n\n` +
         `*Pilihan Efek:*\n${listEffect.map(v => `• ${v}`).join('\n')}\n\n` +
         `*Contoh Penggunaan:*\n` +
         `• Reply audio lalu ketik: *${usedPrefix + command} slowed-reverb*`
      );
   }

   const effect = (text || '').trim().toLowerCase();
   if (!effect || !listEffect.includes(effect)) {
      return m.reply(
         `Pilihan efek tidak valid!\n\n` +
         `Silakan pilih salah satu efek berikut:\n` +
         `${listEffect.map(v => `• *${usedPrefix + command} ${v}*`).join('\n')}`
      );
   }

   await m.reply(`Mengunduh media dan memproses efek *${effect}*...`);

   try {
      const audioBuffer = await q.download();
      if (!audioBuffer) {
         return m.reply('Gagal mengunduh audio dari WhatsApp.');
      }

      // Upload ke Uguu
      let uguuResult = await UploadFileUgu(audioBuffer);
      
      // Ambil string URL-nya jika responnya berupa object
      let rawUrl = typeof uguuResult === 'object' ? (uguuResult.url || uguuResult.result || uguuResult.file) : uguuResult;

      if (!rawUrl || typeof rawUrl !== 'string') {
         return m.reply('Gagal mendapatkan URL audio dari Uguu.');
      }

      // Bersihkan URL dari spasi/karakter tersembunyi
      const audioUrl = rawUrl.trim();

      // Panggil API Audio Effect Zansxart
      const endpoint = `https://api.zansxart.me/api/tools/audioeffect?url=${encodeURIComponent(audioUrl)}&effect=${encodeURIComponent(effect)}`;
      
      const res = await fetch(endpoint, {
         method: 'GET',
         headers: {
            'X-API-Key': apiKey,
         },
      });

      if (!res.ok) {
         const errText = await res.text().catch(() => '');
         console.error('[audioeffect API Error]', res.status, errText);
         return m.reply(`Gagal memproses efek audio (HTTP Status: ${res.status}). Coba lagi beberapa saat.`);
      }

      const resultBuffer = await res.buffer();

      await client.sendMessage(
         m.chat,
         {
            audio: resultBuffer,
            mimetype: 'audio/mp4',
            ptt: false,
         },
         { quoted: m }
      );
   } catch (e) {
      console.error('[audioeffect error]', e);
      await m.reply('Terjadi kesalahan saat memproses audio: ' + (e?.message || e));
   }
};

handler.help = ['audioeffect <efek>', 'efekaudio <efek>'];
handler.tags = ['tools', 'audio'];
handler.command = ['soundeffect','efekaudio','audioeffect']

export default handler;