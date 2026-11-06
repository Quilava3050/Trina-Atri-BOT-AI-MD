// plugins/grup/openclose.js
const handler = async (m, { sock, reply, command }) => {

  if (command === "open" || command === "buka") {
    await sock.groupSettingUpdate(m.chat, "not_announcement");
    return reply("*Grup Open* semua member sekarang bisa kirim pesan!");
  }

  if (command === "close" || command === "tutup") {
    await sock.groupSettingUpdate(m.chat, "announcement");
    return reply("*Group Close* hanya admin yang dapat mengirim pesan!");
  }
};

handler.command = ["open", "buka", "close", "tutup"];
handler.owner = true
handler.admin = true
handler.group = true
handler.botadmin = true

export default handler;