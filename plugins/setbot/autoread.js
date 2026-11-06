
const handler = async (m, { reply, text, usedPrefix, command, db }) => {

  if (!text) return reply(`Contoh: ${usedPrefix + command} on/off`);
  let t = text.toLowerCase();

  if (t == "on") {
    if (global.autoread) return reply("*Autoread sudah aktif!*");
    global.autoread = true;
    
    try {
        await db('settings', 'bot', 'autoread', 1);
    } catch (e) {
        console.error(e);
        return reply('Gagal update database.');
    }

  } else if (t == "off") {
    if (!global.autoread) return reply("*Autoread sudah tidak aktif!*");
    global.autoread = false;
    
    try {
        await db('settings', 'bot', 'autoread', 0);
    } catch (e) {
        console.error(e);
        return reply('Gagal update database.');
    }

  } else {
    return reply(`Contoh: ${usedPrefix + command} on/off`);
  }

  reply(`Berhasil mengubah *autoread* menjadi: ${t.toUpperCase()}`);
}

handler.command = ["autoread"];
handler.owner = true

export default handler;