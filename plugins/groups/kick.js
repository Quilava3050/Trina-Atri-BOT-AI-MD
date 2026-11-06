// plugins/grup/kick.js
const handler = async (m, { sock, text, command, reply, usedPrefix }) => {

  let target;

  if (m.mentionedJid?.[0]) target = m.mentionedJid[0];
  else if (m.quoted?.sender) target = m.quoted.sender;
  else if (text) {
    let clean = text.replace(/[^0-9]/g, "");
    if (clean.length < 5) return reply("Nomor tidak valid!");
    target = clean + "@s.whatsapp.net";
  }

  if (!target) return reply(`Contoh: ${usedPrefix+command} tag/reply/nomor`);

  try {
    await sock.groupParticipantsUpdate(m.chat, [target], "remove");
  } catch (err) {
    console.error(err);
    reply("Gagal mengeluarkan anggota!");
  }
};

handler.command = ["kick", "kik", "k"];
handler.admin = true
handler.group = true
handler.botadmin = true

export default handler;