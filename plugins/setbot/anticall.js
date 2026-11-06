
const handler = async (m, { reply, text, usedPrefix, command, db }) => {

  if (!text) return reply(`Contoh: ${usedPrefix + command} on/off`);
  let t = text.toLowerCase();

  if (t == "on") {
    if (global.anticall) return reply("*Anti Call sudah aktif!*");
    global.anticall = true;
    
    try {
        await db('settings', 'bot', 'anticall', 1);
    } catch (e) {
        console.error(e);
        return reply('Gagal update database.');
    }

  } else if (t == "off") {
    if (!global.anticall) return reply("*Anti Call sudah mati!*");
    global.anticall = false;
    
    try {
        await db('settings', 'bot', 'anticall', 0);
    } catch (e) {
        console.error(e);
        return reply('Gagal update database.');
    }

  } else {
    return reply(`Contoh: ${usedPrefix + command} on/off`);
  }

  reply(`AntiCall sekarang: *${t.toUpperCase()}*`);
}

handler.command = ["anticall"];
handler.owner = true

export default handler;