import fs from "fs";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { Sticker, StickerTypes } from "wa-sticker-formatter";

const unwrapMessage = (message) => {
  let content = message;
  while (
    content?.ephemeralMessage?.message ||
    content?.viewOnceMessage?.message ||
    content?.viewOnceMessageV2?.message ||
    content?.viewOnceMessageV2Extension?.message
  ) {
    content =
      content.ephemeralMessage?.message ||
      content.viewOnceMessage?.message ||
      content.viewOnceMessageV2?.message ||
      content.viewOnceMessageV2Extension?.message;
  }
  return content;
};

const getMessageContent = (webMessage) => {
  const message = unwrapMessage(webMessage?.message);
  if (!message) return {};
  const type = Object.keys(message).find(
    (key) => key.endsWith("Message") && key !== "messageContextInfo"
  );
  return { message, type, content: type ? message[type] : null };
};

const getAlbumAssociation = (webMessage) => {
  const { message, content } = getMessageContent(webMessage);
  return message?.messageContextInfo?.messageAssociation ||
    content?.contextInfo?.messageAssociation;
};

const downloadImage = async (webMessage) => {
  const { content } = getMessageContent(webMessage);
  if (!content?.url && !content?.directPath) {
    throw new Error(`Album item ${webMessage.key?.id || "(tanpa ID)"} bukan foto yang dapat diunduh.`);
  }

  const stream = await downloadContentFromMessage(content, "image");
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  if (!buffer.length) throw new Error("Foto album yang diunduh kosong.");
  return buffer;
};

const sendStickerPackFromAlbum = async (m, sock, quotedMessage, reply) => {
  const { type: quotedType, content: quotedContent } = getMessageContent(quotedMessage);
  const association = getAlbumAssociation(quotedMessage);
  const isAlbumMessage = quotedType === "albumMessage";
  const albumKey = isAlbumMessage
    ? quotedMessage.key
    : Number(association?.associationType) === 1
      ? association.parentMessageKey
      : null;

  if (!albumKey?.id) {
    await reply("Pesan yang dibalas bukan album atau foto dari album. Balas pesan album Pinterest dengan *.spack*.");
    return true;
  }

  const chatIds = [...new Set([
    albumKey.remoteJid,
    quotedMessage.key?.remoteJid,
    m.chat
  ].filter(Boolean))];
  let albumMessages = chatIds.flatMap((chatId) =>
    sock.store?.messages?.[chatId]?.array || []
  );
  if (!albumMessages.some((webMessage) =>
    getAlbumAssociation(webMessage)?.parentMessageKey?.id === albumKey.id
  )) {
    albumMessages = Object.values(sock.store?.messages || {}).flatMap((list) => list.array || []);
  }
  const messages = [
    ...new Map(albumMessages.map((webMessage) => [webMessage.key?.id, webMessage])).values()
  ];
  const albumImages = messages
    .filter((webMessage) => {
      const itemAssociation = getAlbumAssociation(webMessage);
      const { type } = getMessageContent(webMessage);
      return Number(itemAssociation?.associationType) === 1 &&
        itemAssociation?.parentMessageKey?.id === albumKey.id &&
        type === "imageMessage";
    })
    .sort((a, b) => {
      const aIndex = Number(getAlbumAssociation(a)?.messageIndex ?? 0);
      const bIndex = Number(getAlbumAssociation(b)?.messageIndex ?? 0);
      return aIndex - bIndex;
    });

  if (
    quotedType === "imageMessage" &&
    !albumImages.some((webMessage) => webMessage.key?.id === quotedMessage.key?.id)
  ) {
    albumImages.push(quotedMessage);
  }

  const uniqueImages = [
    ...new Map(albumImages.map((webMessage) => [webMessage.key?.id, webMessage])).values()
  ];
  let albumMessage;
  for (const chatId of chatIds) {
    albumMessage = await sock.store?.loadMessage(chatId, albumKey.id);
    if (albumMessage) break;
  }
  const expectedImages = Number(
    (isAlbumMessage ? quotedContent : getMessageContent(albumMessage).content)
      ?.expectedImageCount || 0
  );

  if (uniqueImages.length < 2) {
    await reply("Belum berhasil menemukan foto lain dari album tersebut di penyimpanan pesan bot.");
    return true;
  }

  if (expectedImages > uniqueImages.length) {
    await reply(`Baru ${uniqueImages.length} dari ${expectedImages} foto album yang ditemukan. Coba lagi setelah seluruh album diterima bot.`);
    return true;
  }

  const stickers = await Promise.all(uniqueImages.map(async (webMessage) => {
    const imageBuffer = await downloadImage(webMessage);
    const sticker = new Sticker(imageBuffer, {
      pack: "Album Trina",
      author: "by Trina.",
      type: StickerTypes.FULL,
      quality: 70
    });
    return { data: await sticker.toBuffer() };
  }));

  await sock.sendMessage(m.chat, {
    cover: stickers[0].data,
    stickers,
    name: "📦 Album Stickers",
    publisher: "by Trina.",
    description: `Sticker pack dari album (${stickers.length} stiker)`
  }, { quoted: m });
  return true;
};

const handler = async (m, { sock, command, reply }) => {
  const isStickerPack = command === "spack";
  const qmsg = m.quoted ? m.quoted : m;
  const mime = qmsg.mimetype || qmsg.msg?.mimetype || "";

  if (isStickerPack && !m.quoted) {
    return reply("Balas pesan album Pinterest dengan *.spack* untuk membuat sticker pack.");
  }

  if (isStickerPack) {
    try {
      return await sendStickerPackFromAlbum(m, sock, qmsg.fakeObj || qmsg, reply);
    } catch (err) {
      console.error("[SPACK] Gagal membuat sticker pack dari album:", err);
      return reply(`❌ Gagal membuat sticker pack: ${err.message || err}`);
    }
  }

  if (!/image|video/.test(mime)) {
    return reply(`Kirim atau reply foto/video dengan caption *.${command}*`);
  }

  if (/video/.test(mime) && (qmsg.seconds || 0) > 15) {
    return reply("Durasi video maksimal 15 detik!");
  }

  let mediaPath;
  try {
    mediaPath = await sock.downloadAndSaveMediaMessage(qmsg);
    await sock.sendImageAsSticker(
      m.chat,
      mediaPath,
      m,
      { author: "by Trina." }
    );
  } catch (err) {
    console.error("[STICKER] Gagal membuat stiker:", err);
    return reply("❌ Gagal membuat sticker!");
  } finally {
    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
  }
};

handler.command = ["sticker", "stiker", "sgif", "s", "spack"];
export default handler;
