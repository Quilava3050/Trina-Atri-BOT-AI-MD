import fetch from 'node-fetch';
import { UploadFileUgu } from '../../control/ugUploade.js';

let handler = async (m, { sock, conn, args, usedPrefix, command }) => {
   const client = sock || conn;
   const apiKey = global.zansxart;

   if (!apiKey) {
      return m.reply('API Key belum dikonfigurasi di global.zansxart.');
   }

   let audioUrl = '';
   const q = m.quoted ? m.quoted : m;
   const mime = (q.msg || q).mimetype || '';

   // Jika user me-reply media (audio/video)
   if (/audio|video/.test(mime)) {
      await m.reply('Mengunduh media untuk diidentifikasi...');
      const media = await q.download();
      if (!media) return m.reply('Gagal mengunduh media.');

      try {
         const uploadResult = await UploadFileUgu(media);
         audioUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult?.url;

         if (!audioUrl) {
            return m.reply('Gagal mendapatkan URL dari ugUploade.');
         }
      } catch (e) {
         console.error('[whatmusic upload error]', e);
         return m.reply('Gagal mengunggah media via ugUploade: ' + (e?.message || e));
      }
   } else if (args[0] && /^https?:\/\//i.test(args[0])) {
      // Jika user memasukkan URL langsung
      audioUrl = args[0].trim();
   } else {
      return m.reply(`Reply pesan audio/video atau sertakan link audio.\n\nContoh:\n• Reply audio: *${usedPrefix + command}*\n• Pakai link: *${usedPrefix + command} https://h.uguu.se/DvwHTiXv.mp3*`);
   }

   await m.reply('Mencari informasi lagu...');

   try {
      const endpoint = `https://api.zansxart.me/api/tools/whatmusic?url=${encodeURIComponent(audioUrl)}`;
      const res = await fetch(endpoint, {
         method: 'GET',
         headers: {
            'X-API-Key': apiKey,
         },
      });

      const json = await res.json();

      if (!json.status || !json.result) {
         return m.reply('Lagu tidak ditemukan atau terjadi kesalahan dari server API.');
      }

      const { title, artists, album, genres, release_date, duration_ms, score, external_metadata } = json.result;

      // Konversi durasi ke menit:detik
      const durationSec = Math.floor((duration_ms || 0) / 1000);
      const minutes = Math.floor(durationSec / 60);
      const seconds = durationSec % 60;
      const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      let caption = `🎵 *WHAT MUSIC IDENTIFIER* 🎵\n\n`;
      caption += `• *Judul:* ${title || '-'}\n`;
      caption += `• *Artis:* ${artists || '-'}\n`;
      caption += `• *Album:* ${album || '-'}\n`;
      caption += `• *Genre:* ${genres || '-'}\n`;
      caption += `• *Rilis:* ${release_date || '-'}\n`;
      caption += `• *Durasi:* ${formattedDuration}\n`;
      caption += `• *Akurasi Match:* ${score}%\n`;

      if (external_metadata?.youtube?.vid) {
         caption += `• *YouTube:* https://youtu.be/${external_metadata.youtube.vid}\n`;
      }

      await client.sendMessage(m.chat, { text: caption }, { quoted: m });
   } catch (e) {
      console.error('[whatmusic error]', e);
      await m.reply('Terjadi kesalahan saat menghubungi API: ' + (e?.message || e));
   }
};

handler.help = ['whatmusic <reply/link>'];
handler.tags = ['tools'];
handler.command = ['whatmusic','whatsong']

export default handler;