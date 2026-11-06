const { prepareWAMessageMedia, generateWAMessageFromContent } = await import("@whiskeysockets/baileys");
const image = await prepareWAMessageMedia(
  { image: { url: "./media/Trina.jpeg" } },
  { upload: sock.waUploadToServer }
);
const message = generateWAMessageFromContent(
  m.chat,
  {
    ephemeralMessage: {
      message: {
        imageMessage: {
          ...image.imageMessage,
          caption: "👁️ Ephemeral"
        }
      }
    }
  },
  { userJid: sock.user.id, quoted: m }
);

await sock.relayMessage(m.chat, message.message, { messageId: message.key.id });

await reply("Gambar terkirim dengan wrapper ephemeralMessage. Periksa apakah pesan menghilang sesuai pengaturan chat.");
