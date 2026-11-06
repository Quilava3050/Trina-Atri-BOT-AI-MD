import fs from "fs"
import path from "path"
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handler = async (m, { sock, reply }) => {
  try {

    const baseDir = path.join(__dirname, "../../plugins");
    if (!fs.existsSync(baseDir)) return reply("Folder ./plugins tidak ditemukan.");

    // ambil semua kategori (folder)
    const categories = fs.readdirSync(baseDir).filter((f) => {
      const fullPath = path.join(baseDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    let totalFiles = 0;
    let teks = "";

    for (const category of categories) {
      const catPath = path.join(baseDir, category);
      const files = fs.readdirSync(catPath).filter((f) => f.endsWith(".js"));
      totalFiles += files.length;

      teks += `\n*${category.charAt(0).toUpperCase() + category.slice(1)}*\n`;
      for (const file of files) {
        teks += ` └ ./plugins/${category}/${file}\n`;
      }
    }

    const header = `*Plugins Manager ⭐*\n> *file plugin:* ${totalFiles}\n> *total folder:* ${categories.length}\n`;
    return reply(header + teks);
  } catch (err) {
    console.error(err);
    reply("Terjadi kesalahan saat membaca daftar plugin.");
  }
};

handler.command = ["listplugin", "listp", "listplugins"];
handler.owner = true

export default handler;