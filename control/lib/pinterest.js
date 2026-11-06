import fetch from 'node-fetch';

export async function downloadPinterest(url, m, sock) {
  try {
    const apikey = global.btc || 'umaasa';
    const api = await fetch(`https://api.botcahx.eu.org/api/download/pinterest?url=${encodeURIComponent(url)}&apikey=${apikey}`);
    const res = await api.json();

    const data = res?.result?.data;
    if (!data) return false;

    const { media_type, image, title, video } = data;
    const capt = `◦ *Title* : ${title || 'Pinterest Downloader'}\n◦ *Type* : ${media_type || '-'}`;

    if (media_type === 'video/mp4' && video) {
      // Ambil Buffer Video
      const mediaResponse = await fetch(video);
      if (!mediaResponse.ok) {
        const error = new Error(`Gagal mengambil video Pinterest (HTTP ${mediaResponse.status}).`);
        error.status = mediaResponse.status;
        throw error;
      }
      const buffer = await mediaResponse.buffer();
      await sock.sendMessage(m.chat, { video: buffer, caption: capt }, { quoted: m });
    } else if (image) {
      // Ambil Buffer Gambar
      const mediaResponse = await fetch(image);
      if (!mediaResponse.ok) {
        const error = new Error(`Gagal mengambil gambar Pinterest (HTTP ${mediaResponse.status}).`);
        error.status = mediaResponse.status;
        throw error;
      }
      const buffer = await mediaResponse.buffer();
      await sock.sendMessage(m.chat, { image: buffer, caption: capt }, { quoted: m });
    } else {
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error Pinterest AutoDL:', err);
    throw err;
  }
}