
const handler = async (m, { reply, args, command, usedPrefix, db }) => {

  let status = (args[0] || "").toLowerCase();
  if (!["on", "off"].includes(status)) {
    return reply(`Contoh: ${usedPrefix + command} on/off`);
  }

  const isEnable = status === "on"; 
  const dbValue = isEnable ? 1 : 0; 

  try {
    if (command === "pconly") {
      global.pconly = isEnable;
      await db('settings', 'bot', 'pconly', dbValue);

      if (isEnable) {
        global.gconly = false;
        await db('settings', 'bot', 'gconly', 0);
      }
    } 
    
    else if (command === "gconly") {
      global.gconly = isEnable;
      await db('settings', 'bot', 'gconly', dbValue);

      if (isEnable) {
        global.pconly = false;
        await db('settings', 'bot', 'pconly', 0);
      }
    }

    reply(`Mode *${command.toUpperCase()}* berhasil di ${status === "on" ? "aktifkan" : "matikan"}`);

  } catch (e) {
    console.error(e);
    reply('Gagal menyimpan ke database.');
  }
};

handler.command = ["pconly", "gconly"];
handler.owner = true

export default handler;