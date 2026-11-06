import { sendPrivateImage, sendPrivateText } from "../../new-funtion/spr.js";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const getTarget = (m) => {
  if (!m.isGroup) {
    throw new Error("Perintah ini hanya bisa digunakan di grup.");
  }

  if (m.mentionedJid?.length > 1) {
    throw new Error("Pilih satu penerima saja dengan mention satu orang.");
  }

  const quoted = m.quoted;
  const target =
    m.mentionedJid?.[0] ||
    quoted?.key?.participantAlt ||
    quoted?.key?.participant ||
    quoted?.sender ||
    quoted?.participant;

  if (!target) {
    throw new Error("Mention satu orang atau reply pesannya untuk memilih penerima.");
  }

  return target;
};

const getMessageText = (text, hasMention) =>
  (hasMention ? text.replace(/@\d+/g, "") : text).trim();

const send = async (m, { sock, text, reply }, type) => {
  try {
    const target = getTarget(m);
    const messageText = getMessageText(text || "", m.mentionedJid?.length === 1);
    const sendOptions = {
      mode: "only",
      only: [target],
      maxRetries: 0,
      concurrency: 1,
      throwOnFail: true,
    };

    if (type === "text") {
      if (!messageText) {
        return reply("Tulis pesan yang ingin dikirim setelah mention atau perintah.");
      }

      await sendPrivateText(sock, target, messageText, sendOptions);
    } else {
      if (m.quoted?.mtype !== "imageMessage") {
        return reply("Reply sebuah gambar, lalu mention satu penerima dan tambahkan caption jika perlu.");
      }

      const image = await m.quoted.download();
      if (!Buffer.isBuffer(image) || image.length === 0) {
        throw new Error("Gambar gagal diunduh atau kosong.");
      }
      if (image.length > MAX_IMAGE_BYTES) {
        return reply("Ukuran gambar terlalu besar (maksimal 10 MB).");
      }

      await sendPrivateImage(sock, target, image, {
        ...sendOptions,
        caption: messageText,
      });
    }

    await reply(`Pesan pribadi berhasil dikirim ke ${target.split("@")[0]}.`);
  } catch (error) {
    console.error("[SPR] Gagal mengirim pesan pribadi:", error);
    await reply(`Gagal mengirim pesan pribadi: ${error?.message || error}`);
  }
};

const handler = async (m, context) => {
  const command = context.command?.toLowerCase();
  await send(m, context, command === "sprimg" ? "image" : "text");
};

handler.help = [
  "sprtext @tag teks (atau reply pesan orang)",
  "sprimg @tag caption (reply gambar)",
];
handler.tags = ["owner"];
handler.command = ["sprtext", "sprimg"];
handler.owner = true;

export default handler;
