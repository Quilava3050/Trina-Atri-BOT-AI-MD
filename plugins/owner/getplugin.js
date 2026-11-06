import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handler = async (m, { sock, text, command, reply, usedPrefix }) => {
    const client = sock || reply;

    try {
        const baseDir = path.join(__dirname, "../../plugins");

        if (!text || !text.endsWith(".js")) {
            return reply(`Contoh: *${usedPrefix}${command}* aimenu/llama.js\n\nKetik: *${usedPrefix}listplugin* untuk lihat file plugins.`);
        }

        const targetPath = path.join(baseDir, text.trim());
        if (!fs.existsSync(targetPath)) return reply("❌ Plugin tidak ditemukan.");

        const fileContent = fs.readFileSync(targetPath, "utf8");

        // Kirim kode plugin menggunakan sintaks Shorthand Code Block
        await client.sendMessage(m.chat, {
            disclaimerText: 'Plugin Viewer',
            headerText: `## 📁 File: ${text.trim()}`,
            contentText: '---',
            code: fileContent,
            language: 'javascript',
            footerText: '✨ Trina Plugin Viewer'
        }, { quoted: m });

    } catch (err) {
        console.error(err);
        return reply("❌ Terjadi kesalahan saat membaca plugin: " + err.message);
    }
};

handler.help = ['getplugin'];
handler.tags = ['owner'];
handler.command = ["getp", "gp", "getplugin", "getplugins"];
handler.owner = true;

export default handler;