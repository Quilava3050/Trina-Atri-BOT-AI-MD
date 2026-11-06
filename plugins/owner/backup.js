import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const handler = async (m, { sock, reply }) => {
    if (m.key.fromMe) return; 

    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const date = `${day}-${month}-${year}`;

    function jam(tz = "Asia/Jakarta") {
        return new Date().toLocaleTimeString("id-ID", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }
  
    try {        
        const tmpDir = "./data/trash";
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        if (fs.existsSync(tmpDir)) {
            const files = fs.readdirSync(tmpDir).filter(f => !f.endsWith(".js"));
            for (let file of files) {
                fs.unlinkSync(`${tmpDir}/${file}`);
            }
        }
        
        await m.reply("Processing Backup Script . .");        
        const name = `backup-${date}`; 
        
        const exclude = ["node_modules", "Auth", "package-lock.json", "yarn.lock", ".npm", ".cache", ".git", "session"];
        const filesToZip = fs.readdirSync(".").filter(f => !exclude.includes(f) && f !== "");

        if (!filesToZip.length) return m.reply("Tidak ada file yang dapat di-backup.");

        execSync(`zip -r ${name}.zip ${filesToZip.join(" ")}`);

        await sock.sendMessage(m.sender, {
            document: fs.readFileSync(`./${name}.zip`),
            fileName: `${name}.zip`,
            caption: `*Success Backup Script*
        
- 📅 Tanggal: ${date}
- ⏰ Waktu: ${jam("Asia/Jakarta")} WIB 

*💬 Tetap berhati-hati jaga baik-baik source code Anda!*`, 
            mimetype: "application/zip"
        }, { quoted: m });

        fs.unlinkSync(`./${name}.zip`);

        if (m.chat !== m.sender) m.reply("Script bot berhasil dikirim ke private chat.");
        
    } catch (err) {
        console.error("Backup Error:", err);
        m.reply("Terjadi kesalahan saat melakukan backup.");
    }
};

handler.command = ["backup", "bck", "backupsc"];
handler.owner = true

export default handler;