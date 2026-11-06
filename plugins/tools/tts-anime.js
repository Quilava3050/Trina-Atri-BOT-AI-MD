import axios from "axios";

const handler = async (m, { sock, text, reply, usedPrefix, command }) => {
  if (!text) {
    return reply(`Contoh penggunaan:\n${usedPrefix + command} 1 halo kakak\n${usedPrefix + command} halo kakak\n${usedPrefix + command} --list`);
  }

  const apiBase = global.APIs?.zansxart || "https://api.zansxart.me";
  const apiKey = global.zansxart;
  if (!apiKey) return reply("❌ API key Zansxart belum diatur di settings.js.");

  try {
    if (text.trim() === "--list") {
      const { data } = await axios.get(`${apiBase}/api/anime/tts`, {
        params: { apikey: apiKey, list: "true" },
        timeout: 30000
      });

      const voices = data?.result?.umaVoices || [];
      if (!voices.length) return reply(data?.message || "Gagal mengambil daftar suara dari API.");

      const voiceList = voices.map(voice => `${voice.index}. ${voice.name}`).join("\n");
      return reply(`*Daftar Voice TTS Anime:*\n\n${voiceList}`);
    }

    let voice = "1";
    let messageText = text;
    const voiceMatch = text.match(/^(?:<(\d+)>|(\d+))\s*/);
    if (voiceMatch) {
      voice = voiceMatch[1] || voiceMatch[2];
      messageText = text.slice(voiceMatch[0].length).trim();
    }

    if (!messageText) return reply(`Teksnya mana?\nContoh: ${usedPrefix + command} 1 halo kakak`);

    await reply(`⏳ Mengubah teks ke suara anime...\nVoice: ${voice}`);
    const { data } = await axios.get(`${apiBase}/api/anime/tts`, {
      params: {
        apikey: apiKey,
        text: messageText,
        voice,
        translate: "true"
      },
      timeout: 60000
    });

    const audioUrl = data?.result?.audioUrl;
    if (!data?.status || !audioUrl) return reply(data?.message || "Gagal menghasilkan suara dari API.");

    await sock.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      fileName: "tts-anime.mp3",
      ptt: false
    }, { quoted: m });
  } catch (error) {
    console.error("[TTS-ANIME]", error.response?.data || error.message);
    return reply("❌ Gagal menghubungi API TTS Anime.");
  }
};

handler.help = ["ttsjapan index teks", "ttsjapan --list"];
handler.tags = ["tools", "ai"];
handler.command = ["ttsjapan", "ttsjapang", "ttsanime"];

export default handler;