// plugins/grup/setdesk.js
const handler = async (m, { sock, reply, text, usedPrefix, example }) => {

  if (!text) return reply(example(`his description`));

  try {
    await sock.groupUpdateDescription(m.chat, text);
    reply("Deskripsi grup berhasil diubah.");
  } catch (err) {
    reply("Gagal mengubah deskripsi.");
  }
};

handler.command = ["setdesk"];
handler.owner = true
handler.admin = true
handler.group = true
handler.botadmin = true

export default handler;