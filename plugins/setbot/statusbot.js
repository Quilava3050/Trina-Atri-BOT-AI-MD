
const handler = async (m, { reply, args, usedPrefix, command, db }) => {

  if (args[0]?.toLowerCase() === 'prefix') {
    const prefixValue = args[1]?.trim()

    if (!prefixValue) {
      const mode = global.multiprefix ? 'ON' : 'OFF'
      return reply(
        `*PREFIX SETTINGS*\n\n` +
        `› Mode: *${mode}*\n` +
        `› Prefix: *${global.prefix || '.'}*\n\n` +
        `*Penggunaan:*\n` +
        `› ${usedPrefix + command} prefix on\n` +
        `› ${usedPrefix + command} prefix off\n` +
        `› ${usedPrefix + command} prefix #`
      )
    }

    if (prefixValue.toLowerCase() === 'on' || prefixValue.toLowerCase() === 'off') {
      const isEnable = prefixValue.toLowerCase() === 'on'
      if (global.multiprefix === isEnable) {
        return reply(`Mode prefix sudah *${isEnable ? 'ON' : 'OFF'}*.`)
      }

      global.multiprefix = isEnable
      await db('settings', 'bot', 'multiprefix', isEnable ? 1 : 0)
      return reply(
        `[✓] Mode prefix: *${isEnable ? 'ON' : 'OFF'}*\n\n` +
        `Gunakan command ${isEnable ? `dengan awalan *${global.prefix || '.'}*` : '*tanpa prefix*'}.`
      )
    }

    if (prefixValue.length > 3 || /^[a-zA-Z0-9]+$/.test(prefixValue)) {
      return reply('Prefix harus berupa 1-3 simbol, contohnya: `.setbot prefix #`')
    }

    global.prefix = prefixValue
    await db('settings', 'bot', 'prefix', prefixValue)
    return reply(`[✓] Prefix berhasil diganti menjadi: *${prefixValue}*`)
  }

  const fiturList = [
    "autotyping", // 1
    "autoread",   // 2
    "readsw",     // 3
    "reactsw",    // 4
    "grupreact",  // 5
    "pconly",     // 6
    "gconly",     // 7
    "anticall",   // 8
    "grupstickerreact" // 9
  ];

  const action = args[0] ? args[0].toLowerCase() : '';
  
  if (action !== 'on' && action !== 'off') {
    let teks = `*SETTINGS BOT*\n\n`;
    
    fiturList.forEach((key, index) => {
      const status = global[key] ? "ON" : "OFF";
      teks += `[${index + 1}] ${key} : *${status}*\n`;
    });

    teks += `\n*Used:*`;
    teks += `\n› ${usedPrefix + command} on <nomor fitur>`;
    teks += `\n› ${usedPrefix + command} off <nomor fitur>`;
    teks += `\n\n*Example:*`;
    teks += `\n› ${usedPrefix + command} on/off 3 4 5`;
    
    return reply(teks);
  }

  const indexes = args.slice(1);
  if (indexes.length === 0) {
    return reply(`Masukkan nomor fitur!\nContoh: *${usedPrefix + command} ${action} 1*`);
  }

  const isEnable = action === 'on'; 
  const dbValue = isEnable ? 1 : 0; 
  
  const success = [];
  const failed = [];

  for (const strIndex of indexes) {
    const i = /^\d+$/.test(strIndex) ? Number(strIndex) - 1 : -1;
    const key = fiturList[i];

    if (!key) {
      failed.push(strIndex); 
      continue;
    }

    global[key] = isEnable;

    try {
      await db('settings', 'bot', key, dbValue);
      success.push(key);
    } catch (e) {
      console.error(`Gagal update ${key}:`, e);
      failed.push(`${key}(DB Error)`);
    }
  }

  let msg = `*STATUS UPDATE*\n\n`;
  if (success.length > 0) {
    msg += `Berhasil di *${action.toUpperCase()}*:\n- ${success.join('\n- ')}\n`;
  }
  if (failed.length > 0) {
    msg += `\nGagal/Tidak Valid:\n- ${failed.join(', ')}`;
  }

  reply(msg);
};

handler.command = ["statusbot", "setbot", "settings"];
handler.owner = true

export default handler;