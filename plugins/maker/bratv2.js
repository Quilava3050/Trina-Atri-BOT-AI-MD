import axios from "axios";
import { videoToWebp } from "../../control/webp.js";

const handler = async (m, { sock, text, reply, usedPrefix, command }) => {
  const messageText = text?.trim() || m.quoted?.text?.trim();

  if (!messageText) {
    return reply(`Contoh: ${usedPrefix + command} trina suka kmu..`);
  }

  try {
    await reply("⏳ Membuat sticker BratV2...");

    const url = `https://lipcy.vercel.app/sticker/bratv2?text=${encodeURIComponent(messageText)}`;
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 60000,
      validateStatus: status => status >= 200 && status < 300
    });

    const contentType = response.headers["content-type"] || "";
    if (!contentType.startsWith("video/")) {
      throw new Error(`API mengembalikan content-type ${contentType || "tidak diketahui"}`);
    }

    const sticker = await videoToWebp(Buffer.from(response.data));
    const stickerWithWm = await (async () => {
      const { addExif } = await import("../../control/webp.js");
      return addExif(
        sticker,
        global.stickpack || "Trina",
        global.stickauth || "Trina Bot"
      );
    })();

    await sock.sendMessage(m.chat, { sticker: stickerWithWm }, { quoted: m });
  } catch (error) {
    console.error("[BRATV2]", error.response?.data || error.message);
    return reply("❌ Gagal membuat sticker BratV2. API mungkin sedang bermasalah.");
  }
};

handler.help = ["bratv2 <teks>"];
handler.tags = ["sticker"];
handler.command = ["bratv2", "brat2"];

export default handler;
