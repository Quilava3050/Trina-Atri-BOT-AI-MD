import { banChat } from "../../control/banned-chats.js";

let handler = async (m, { sock }) => {
    if (!m.isGroup) return m.reply("❌ Perintah ini hanya dapat digunakan di grup.");

    const metadata = await sock.groupMetadata(m.chat).catch(() => ({}));
    const name = metadata.subject || m.chat;
    banChat(m.chat);
    return m.reply(`✅ Berhasil! Chat di grup *${name}* telah di-banned.`);
}

handler.help = ['banchat']
handler.tags = ['owner']
handler.command = ['banchat','bnc']

handler.owner = true

export default handler