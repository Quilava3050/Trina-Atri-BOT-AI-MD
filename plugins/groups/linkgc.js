// plugins/grup/linkgc.js
const handler = async (m, { sock, reply }) => {

  const code = await sock.groupInviteCode(m.chat);
  const meta = await sock.groupMetadata(m.chat);

  await sock.sendMessage(m.chat, {
    text: `- 🍀 Name : *${meta.subject}*
- 🌳 Url Link : https://chat.whatsapp.com/${code}`,
    detectLink: true
  });
};

handler.command = ["linkgc", "linkgroup", "linkgrup"];
handler.group = true
handler.botadmin = true

export default handler;