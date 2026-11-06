// plugins/grup/hidetag.js
const handler = async (m, { sock, reply, text, usedPrefix, example, command }) => {

  if (!text) return reply(example(`pesan`));

  try {
    const metadata = await sock.groupMetadata(m.chat);
    const members = metadata.participants.map(m => m.id);

    await sock.sendMessage(
      m.chat,
      {
        text: text,
        mentions: members
      },
      { quoted: m }
    );
  } catch (e) {
    console.error(e);
    reply("Gagal mengirim pesan hidetag.");
  }
};

handler.command = ["hidetag", "ht", "h"];
handler.admin = true
handler.group = true

export default handler;