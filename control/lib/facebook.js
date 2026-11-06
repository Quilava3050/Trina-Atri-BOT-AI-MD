import axios from 'axios';

export async function downloadFacebook(url, m, sock) {
  const apiKey = global.zansxart;
  if (!apiKey) throw new Error('API key Zansxart belum dikonfigurasi.');

  try {
    const { data } = await axios.get('https://api.zansxart.me/api/download/facebook', {
      params: { url },
      headers: { 'X-API-Key': apiKey },
      timeout: 30000
    });

    if (!data?.status || !data.data) {
      throw new Error(data?.message || data?.error || 'API tidak menemukan video Facebook pada tautan tersebut.');
    }

    const videoUrls = [...new Set([data.data.hd, data.data.sd].filter(Boolean))];
    if (!videoUrls.length) {
      throw new Error('API tidak menyediakan URL video HD atau SD.');
    }

    const caption = `◦ *Title* : ${data.data.title || 'Facebook Video'}`;
    let lastError;
    for (const videoUrl of videoUrls) {
      try {
        await sock.sendMessage(m.chat, {
          video: { url: videoUrl },
          mimetype: 'video/mp4',
          caption
        }, { quoted: m });
        return true;
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(`Gagal mengirim video Facebook dari CDN: ${lastError?.message || 'pengiriman media gagal.'}`, {
      cause: lastError
    });
  } catch (error) {
    const responseData = error.response?.data;
    if (responseData) {
      const body = Buffer.isBuffer(responseData)
        ? responseData.toString('utf8')
        : typeof responseData === 'string'
          ? responseData
          : null;
      if (body) {
        try {
          const parsed = JSON.parse(body);
          error.message = parsed.message || parsed.error || parsed._hint || error.message;
        } catch {}
      } else if (responseData.message || responseData.error || responseData._hint) {
        error.message = responseData.message || responseData.error || responseData._hint;
      }
    }
    console.error('Error Facebook AutoDL:', error);
    throw error;
  }
}
