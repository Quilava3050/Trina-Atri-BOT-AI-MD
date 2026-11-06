const handler = async (m, { sock, reply }) => {
  try {

    await reply('goodbye, see you again~');

    await sock.groupLeave(m.chat);

  } catch (err) {
    console.error(err);
    reply('❌ Gagal keluar dari grup.');
  }

}

handler.command = ['out', 'leave', 'bot-out']
handler.owner = true
handler.group = true

export default handler