import axios from 'axios';

const API_URL = 'https://api.zansxart.me/api/download/instagram';
const MAX_MEDIA = 5;
const MAX_MEDIA_SIZE = 100 * 1024 * 1024;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getErrorMessage = error => {
  const responseData = error.response?.data;
  if (responseData && typeof responseData === 'object' && !Buffer.isBuffer(responseData)) {
    return responseData.message || responseData.error || responseData._hint || error.message;
  }

  if (Buffer.isBuffer(responseData)) {
    try {
      const parsed = JSON.parse(responseData.toString('utf8'));
      return parsed.message || parsed.error || parsed._hint || error.message;
    } catch {}
  }

  return error.message || 'Permintaan ke layanan Instagram gagal.';
};

export async function downloadInstagram(url, m, sock) {
  const apiKey = String(global.zansxart || '').trim();
  if (!apiKey) throw new Error('API key Zansxart belum dikonfigurasi.');

  try {
    const { data } = await axios.get(API_URL, {
      params: { url },
      headers: { 'X-API-Key': apiKey },
      timeout: 60000
    });

    if (!data?.status) {
      throw new Error(data?.message || data?.error || 'API tidak menemukan media Instagram pada tautan tersebut.');
    }

    const mediaUrls = [...new Set([
      ...(Array.isArray(data.result) ? data.result : []),
      ...(Array.isArray(data.data) ? data.data : [])
    ])].filter(item => typeof item === 'string' && /^https?:\/\//i.test(item));

    if (!mediaUrls.length) {
      throw new Error('API tidak mengembalikan URL media Instagram yang valid.');
    }

    let sentCount = 0;
    for (const mediaUrl of mediaUrls.slice(0, MAX_MEDIA)) {
      const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: MAX_MEDIA_SIZE,
        maxBodyLength: MAX_MEDIA_SIZE,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const buffer = Buffer.from(response.data);
      if (!buffer.length) throw new Error('CDN Instagram mengembalikan media kosong.');

      const contentType = String(response.headers['content-type'] || '').toLowerCase();
      const pathname = new URL(mediaUrl).pathname.toLowerCase();
      const isVideo = contentType.startsWith('video/') || /\.(mp4|mov|m4v)$/.test(pathname);

      await sock.sendMessage(m.chat, isVideo
        ? { video: buffer, mimetype: contentType || 'video/mp4', caption: '◦ *Instagram Downloader*' }
        : { image: buffer, caption: '◦ *Instagram Downloader*' },
      { quoted: m });

      sentCount++;
      if (sentCount < Math.min(mediaUrls.length, MAX_MEDIA)) await delay(2000);
    }

    return sentCount > 0;
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('[AUTO DOWNLOAD INSTAGRAM]', message);
    const wrappedError = new Error(message, { cause: error });
    if (error.response?.status) wrappedError.status = error.response.status;
    if (error.code) wrappedError.code = error.code;
    throw wrappedError;
  }
}
