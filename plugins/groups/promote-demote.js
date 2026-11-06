// plugins/grup/promote-demote.js
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

  const action = command === "promote" ? "promote" : "demote";

  try {
    await sock.groupParticipantsUpdate(m.chat, [target], action);

    const msg = action === "promote"
      ? `@${target.split("@")[0]} sekarang jadi admin`
      : `@${target.split("@")[0]} sudah bukan admin lagi`;

    await sock.sendMessage(m.chat, { text: msg, mentions: [target] }, { quoted: m });

  } catch (err) {
    console.error(err);
    reply("Gagal promote/demote!");
  }
};

handler.command = ["promote", "demote"];
handler.owner = true
handler.admin = true
handler.group = true
handler.botadmin = true

export default handler;