const handler = async (m, { reply, text, usedPrefix, command, db }) => {
  const action = String(text || "").trim().toLowerCase();
  if (!["on", "off"].includes(action)) {
    return reply(`Status auto sticker react grup: *${global.grupstickerreact ? "ON" : "OFF"}*\nContoh: ${usedPrefix + command} on/off`);
  }

  const enabled = action === "on";
  if (global.grupstickerreact === enabled) {
    return reply(`Auto sticker react grup sudah *${action.toUpperCase()}*.`);
  }

  try {
    await db("settings", "bot", "grupstickerreact", enabled ? 1 : 0);
    global.grupstickerreact = enabled;
  } catch (error) {
    console.error("[GRUPSTICKERREACT] Gagal menyimpan pengaturan:", error);
    return reply("Gagal menyimpan pengaturan auto sticker react grup.");
  }

  return reply(`Auto sticker react grup berhasil di-*${action.toUpperCase()}*.`);
};

handler.help = ["grupstickerreact <on/off>"];
handler.tags = ["setbot"];
handler.command = ["grupstickerreact"];
handler.owner = true;

export default handler;
