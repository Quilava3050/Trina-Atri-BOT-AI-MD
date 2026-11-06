import fetch from 'node-fetch';

export async function downloadThreads(url, m, sock) {
  try {
    const apikey = global.neoxr || 'ItsMeMatt_';
    const response = await fetch(`https://api.neoxr.eu/api/threads?apikey=${encodeURIComponent(apikey)}&url=${encodeURIComponent(url)}`);
    const res = await response.json();

    if (!res || !res.status) return false;

    if (Array.isArray(res.data)) {
      for (const item of res.data) {
        const mediaUrl = item.url || item;
        if (item.type === 'video' || String(mediaUrl).includes('.mp4')) {
          await sock.sendMessage(m.chat, { video: { url: mediaUrl } }, { quoted: m });
        } else {
          await sock.sendMessage(m.chat, { image: { url: mediaUrl } }, { quoted: m });
        }
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error Threads AutoDL:', err);
    throw err;
  }
}