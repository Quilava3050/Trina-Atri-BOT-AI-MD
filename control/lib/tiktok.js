import fetch from 'node-fetch';

export async function downloadTikTok(url, m, sock) {
  try {
    const encodedUrl = encodeURIComponent(url);
    let providerError = null;

    // 1. Cek API BOTCAHX (Slide TikTok)
    const btcApiUrl = `https://api.botcahx.eu.org/api/download/tiktokslide?apikey=${global.btc}&url=${encodedUrl}`;
    const btcRes = await fetch(btcApiUrl)
      .then(r => r.json())
      .catch(error => {
        providerError = error;
        return null;
      });

    // --- A. JIKA KONTEN BERUPA TIKTOK SLIDE ---
    if (btcRes && btcRes.status && btcRes.result && btcRes.result.images && btcRes.result.images.length > 0) {
      const { title, images, audio } = btcRes.result;
      const captionText = `◦ *Title* : ${title || '-'}\n◦ *Type* : Slide (${images.length} Gambar)`;

      if (images.length >= 2) {
        const album = images.map((imgUrl, i) => ({
          image: { url: imgUrl },
          caption: i === 0 ? captionText : undefined
        }));
        await sock.sendMessage(m.chat, { album }, { quoted: m });
      } else {
        await sock.sendMessage(m.chat, {
          image: { url: images[0] },
          caption: captionText
        }, { quoted: m });
      }

      if (audio && audio.length > 0 && audio[0]) {
        await sock.sendMessage(m.chat, {
          audio: { url: audio[0] },
          mimetype: 'audio/mpeg'
        }, { quoted: m });
      }

      return true;
    }

    // --- B. FALLBACK KE TIKWM (Video atau Slide Cadangan) ---
    const tikwmRes = await fetch(`https://tikwm.com/api/?url=${encodedUrl}`)
      .then(r => r.json())
      .catch(error => {
        providerError = error;
        return null;
      });

    if (!tikwmRes || !tikwmRes.data) {
      if (providerError) {
        throw new Error(`Layanan downloader TikTok gagal: ${providerError.message}`, { cause: providerError });
      }
      return false;
    }

    // Jika TikWM mendeteksi Slide Gambar
    if (tikwmRes.data.images && tikwmRes.data.images.length > 0) {
      const { title, images, music } = tikwmRes.data;
      const captionText = `◦ *Title* : ${title || '-'}\n◦ *Type* : Slide (${images.length} Gambar)`;

      if (images.length >= 2) {
        const album = images.map((imgUrl, i) => ({
          image: { url: imgUrl },
          caption: i === 0 ? captionText : undefined
        }));
        await sock.sendMessage(m.chat, { album }, { quoted: m });
      } else {
        await sock.sendMessage(m.chat, {
          image: { url: images[0] },
          caption: captionText
        }, { quoted: m });
      }

      if (music) {
        await sock.sendMessage(m.chat, {
          audio: { url: music },
          mimetype: 'audio/mpeg'
        }, { quoted: m });
      }

      return true;
    }

    // --- C. JIKA BERUPA VIDEO BIASA ---
    if (tikwmRes.data.play) {
      const videoUrl = tikwmRes.data.play;
      const title = tikwmRes.data.title || 'TikTok Downloader';

      // Cek ukuran file lewat HEAD request biar nggak over-capacity
      const headResponse = await fetch(videoUrl, { method: 'HEAD' }).catch(() => null);
      const contentLength = headResponse?.headers.get('content-length');
      const fileSize = contentLength ? parseInt(contentLength, 10) : 0;
      const limitSize = 20 * 1024 * 1024; // 20 MB

      if (fileSize > limitSize) {
        // Jika > 20MB: Kirim DOKUMEN saja (TANPA AUDIO)
        await sock.sendMessage(m.chat, {
          document: { url: videoUrl },
          mimetype: 'video/mp4',
          fileName: `${title.slice(0, 30)}.mp4`,
          caption: `◦ *Title* : ${title}\n◦ *Note* : Ukuran video > 20MB, dikirim sebagai dokumen.`
        }, { quoted: m });
      } else {
        // Jika <= 20MB: Kirim VIDEO + AUDIO
        await sock.sendMessage(m.chat, {
          video: { url: videoUrl },
          caption: `◦ *Title* : ${title}`
        }, { quoted: m });

        if (tikwmRes.data.music) {
          await sock.sendMessage(m.chat, {
            audio: { url: tikwmRes.data.music },
            mimetype: 'audio/mpeg'
          }, { quoted: m });
        }
      }

      return true;
    }

    return false;
  } catch (err) {
    console.error('Error TikTok AutoDL:', err);
    throw err;
  }
}