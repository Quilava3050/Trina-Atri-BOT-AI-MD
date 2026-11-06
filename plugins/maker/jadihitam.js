import uploadImage from '../../control/uploadTop4top.js';
import axios from 'axios';

const pollJobResult = async (type, jobId) => {
  const startedAt = Date.now();
  const timeoutMs = 240000;

  while (Date.now() - startedAt <= timeoutMs) {
    const response = await axios.get(
      'https://api.botcahx.eu.org/api/maker/status/editing-image',
      {
        params: { type, jobId },
        responseType: 'arraybuffer',
        validateStatus: () => true
      }
    );

    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return Buffer.from(response.data);
    }

    let data;
    try {
      data = JSON.parse(Buffer.from(response.data).toString('utf8'));
    } catch {
      throw new Error('Gagal membaca status proses jadihitam.');
    }

    if (data.status === false) {
      throw new Error(data.message || 'Proses jadihitam gagal.');
    }

    if (data.status !== 'pending') {
      const resultUrl = data.result || data.url || data.data?.result || data.data?.url;
      if (resultUrl) {
        const image = await axios.get(resultUrl, { responseType: 'arraybuffer' });
        return Buffer.from(image.data);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  throw new Error('Timeout menunggu hasil jadihitam.');
};

const handler = async (m, { sock, usedPrefix, command, reply }) => {
  try {
    const target = m.quoted || m;
    const mime = target.mimetype || target.msg?.mimetype || target.mediaType || '';

    if (!/^image\//i.test(mime) || /webp/i.test(mime)) {
      return reply(`Kirim atau reply foto dengan caption ${usedPrefix + command}.`);
    }

    await reply('🍟 Processing...');
    const image = await target.download();
    if (!Buffer.isBuffer(image) || image.length === 0) {
      throw new Error('Gambar gagal diunduh.');
    }

    const imageUrl = await uploadImage(image);
    if (!imageUrl) throw new Error('Gagal upload gambar untuk diproses.');

    const { data } = await axios.get(
      'https://api.botcahx.eu.org/api/maker/jadihitam',
      { params: { url: imageUrl, apikey: global.btc } }
    );

    if (!data?.status || !data.jobId) {
      throw new Error(data?.message || 'Gagal memulai proses jadihitam.');
    }

    const result = await pollJobResult(data.type || 'jadihitam', data.jobId);
    await sock.sendMessage(m.chat, {
      image: result,
      caption: '✅ Foto berhasil diubah menjadi hitam.'
    }, { quoted: m });
  } catch (error) {
    console.error('[JADIHITAM] Gagal memproses gambar:', error);
    await reply(`Gagal membuat jadihitam: ${error.message || error}`);
  }
};

handler.command = ['jadihitam','jadiireng','hitamkan','hytamkan','tohitam','toireng'];
handler.help = ['jadihitam'];
handler.tags = ['maker'];

export default handler;
