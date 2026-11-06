const handler = async (m, { sock, args, command, reply, usedPrefix, chatDb, db }) => {

  const featureList = [
  "welcome",
  "goodbye",
  "antilinkgc",
  "antichannel",
  "antilinkch",
  "antilinkall",
  "antipromosi",
  "antisticker",
  "antitoxic",
  "antitagsw",
  "autosholat",
  "autoberita",
  "automotivasi",
  "antidelete",
  "antifoto"
  ];

  if (!args.length) {
    let teks = `*GROUP SETTINGS*\n\n`;

    featureList.forEach((key, i) => {
      const status = chatDb[key] === 1 ? 'ON' : 'OFF';
      teks += `[${i + 1}] ${key} : *${status}*\n`;
    });

    teks += `\nCatatan: antidelete menyimpan arsip internal secara otomatis.`;
    teks += `\n› Cara: ${usedPrefix + command} <nomor>`;
    teks += `\n› Contoh: ${usedPrefix + command} 1 3 5`;

    return reply(teks);
  }

  const indexes = args
    .map(a => parseInt(a))
    .filter(n => !isNaN(n));

  if (!indexes.length)
    return reply("Masukkan nomor fitur yang valid. Contoh: *.on 1*");

  const targetValue = command === 'on' ? 1 : 0;
  const updated = [];
  const failed = [];

  for (const i of indexes) {

    const key = featureList[i - 1];

    if (!key) continue;

    try {

      await db('groups', m.chat, key, targetValue);
      updated.push(key);

      // auto sync welcome ↔ goodbye
      if (key === "welcome") {

        await db('groups', m.chat, "goodbye", targetValue);

        if (!updated.includes("goodbye"))
          updated.push("goodbye");

      }

    } catch (e) {

      console.error(e);
      failed.push(key);

    }

  }

  let msg = `Fitur berhasil di *${command === 'on' ? 'aktifkan' : 'matikan'}*:\n`;

  if (updated.length > 0)
    msg += `- ${updated.join('\n- ')}`;

  if (failed.length > 0)
    msg += `\n\nGagal update: ${failed.join(', ')}`;

  return reply(msg);

}

handler.command = ['on', 'off'];
handler.owner = true
handler.admin = true
handler.group = true

export default handler;