const handler = async (m, { args, usedPrefix, db }) => {
  const action = (args[0] || "status").toLowerCase();

  if (action === "status") {
    return m.reply(
      `Fitur AI Trina + Atri saat ini: *${global.triggerTrinaEnabled ? "ON" : "OFF"}*\n\n` +
      `• Panggil Trina dengan menyebut: *Trina*\n` +
      `• Panggil Atri dengan menyebut: *Atri*\n` +
      `• Panggil keduanya dengan menyebut: *Trina dan Atri*`
    );
  }

  if (!["on", "off"].includes(action)) {
    return m.reply(
      `Cara penggunaan:\n` +
      `• ${usedPrefix}trina on\n` +
      `• ${usedPrefix}trina off\n` +
      `• ${usedPrefix}trina status\n\n` +
      `Sistem ini mengaktifkan atau menonaktifkan AI Trina dan Atri sekaligus.`
    );
  }

  const enabled = action === "on";
  if (global.triggerTrinaEnabled === enabled) {
    return m.reply(`Fitur AI Trina + Atri sudah *${enabled ? "ON" : "OFF"}*.`);
  }

  try {
    await db("settings", "bot", "triggerTrina", enabled ? 1 : 0);
    global.triggerTrinaEnabled = enabled;
    return m.reply(`Fitur AI Trina + Atri berhasil di-*${enabled ? "ON" : "OFF"}*.`);
  } catch (error) {
    console.error("[AI CHARACTER TOGGLE] Gagal menyimpan pengaturan:", error);
    return m.reply("Gagal menyimpan pengaturan AI Trina + Atri ke database.");
  }
};

handler.help = ["trina <on|off|status>", "atri <on|off|status>"];
handler.tags = ["owner"];
handler.command = ["trina", "trinai", "atri", "si"];
handler.owner = true;

export default handler;
