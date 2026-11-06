const handler = async (m, { sock, text }) => {

  const command = m.command?.toLowerCase()

  const num = await sock.groupRequestParticipantsList(m.chat)
  if (!num || num.length < 1) return m.reply("Tidak ada list request join!");

  let action = command === "reject" ? "reject" : "approve";
  let target = num.map(e => e.jid);
  if (text && text !== "all") target = [num[0].jid]; // kalau text bukan "all", ambil 1 saja

  await sock.groupRequestParticipantsUpdate(m.chat, target, action);
  return sock.sendMessage(
    m.chat,
    {
      text: `Sukses *${action}* @${target.map(e => e.split("@")[0]).join(" @")}`,
      mentions: target
    },
    { quoted: m }
  );
};

handler.command = ["acc", "reject"];
handler.owner = true
handler.admin = true
handler.botadmin = true
handler.group = true

export default handler;