// plugins/grup/revoke.js
const handler = async (m, { sock, reply }) => {

  try {
    await sock.groupRevokeInvite(m.chat);
    const newLink = await sock.groupInviteCode(m.chat);
    const meta = await sock.groupMetadata(m.chat);

    reply(`*Tautan undangan berhasil direset*

- *Nama Grup:* ${meta.subject}
- *Link Baru:* https://chat.whatsapp.com/${newLink}`);
  } catch (e) {
    reply("Error saat reset link.");
  }
};

handler.command = ["revoke", "resetlinkgc", "rstgc"];
handler.owner = true
handler.admin = true
handler.group = true
handler.botadmin = true

export default handler;