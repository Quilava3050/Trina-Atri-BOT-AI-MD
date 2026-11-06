
const handler = async (m, { reply, text, usedPrefix, command, db }) => {

  if (!text) return reply(`Contoh: ${usedPrefix + command} on/off`);
  
  let t = text.toLowerCase();
  if (t == "on") {
    if (global.readsw) return reply("*Auto Read SW sudah aktif!*");
    global.readsw = true;
    try {
        await db('settings', 'bot', 'readsw', 1);
    } catch (e) {
        console.error(e);
        return reply('Gagal update database.');
    }

  } else if (t == "off") {
    if (!global.readsw) return reply("*Auto Read SW sudah tidak aktif!*");
    global.readsw = false;
    
    try {
        await db('settings', 'bot', 'readsw', 0);
    } catch (e) {
        console.error(e);
        return reply('Gagal update database.');
    }

  } else {
    return reply(`Contoh: ${usedPrefix + command} on/off`);
  }

  reply(`Berhasil mengubah *Auto Read SW* menjadi: ${t.toUpperCase()}`);
}

handler.command = ["autoreadsw", "readsw"];
handler.owner = true

export default handler;