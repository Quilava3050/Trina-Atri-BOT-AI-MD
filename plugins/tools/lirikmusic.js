import fetch from 'node-fetch';

// Penyimpanan sementara hasil pencarian per pengguna
global.lyricSessions = global.lyricSessions || new Map();

let handler = async (m, { sock, conn, text, usedPrefix, command }) => {
   const client = sock || conn;
   const apiKey = global.zansxart;

   if (!apiKey) {
      return m.reply('API Key belum dikonfigurasi di global.zansxart.');
   }

   // 1. Jika user mengetik angka untuk memilih dari daftar hasil sebelumnya
   if (/^\d+$/.test(text?.trim())) {
      const session = global.lyricSessions.get(m.sender);
      if (!session) {
         return m.reply(`Sesi pencarian nggak ditemukan atau udah expired. Silakan cari ulang pake *${usedPrefix + command} <judul lagu>*`);
      }

      const index = parseInt(text.trim(), 10) - 1;
      if (index < 0 || index >= session.length) {
         return m.reply(`Pilihan salah. Pilih angka dari 1 sampai ${session.length}.`);
      }

      const song = session[index];
      const { trackName, artistName, albumName, duration, plainLyrics, syncedLyrics } = song;

      const minutes = Math.floor((duration || 0) / 60);
      const seconds = (duration || 0) % 60;
      const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      // Utamakan plainLyrics, kalau kosong pakai syncedLyrics
      const lyricsContent = plainLyrics || syncedLyrics || 'Lirik tidak tersedia untuk lagu ini.';

      let caption = `🎵 *${trackName || 'Detail Lagu'}* 🎵\n\n`;
      caption += `• *Artis:* ${artistName || '-'}\n`;
      caption += `• *Album:* ${albumName || '-'}\n`;
      caption += `• *Durasi:* ${formattedDuration}\n`;
      caption += `─────────────────────────\n\n`;
      caption += lyricsContent;

      return client.sendMessage(m.chat, { text: caption }, { quoted: m });
   }

   // 2. Jika user memasukkan kata kunci pencarian lagu baru
   if (!text) {
      return m.reply(`Masukkan judul lagu yang mau dicari!\n\nContoh:\n• *${usedPrefix + command} snap rosa*`);
   }

   await m.reply('Lagi nyari lirik lagu...');

   try {
      const endpoint = `https://api.zansxart.me/api/search/lyrics?q=${encodeURIComponent(text)}`;
      const res = await fetch(endpoint, {
         method: 'GET',
         headers: {
            'X-API-Key': apiKey,
         },
      });

      const json = await res.json();

      if (!json.status || !json.result || json.result.length === 0) {
         return m.reply('Lirik lagu nggak ditemukan.');
      }

      // Ambil maksimal 10 hasil teratas
      const results = json.result.slice(0, 10);
      global.lyricSessions.set(m.sender, results);

      let listText = `🔍 *HASIL PENCARIAN LIRIK* (${results.length} ditemukan)\n\n`;
      results.forEach((item, i) => {
         const durMin = Math.floor((item.duration || 0) / 60);
         const durSec = (item.duration || 0) % 60;
         const durFormatted = `${durMin}:${durSec < 10 ? '0' : ''}${durSec}`;
         listText += `*${i + 1}.* ${item.trackName}\n`;
         listText += `   👥 Artis: ${item.artistName}\n`;
         listText += `   💿 Album: ${item.albumName || '-'}\n`;
         listText += `   ⏱️ Durasi: ${durFormatted}\n\n`;
      });

      listText += `Ketik angka pilihanmu (contoh: *1*) atau ketik *${usedPrefix + command} 1* buat langsung ngambil lirik full-nya!`;

      await client.sendMessage(m.chat, { text: listText }, { quoted: m });
   } catch (e) {
      console.error('[carilirik error]', e);
      await m.reply('Gagal mengambil data dari API: ' + (e?.message || e));
   }
};

handler.help = ['lirikmusic <judul lagu>'];
handler.tags = ['tools', 'internet'];
handler.command = ['lirikmusic','lirik']

export default handler;