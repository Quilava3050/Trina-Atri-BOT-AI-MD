import { getInitiativeConfig, saveInitiativeConfig } from "../../control/initiative.js";

const formatChatList = groups => groups.length
  ? groups.map((chat, index) => `${index + 1}. ${chat}`).join("\n")
  : "Belum ada grup yang dipilih.";

const handler = async (m, { args, usedPrefix }) => {
  const config = await getInitiativeConfig();
  const section = (args[0] || "status").toLowerCase();
  const action = (args[1] || "").toLowerCase();

  if (section === "status") {
    const opener = config.opener === "random"
      ? "Acak"
      : config.opener === "atri" ? "Atri" : "Trina";
    return m.reply([
      "*Inisiatif Trina & Atri*",
      `Private: *${config.privateEnabled ? "ON" : "OFF"}*`,
      `Grup: *${config.groupsEnabled ? "ON" : "OFF"}*`,
      `Pemulai: *${opener}*`,
      "Jadwal: *3 sesi acak per hari, pukul 10.00–21.00 WIB*",
      "",
      "*Grup terpilih (maksimal 2):*",
      formatChatList(config.groups),
      "",
      `Gunakan ${usedPrefix}inisiatif bantuan untuk melihat perintah.`
    ].join("\n"));
  }

  if (section === "bantuan" || section === "help") {
    return m.reply([
      "*Pengaturan Inisiatif Trina & Atri*",
      `• ${usedPrefix}inisiatif private on|off`,
      `• ${usedPrefix}inisiatif grup pilih — jalankan di grup yang ingin dipilih`,
      `• ${usedPrefix}inisiatif grup hapus — jalankan di grup terpilih`,
      `• ${usedPrefix}inisiatif grup on|off`,
      `• ${usedPrefix}inisiatif grup daftar`,
      `• ${usedPrefix}inisiatif pemulai random|trina|atri`,
      `• ${usedPrefix}inisiatif status`,
      `• ${usedPrefix}inisiatif off — matikan private dan grup`
    ].join("\n"));
  }

  if (section === "off") {
    config.privateEnabled = false;
    config.groupsEnabled = false;
    await saveInitiativeConfig(config);
    return m.reply("Inisiatif Trina & Atri dimatikan di private dan grup.");
  }

  if (section === "private") {
    if (!["on", "off"].includes(action)) {
      return m.reply(`Gunakan: ${usedPrefix}inisiatif private on|off`);
    }
    config.privateEnabled = action === "on";
    if (config.privateEnabled) config.privateJid = m.sender;
    await saveInitiativeConfig(config);
    return m.reply(`Inisiatif private berhasil di-${action.toUpperCase()}.`);
  }

  if (section === "grup" || section === "group") {
    if (action === "pilih" || action === "tambah") {
      if (!m.isGroup) return m.reply("Jalankan perintah ini di grup yang ingin dipilih.");
      if (!config.groups.includes(m.chat) && config.groups.length >= 2) {
        return m.reply("Maksimal hanya 2 grup yang bisa dipilih. Hapus salah satu grup dulu.");
      }
      if (!config.groups.includes(m.chat)) config.groups.push(m.chat);
      config.groupsEnabled = true;
      await saveInitiativeConfig(config);
      return m.reply(`Grup ini dipilih dan inisiatif grup diaktifkan.\n\nGrup terpilih:\n${formatChatList(config.groups)}`);
    }

    if (action === "hapus" || action === "remove") {
      if (!m.isGroup) return m.reply("Jalankan perintah ini di grup yang ingin dihapus dari pilihan.");
      config.groups = config.groups.filter(chat => chat !== m.chat);
      if (!config.groups.length) config.groupsEnabled = false;
      await saveInitiativeConfig(config);
      return m.reply(`Grup ini dihapus dari pilihan.\n\nGrup terpilih:\n${formatChatList(config.groups)}`);
    }

    if (action === "daftar" || action === "list") {
      return m.reply(`*Grup terpilih (maksimal 2):*\n${formatChatList(config.groups)}`);
    }

    if (action === "on" || action === "off") {
      if (action === "on" && !config.groups.length) {
        return m.reply(`Pilih grup dulu dengan menjalankan ${usedPrefix}inisiatif grup pilih di dalam grup.`);
      }
      config.groupsEnabled = action === "on";
      await saveInitiativeConfig(config);
      return m.reply(`Inisiatif grup berhasil di-${action.toUpperCase()}.`);
    }

    return m.reply(`Gunakan: ${usedPrefix}inisiatif grup pilih|hapus|daftar|on|off`);
  }

  if (section === "pemulai" || section === "opener") {
    const opener = action === "acak" ? "random" : action;
    if (!["random", "trina", "atri"].includes(opener)) {
      return m.reply(`Gunakan: ${usedPrefix}inisiatif pemulai random|trina|atri`);
    }
    config.opener = opener;
    await saveInitiativeConfig(config);
    const label = opener === "random" ? "acak" : opener === "atri" ? "Atri" : "Trina";
    return m.reply(`Karakter pembuka diatur ke *${label}*.`);
  }

  return m.reply(`Perintah tidak dikenali. Ketik ${usedPrefix}inisiatif bantuan.`);
};

handler.help = ["inisiatif <status|private|grup|pemulai|off>"];
handler.tags = ["owner"];
handler.command = ["inisiatif","isf"];
handler.owner = true;

export default handler;
