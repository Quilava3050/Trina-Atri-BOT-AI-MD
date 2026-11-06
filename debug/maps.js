const { generateWAMessageFromContent } = await import("@whiskeysockets/baileys");
const { readFile } = await import("node:fs/promises");
const thumbnail = await readFile("./media/Trina.jpeg");
const message = generateWAMessageFromContent(
  m.chat,
  {
    locationMessage: {
      degreesLatitude: 24.121231,
      degreesLongitude: 55.1121221,
      name: "👋🏻 I am here",
      jpegThumbnail: thumbnail
    }
  },
  { userJid: sock.user.id, quoted: m }
);

await sock.relayMessage(m.chat, message.message, { messageId: message.key.id });
