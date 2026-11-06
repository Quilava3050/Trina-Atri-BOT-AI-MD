import fs from "fs";
const banFile = "./data/ban.json";

const handler = async (m, { sock, example, args }) => {

  let you = JSON.parse(fs.readFileSync(banFile));

  const nomor = args[0]
    ? args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
    : m.quoted
    ? m.quoted.sender.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
    : null;

  if (!nomor) return m.reply(example("62xxx (bisa tag/reply)"));
  if (you.includes(nomor)) return m.reply("Nomor sudah dibanned.");

  you.push(nomor);
  fs.writeFileSync(banFile, JSON.stringify(you, null, 2));

  m.reply(`Berhasil banned akses script untuk nomor ${nomor}`);
};

handler.command = ["banuser", "ban"];
handler.owner = true

export default handler;