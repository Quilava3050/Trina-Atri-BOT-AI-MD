const handler = async (m, { args, usedPrefix, db }) => {
    const input = (args[0] || "").toLowerCase();

    if (!input) {
        return m.reply(`*Mode bot saat ini:*
› Dalam mode: ${global.public ? "*public*" : "*private*"}

*Information for users:*
› *mode public*
- dapat digunakan oleh semua pengguna!

› *mode private*
- hanya dapat digunakan oleh owner!

*How to use:*
› ${usedPrefix}mode public 
› ${usedPrefix}mode private`);
    }

    if (input === "public") {
        if (global.public) return m.reply("Bot is already in *public mode!*");

        global.public = true;
        try {
            await db('settings', 'bot', 'public', 1);
            return m.reply(`Success Bot *Mode Public*`);
        } catch (e) {
            console.error(e);
            return m.reply('Gagal menyimpan ke database.');
        }
    }

    if (input === "private") {
        if (!global.public) return m.reply("Bot is already in *private mode!*");

        // Update RAM
        global.public = false;
        try {
            await db('settings', 'bot', 'public', 0);
            return m.reply(`Success Bot *Mode Private*`);
        } catch (e) {
            console.error(e);
            return m.reply('Gagal menyimpan ke database.');
        }
    }

    return m.reply(`*How to use:*
    
› ${usedPrefix}mode public 
› ${usedPrefix}mode private`);
};

handler.command = ["mode"];
handler.owner = true

export default handler;