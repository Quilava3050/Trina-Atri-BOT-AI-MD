import fs from "fs"
import path from "path"
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handler = async (m, { sock, text, command, reply, usedPrefix }) => {
  try {

    if (!text || !m.quoted || !m.quoted.text)
      return reply(`Contoh: *${usedPrefix}${command}* command/menu.js (dengan reply kodenya)`);

    if (!text.endsWith(".js"))
      return reply(`Contoh: *${usedPrefix}${command}* command/menu.js`);

    const filePath = path.join(__dirname, "../../plugins", text.trim());
    const dirPath = path.dirname(filePath);

    // Buat folder jika belum ada
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    fs.writeFileSync(filePath, m.quoted.text);

    return reply(`Berhasil menyimpan plugin di *${text.trim()}*`);
  } catch (err) {
    console.error(err);
    reply("Terjadi kesalahan saat menyimpan plugin.");
  }
};

handler.command = ["addp", "addplugin", "addplugins", "saveplugin", "saveplugins", "svp", "sp"];
handler.owner = true

export default handler;