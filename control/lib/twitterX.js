import fetch from 'node-fetch';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function downloadTwitter(url, m, sock) {
  try {
    const apikey = global.btc || 'umaasa';
    const api = await fetch(`https://api.botcahx.eu.org/api/download/twitter2?url=${encodeURIComponent(url)}&apikey=${apikey}`);
    const res = await api.json();

    if (!res || !res.status || !res.result) return false;

    const mediaURLs = res.result.mediaURLs;
    if (!mediaURLs || !mediaURLs.length) return false;

    const capt = `◦ *User* : ${res.result.user_name || ''} (@${res.result.user_screen_name || ''})\n◦ *Title* : ${res.result.text || '-'}`;
    let sentCount = 0;

    for (const mediaUrl of mediaURLs) {
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        const error = new Error(`Gagal mengambil media Twitter/X (HTTP ${response.status}).`);
        error.status = response.status;
        throw error;
      }

      const buffer = await response.buffer();
      const contentType = response.headers.get('content-type') || '';

      // Cek tipe file (Video / Gambar)
      if (contentType.includes('video') || mediaUrl.includes('.mp4')) {
        await sock.sendMessage(m.chat, { video: buffer, caption: capt }, { quoted: m });
      } else {
        await sock.sendMessage(m.chat, { image: buffer, caption: capt }, { quoted: m });
      }

      sentCount++;
      await delay(2000);
    }

    return sentCount > 0;
  } catch (err) {
    console.error('Error Twitter AutoDL:', err);
    throw err;
  }
}