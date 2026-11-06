
const handler = async (m, { sock, text, command, reply, usedPrefix, db }) => {
  
  const input = text?.toLowerCase();
  if (!['on', 'off'].includes(input)) {
    return reply(`Contoh: ${usedPrefix + command} on/off`);
  }

  const dbValue = input === 'on' ? 1 : 0;

  try {
    await db('groups', m.chat, 'antisticker', dbValue);

    reply(`Fitur *antisticker* berhasil di *${input === 'on' ? 'aktifkan' : 'matikan'}*`);
  } catch (e) {
    console.error(e);
    reply('❌ Gagal menyimpan ke database.');
  }
}

handler.command = ['antisticker', 'antis'];
handler.owner = true
handler.admin = true
handler.group = true
handler.botadmin = true

export default handler;