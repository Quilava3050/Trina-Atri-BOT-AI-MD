import { renderLoopmatch } from "../../control/lib/loopmatch-scraper.js";

const MAX_TEXT = 23;
const RATIOS = {
  "9:16": "9:16",
  "916": "9:16",
  "9x16": "9:16",
  "9-16": "9:16",
  vertical: "9:16",
  potret: "9:16",
  tegak: "9:16",
  "1:1": "1:1",
  "11": "1:1",
  "1x1": "1:1",
  square: "1:1",
  persegi: "1:1",
  "16:9": "16:9",
  "169": "16:9",
  "16x9": "16:9",
  "16-9": "16:9",
  landscape: "16:9",
  horizontal: "16:9",
  lebar: "16:9"
};
const SOUND_ALIASES = {
  paper: "paper",
  kertas: "paper",
  gesek: "paper",
  "paper shuffle": "paper",
  shutter: "shutter",
  kamera: "shutter",
  "camera shutter": "shutter",
  film: "film",
  "film advance": "film",
  polaroid: "polaroid",
  "foto polaroid": "polaroid",
  flash: "flash",
  "flash pop": "flash",
  none: "none",
  no: "none",
  off: "none",
  silent: "none",
  "no sound": "none",
  "tanpa suara": "none"
};
const SOUND_LABELS = {
  paper: "paper shuffle",
  shutter: "camera shutter",
  film: "film advance",
  polaroid: "polaroid",
  flash: "flash pop",
  none: "tanpa suara"
};

const guide = (prefix, command) => [
  "Panduan Loop Match",
  "",
  `${prefix}${command} <rasio> <teks> [suara]`,
  "Rasio: 9:16, 1:1, 16:9",
  "Suara: paper, shutter, film, polaroid, flash, none",
  `Maksimal teks ${MAX_TEXT} karakter.`,
  "",
  `Contoh: ${prefix}${command} 9:16 TACO again paper`
].join("\n");

const extractSound = (tokens) => {
  if (tokens.length >= 3) {
    const alias = tokens.slice(-2).join(" ").toLowerCase();
    if (SOUND_ALIASES[alias]) {
      return { sound: SOUND_ALIASES[alias], textTokens: tokens.slice(0, -2) };
    }
  }

  if (tokens.length >= 2) {
    const alias = tokens[tokens.length - 1].toLowerCase();
    if (SOUND_ALIASES[alias]) {
      return { sound: SOUND_ALIASES[alias], textTokens: tokens.slice(0, -1) };
    }
  }

  return { sound: "paper", textTokens: tokens };
};

const handler = async (m, { sock, args, text, reply, usedPrefix, command }) => {
  const tokens = (Array.isArray(args) && args.length
    ? args
    : String(text || "").trim().split(/\s+/).filter(Boolean)
  ).map(token => String(token).trim()).filter(Boolean);
  const prefix = usedPrefix || global.prefix || ".";
  const commandName = command || "loopmatch";

  if (!tokens.length) return reply(guide(prefix, commandName));

  const ratio = RATIOS[tokens[0].toLowerCase()];
  if (!ratio) {
    return reply(`Rasio tidak valid. Pilih 9:16, 1:1, atau 16:9.\n\n${guide(prefix, commandName)}`);
  }

  const { sound, textTokens } = extractSound(tokens.slice(1));
  const keyword = textTokens.join(" ").trim();
  if (!keyword) return reply(`Masukkan teks yang ingin dibuat.\n\n${guide(prefix, commandName)}`);
  if (keyword.length > MAX_TEXT) {
    return reply(`Teks maksimal ${MAX_TEXT} karakter; teks kamu ${keyword.length} karakter.`);
  }

  await sock.sendPresenceUpdate?.("composing", m.chat);
  await sock.sendMessage(m.chat, { text: "Sedang membuat video Loop Match, mohon tunggu..." }, { quoted: m });

  try {
    const video = await renderLoopmatch({ keyword, ratio, sound });
    await sock.sendMessage(m.chat, {
      video,
      mimetype: "video/mp4",
      fileName: `loopmatch-${Date.now()}.mp4`,
      caption: [
        "Loop Match",
        `Rasio: ${ratio}`,
        `Teks: ${keyword}`,
        `Suara: ${SOUND_LABELS[sound]}`
      ].join("\n")
    }, { quoted: m });
  } catch (error) {
    console.error("[LOOPMATCH] Gagal membuat video:", error);
    const detail = String(error?.message || error || "Kesalahan tidak diketahui.")
      .replace(/\s+/g, " ")
      .slice(0, 300);
    await reply(`Gagal membuat video Loop Match: ${detail}`);
  }
};

handler.help = ["loopmatch <rasio> <teks> [suara]"];
handler.tags = ["maker"];
handler.command = ["loopmatch", "textmatch", "textmatchcut", "tmc"];

export default handler;
