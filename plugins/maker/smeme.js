import axios from "axios";
import { uploadImage } from "../../control/ugUploade.js";

const normalizeMemeText = text => String(text || "").toLocaleUpperCase();

const getMediaBuffer = async message => {
  if (typeof message.download !== "function") {
    throw new Error("Media tidak dapat diunduh.");
  }
  const buffer = await message.download();
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new Error("Gambar kosong atau gagal diunduh.");
  }
  return buffer;
};

const getUploadUrl = uploadResult => {
  if (typeof uploadResult === "string") return uploadResult;
  return uploadResult?.url || uploadResult?.link || uploadResult?.src || "";
};

const handler = async (m, { sock, args, example, reply }) => {
  try {
    const target = m.quoted || m;
    const mime = target.mimetype || target.msg?.mimetype || "";
    if (!mime.startsWith("image/")) {
      return reply(example("text atas|text bawah sambil kirim/reply foto"));
    }

    if (!args.length) {
      return reply(example("text atas|text bawah sambil kirim/reply foto"));
    }

    const inputText = args.join(" ");
    const separatorIndex = inputText.indexOf("|");
    const topText = normalizeMemeText(
      separatorIndex === -1 ? inputText : inputText.slice(0, separatorIndex)
    ).trim();
    const bottomText = normalizeMemeText(
      separatorIndex === -1 ? "" : inputText.slice(separatorIndex + 1)
    ).trim();

    if (!topText && !bottomText) {
      return reply("Masukkan minimal satu teks atas atau bawah.");
    }

    await sock.sendMessage(m.chat, {
      react: { text: "⏳", key: m.key }
    });

    const imageUrl = getUploadUrl(await uploadImage(await getMediaBuffer(target)));
    if (!imageUrl) throw new Error("Upload gambar tidak menghasilkan URL.");

    const memeTop = topText || "_";
    const memeBottom = bottomText || "_";
    const memeUrl =
      `https://api.memegen.link/images/custom/${encodeURIComponent(memeTop)}/` +
      `${encodeURIComponent(memeBottom)}.png?background=${encodeURIComponent(imageUrl)}`;
    const memeResponse = await axios.get(memeUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 10 * 1024 * 1024
    });
    const memeBuffer = Buffer.from(memeResponse.data);

    if (!memeBuffer.length) {
      throw new Error("API meme mengembalikan gambar kosong.");
    }

    if (typeof sock.sendImageAsSticker !== "function") {
      throw new Error("Helper sendImageAsSticker tidak tersedia.");
    }

    await sock.sendImageAsSticker(m.chat, memeBuffer, m, {
      packname: global.stickpack || "Trina",
      author: global.stickauth || "Trina"
    });
    await sock.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    });
  } catch (error) {
    console.error("[SMEME] Gagal membuat meme:", error?.stack || error);
    await sock.sendMessage(m.chat, {
      react: { text: "❌", key: m.key }
    });
    await reply(`Gagal membuat meme: ${error?.message || error}`);
  }
};

handler.help = ["smeme <teks atas>|<teks bawah>"];
handler.tags = ["maker"];
handler.command = ["meme", "smeme"];

export default handler;
