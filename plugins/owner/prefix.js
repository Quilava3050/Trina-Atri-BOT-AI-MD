const handler = async (m, { args, usedPrefix, command, db }) => {
    
    const saveDb = async (col, val) => {
        try {
            await db('settings', 'bot', col, val);
        } catch (e) {
            console.error("Db Error:", e);
        }
    };

    if (command === 'setprefix') {
        if (!args[0]) return m.reply(`Contoh: ${usedPrefix}setprefix #`);

        const newPrefix = args[0];

        global.prefix = newPrefix;
        await saveDb('prefix', newPrefix);

        return m.reply(`[✓] Prefix berhasil diganti jadi: *${newPrefix}*`);
    }

    if (command === 'delprefix') {
        global.prefix = '.';
        await saveDb('prefix', '.');

        return m.reply(`[✓] Prefix di-reset ke default: *.*`);
    }

    if (command === 'prefix') {
        const mode = args[0] ? args[0].toLowerCase() : '';

        if (mode === 'on') {
            if (global.multiprefix) return m.reply('Sudah Mode ON!');
            
            global.multiprefix = true;
            await saveDb('multiprefix', 1); // 1 = True
            return m.reply(`[✓] Mode Prefix: *ON*\n\n*⚠️ Note:*\nGunakan command dengan awalan prefix *${global.prefix}*`);
        }

        if (mode === 'off') {
            if (!global.multiprefix) return m.reply('Sudah Mode OFF!');

            global.multiprefix = false;
            await saveDb('multiprefix', 0); // 0 = False
            return m.reply(`[✓] Mode Prefix: *OFF*\n\n*⚠️ Note:*\nGunakan command *tanpa prefix!*`);
        }

        let status = global.multiprefix ? "ON" : "OFF";
        let p = global.prefix || '.';
        
        let msg = `*Status Prefix*\n` +
                  `› Mode: *${status}*\n` +
                  `› Prefix: *${p}*\n\n` +
                  `*Example Command:*\n` +
                  `› ${usedPrefix}prefix on\n` +
                  `› ${usedPrefix}prefix off\n` +
                  `› ${usedPrefix}setprefix <simbol>`;
        
        return m.reply(msg);
    }
};

handler.command = ["prefix", "setprefix", "delprefix"];
handler.owner = true

export default handler;