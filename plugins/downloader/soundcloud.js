import axios from "axios";

const API_URL = "https://api.botcahx.eu.org/api/download/soundcloud";
const MAX_AUDIO_SIZE = 100 * 1024 * 1024;

const isSoundCloudUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "soundcloud.com" ||
        url.hostname === "www.soundcloud.com" ||
        url.hostname === "m.soundcloud.com" ||
        url.hostname === "on.soundcloud.com");
  } catch {
    return false;
  }
};

const sanitizeFilename = (value = "soundcloud-audio") =>
  value.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 100) || "soundcloud-audio";

const handler = async (m, { sock, text, usedPrefix, command }) => {
  const apiKey = global.btc;
  if (!apiKey) {
    return sock.sendMessage(m.chat, {
      text: "⚠️ `global.btc` belum diatur di konfigurasi."
    }, { quoted: m });
  }

  const soundCloudUrl = text?.trim();
  if (!soundCloudUrl || !isSoundCloudUrl(soundCloudUrl)) {
    return sock.sendMessage(m.chat, {
      text: `🎵 *SoundCloud Downloader*\n\nGunakan:\n${usedPrefix + command} <link SoundCloud>\n\nContoh:\n${usedPrefix + command} https://soundcloud.com/artist/track`
    }, { quoted: m });
  }

  await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

  try {
    const { data } = await axios.get(API_URL, {
      params: { apikey: apiKey, url: soundCloudUrl },
      timeout: 30000
    });

    const result = data?.result;
    if (!data?.status || !result?.url) {
      throw new Error(data?.message || "API tidak mengembalikan link audio.");
    }

    const audioResponse = await axios.get(result.url, {
      responseType: "arraybuffer",
      timeout: 120000,
      maxContentLength: MAX_AUDIO_SIZE,
      maxBodyLength: MAX_AUDIO_SIZE,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const audio = Buffer.from(audioResponse.data);
    if (!audio.length) throw new Error("File audio yang diunduh kosong.");
    if (audio.length > MAX_AUDIO_SIZE) throw new Error("Ukuran audio melebihi batas 100 MB.");

    const title = sanitizeFilename(result.title);
    const artist = result.artist?.trim();
    const caption = [result.title, artist].filter(Boolean).join(" — ");

    await sock.sendMessage(m.chat, {
      audio,
      mimetype: "audio/mpeg",
      fileName: `${title}.mp3`,
      ptt: false,
      ...(caption ? { caption } : {})
    }, { quoted: m });

    await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
  } catch (error) {
    console.error("[SoundCloud Downloader]", error.response?.data || error.message);
    await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    await sock.sendMessage(m.chat, {
      text: `❌ Gagal mengunduh audio SoundCloud: ${error.response?.data?.message || error.message}`
    }, { quoted: m });
  }
};

handler.help = ["soundcloud <url>"];
handler.tags = ["downloader"];
handler.command = ["soundcloud", "scdl",];

export default handler;
