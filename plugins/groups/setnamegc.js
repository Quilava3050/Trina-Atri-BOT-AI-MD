// plugins/grup/setnamagc.js
const handler = async (m, { sock, reply, text, usedPrefix }) => {

  if (!text) return reply(`Contoh: ${usedPrefix+command} Nama baru grup`);

  try {
    await sock.groupUpdateSubject(m.chat, text);
    reply(`Succes!`);
  } catch (e) {
    reply("Gagal mengganti nama grup.");
  }
};

handler.command = ["setnamagc", "gantinamgc"];
handler.owner = true
handler.admin = true
handler.group = true
handler.botadmin = true

export default handler;