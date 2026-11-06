import fetch from 'node-fetch';

export async function downloadScribd(url, m, sock) {
  try {
    // Pakai apikey anabot (default: 'global.anabot' atau sesuaikan dari variabel global)
    const apikey = global.anabot || 'global.anabot';
    const apiUrl = `https://anabot.my.id/api/download/scribd?url=${encodeURIComponent(url)}&apikey=${apikey}`;

    const api = await fetch(apiUrl, {
      headers: { 'accept': 'application/json' }
    });
    const res = await api.json();

    // Cek struktur respons dari AnaBot
    if (!res || !res.success || !res.data?.result?.downloadUrl) {
      console.error('Scribd AnaBot API returned invalid result:', res);
      return false;
    }

    const { title, pageCount, language, downloadUrl } = res.data.result;

    // Fetch file PDF sebagai Buffer
    const mediaResponse = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!mediaResponse.ok) {
      const error = new Error(`Gagal mengambil dokumen Scribd (HTTP ${mediaResponse.status}).`);
      error.status = mediaResponse.status;
      throw error;
    }

    const buffer = await mediaResponse.buffer();
    const safeTitle = (title || 'Scribd_Document').replace(/[^a-zA-Z0-9_\-\s.]/g, '');

    const caption = `◦ *Title* : ${title || '-'}\n◦ *Pages* : ${pageCount || '-'}\n◦ *Language* : ${language || '-'}`;

    await sock.sendMessage(m.chat, {
      document: buffer,
      mimetype: 'application/pdf',
      fileName: safeTitle.endsWith('.pdf') ? safeTitle : `${safeTitle}.pdf`,
      caption: caption
    }, { quoted: m });

    return true;
  } catch (err) {
    console.error('Error Scribd AutoDL:', err);
    throw err;
  }
}