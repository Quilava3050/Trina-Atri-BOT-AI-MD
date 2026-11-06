let handler = async (m, { sock, args, usedPrefix, command }) => {

    if (!m.quoted) return m.reply("pesan yang mau di sematkan mana? (reply pesannya)");

    if (!args[0]) {
        return m.reply(`Contoh:
- ${usedPrefix + command} 1 = 1 day
- ${usedPrefix + command} 2 = 7 days
- ${usedPrefix + command} 3 = 30 days`
        );
    }

    const durations = {
        1: { seconds: 86400, label: "1 day" },
        2: { seconds: 604800, label: "7 days" },
        3: { seconds: 2592000, label: "30 days" },
    };

    const selected = durations[args[0]];
    if (!selected) return m.reply("Invalid option. Use 1, 2, or 3 only.");

    const quotedKey = m.quoted?.key;
    if (!quotedKey) return m.reply("Cannot pin: quoted message key not found");
    try {
        await sock.sendMessage(m.chat, {
            pin: quotedKey,
            type: 1,
            time: selected.seconds,
        });
        m.reply(`Berhasil menyematkan pesan dengan durasi waktu *${selected.label}*`);
    } catch (e) {
        sock.logger.error(e);
        m.reply(`Error: ${e.message}`);
    }
};


handler.command = ["semat", "sm"];
handler.owner = true
handler.admin = true
handler.botadmin = true
handler.group = true

export default handler;