import WelcomeMessage from '../../event/welcome.js'

const handler = async (m, { sock, reply, args, usedPrefix }) => {
  try {

    const type = args[0]; // add / remove / promote / demote
    if (!type) return reply(`Contoh: ${usedPrefix}simulasi add`);
    if (!['add', 'remove', 'promote', 'demote'].includes(type)) {
      return reply('Jenis simulasi tidak valid!\nGunakan salah satu:\n- add\n- remove\n- promote\n- demote');
    }

    // 🧩 Buat event palsu
    const dummyEvent = {
      id: m.chat,
      author: m.sender,
      participants: [m.sender],
      action: type
    };

    // 🚀 Jalankan fungsi welcome
    await WelcomeMessage(sock, dummyEvent);

    // ✅ Konfirmasi
// await reply(`✅ Simulasi *${type}* berhasil dijalankan!`);
  } catch (e) {
    console.error(e);
    reply('*Terjadi kesalahan saat simulasi 😢*');
  } finally {
    await sock.sendMessage(m.chat, { react: { text: '', key: m.key } }).catch(() => {});
  }
};

handler.command = ['simulasi', 'testwelcome'];
handler.owner = true
handler.group = true

export default handler;