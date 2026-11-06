import fs from "fs";
import path from "path";

const handler = async (m, { sock, text, command, reply, usedPrefix }) => {

  const botNumber = sock.user.id;  
  if (!text)
    return reply(`*How to use:* 
- ${usedPrefix + command} ./path.js
- ${usedPrefix + command} ./folder/path.js

*Example:*
- ${usedPrefix + command} ./inde.js
- ${usedPrefix + command} ./data/setbot.json`);

  let filePath = text.trim();

  if (!fs.existsSync(filePath)) {
    return reply(`File tidak ditemukan: *${filePath}*`);
  }

  if (!fs.statSync(filePath).isFile()) {
    return reply(`Path tersebut folder tidak bisa\n*${usedPrefix}listfile* untuk melihat detail`);
  }

  try {
    let buffer = fs.readFileSync(filePath);
    let fileName = path.basename(filePath);

    await sock.sendMessage(botNumber, {
      document: buffer,
      fileName,
      mimetype: "application/octet-stream",
      caption: `*Success get file*\n- Target: *${filePath}*`
    });

    await reply(`📬 *File berhasil diambil!*\nFile telah dikirim ke *private chat bot*.`);

  } catch (err) {
    console.log(err);
    return reply("❌ Gagal mengirim file.");
  }
};

handler.command = ["get-file", "ambilfile", "file", "dlfile"];
handler.owner = true

export default handler;