import fetch from 'node-fetch';

export async function downloadVidey(url, m, sock) {
  try {
    const apikey = global.btc || 'umaasa';
    const api = await fetch(`https://api.botcahx.eu.org/api/dowloader/videy?url=${encodeURIComponent(url)}&apikey=${apikey}`);
    const res = await api.json();

    if (!res || !res.status || !res.result) return false;

    const videoUrl = res.result;

    // Fetch video sebagai Buffer
    const mediaResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!mediaResponse.ok) {
      const error = new Error(`Gagal mengambil video Videy (HTTP ${mediaResponse.status}).`);
      error.status = mediaResponse.status;
      throw error;
    }

    const buffer = await mediaResponse.buffer();

    await sock.sendMessage(m.chat, {
      video: buffer,
      caption: '◦ *Videy Downloader*'
    }, { quoted: m });

    return true;
  } catch (err) {
    console.error('Error Videy AutoDL:', err);
    throw err;
  }
}