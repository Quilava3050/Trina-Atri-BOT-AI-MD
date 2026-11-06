const { prepareWAMessageMedia, generateWAMessageFromContent } = await import("@whiskeysockets/baileys");
const image = await prepareWAMessageMedia(
  { image: { url: "./media/Trina.jpeg" } },
  { upload: sock.waUploadToServer }
);
const message = generateWAMessageFromContent(
  m.chat,
  {
    spoilerMessage: {
      message: {
        imageMessage: {
          ...image.imageMessage,
          caption: "❔ Spoiler"
        }
      }
    }
  },
  { userJid: sock.user.id, quoted: m }
);

await sock.relayMessage(m.chat, message.message, { messageId: message.key.id });

