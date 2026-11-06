
const handler = async (m, { reply, text, usedPrefix, command, db }) => {

  if (!text) return reply(`Contoh: ${usedPrefix + command} on/off`);
  
  let t = text.toLowerCase();
  if (t == "on") {
    if (global.autotyping) return reply("*Autotyping sudah aktif!*");
    global.autotyping = true;
    
    try {
        await db('settings', 'bot', 'autotyping', 1);
    } catch (e) {
        console.error(e);
        return reply('Gagal update database.');
    }

  } else if (t == "off") {
    if (!global.autotyping) return reply("*Autotyping sudah tidak aktif!*");
    global.autotyping = false;
    
    try {
        await db('settings', 'bot', 'autotyping', 0);
    } catch (e) {
        console.error(e);
        return reply('Gagal update database.');
    }

  } else {
    return reply(`Contoh: ${usedPrefix + command} on/off`);
  }

  reply(`Berhasil mengubah *autotyping* menjadi: ${t.toUpperCase()}`);
}

handler.command = ["autotyping"];
handler.owner = true

export default handler;