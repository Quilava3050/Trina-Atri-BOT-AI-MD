import { unbanChat } from "../../control/banned-chats.js";

let handler = async (m, { sock }) => {
    if (!m.isGroup) return m.reply("❌ Perintah ini hanya dapat digunakan di grup.");

    const metadata = await sock.groupMetadata(m.chat).catch(() => ({}));
    const name = metadata.subject || m.chat;
    unbanChat(m.chat);
    return m.reply(`🔓 *UNBANNED BERHASIL*\n\nSekarang fitur bot di grup *${name}* sudah dapat digunakan kembali oleh semua member.`);
}

handler.help = ['unbanchat']
handler.tags = ['owner']
handler.command = ['unbanchat','ubc']

handler.owner = true

export default handler