import fs from "fs";
const banFile = "./data/ban.json";

const handler = async (m, { sock }) => {

  let you = JSON.parse(fs.readFileSync(banFile));
  if (!you.length) return m.reply("Belum ada nomor yang dibanned.");

  let teks = `*User terbanned*\n> total ban : ${you.length} user\n\n`;
  teks += you.map(v => `- ${v.split("@")[0]}`).join("\n");

  m.reply(teks, { mentions: you });
};

handler.command = ["listbanuser", "listban"];
handler.owner = true

export default handler;