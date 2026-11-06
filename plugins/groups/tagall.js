// plugins/grup/tagall.js
const handler = async (m, { sock, reply, args, usedPrefix }) => {

  const message = args.join(" ") || "nothing";

  let teks = `*Tagall Message:*\n> ${message}\n\n`;

  const metadata = await sock.groupMetadata(m.chat);
  const members = metadata.participants;

  for (let mem of members) {
    teks += `@${mem.id.split("@")[0]}\n`;
  }

  await sock.sendMessage(
    m.chat,
    {
      text: teks,
      mentions: members.map(m => m.id)
    },
    { quoted: m }
  );
};

handler.command = ["tagall"];
handler.owner = true
handler.admin = true
handler.group = true

export default handler;