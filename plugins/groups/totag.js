const handler = async (m, { sock, reply, example }) => {

  // --- FIX UTAMA (Ambil member dari metadata) ---
  const meta = await sock.groupMetadata(m.chat);
  const participants = meta.participants;

  let users = participants
    .map(p => p.id)
    .filter(id => id !== sock.user.jid);

  if (!m.quoted) return reply(example("reply pesan yang mau di tag"));

  await sock.sendMessage(m.chat, {
    forward: m.quoted.fakeObj,
    mentions: users,
  });
};

handler.command = ["totag"];
handler.owner = true
handler.admin = true
handler.group = true
handler.botadmin = true

export default handler;