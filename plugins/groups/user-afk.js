const handler = async (m, { sock, text, reply, getUser, db, chatDb }) => {

  if (!m.isGroup) return reply('Fitur AFK hanya untuk grup.');

  const user = await getUser(m.sender);
  if (user?.banned) return;

  // parse afk_users dari grup
  let afkUsers = {};
  try { afkUsers = JSON.parse(chatDb.afk_users || '{}'); } catch {}

  if (afkUsers[m.sender] && afkUsers[m.sender].time > -1) {
    return reply('Kamu kan sudah AFK! 💤');
  }

  const reason = text?.trim() || 'Tanpa alasan';

  afkUsers[m.sender] = { time: Date.now(), reason };
  await db('groups', m.chat, 'afk_users', JSON.stringify(afkUsers));

  await sock.sendMessage(m.chat, {
    text: `💤 Kini @${m.sender.split('@')[0]} dalam mode *AFK!*\n\n- 💬 *Alasan:* ${reason}\n- 💌 Jangan diganggu dulu ya!`,
    mentions: [m.sender],
  }, { quoted: m });
};

handler.command = ['afk'];
handler.group = true;
export default handler;