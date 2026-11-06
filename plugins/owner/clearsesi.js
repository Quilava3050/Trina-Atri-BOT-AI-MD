import fs from "fs";

const handler = async (m, { sock, reply }) => {
  
  const pathAuth = "./Auth";
  const pathTrash = "./data/trash";

  if (!fs.existsSync(pathAuth)) fs.mkdirSync(pathAuth, { recursive: true });
  if (!fs.existsSync(pathTrash)) fs.mkdirSync(pathTrash, { recursive: true });
  const dirsesi = fs.readdirSync(pathAuth).filter(e => e !== "creds.json");
  const dirsampah = fs.readdirSync(pathTrash).filter(e => e !== "tmp");

  for (const file of dirsesi) {
    try {
      fs.unlinkSync(`${pathAuth}/${file}`);
    } catch (e) {
      console.error(`Gagal hapus ${file}:`, e.message);
    }
  }

  for (const file of dirsampah) {
    try {
      fs.unlinkSync(`${pathTrash}/${file}`);
    } catch (e) {
      console.error(`Gagal hapus ${file}:`, e.message);
    }
  }

  // kirim hasil
  reply(`*Berhasil membersihkan sampah ✅*
- *${dirsesi.length}* sampah session
- *${dirsampah.length}* sampah file`);
};

// nama command yang bisa dipakai
handler.command = ["clsesi", "cls", "clearsesi"];
handler.owner = true

export default handler;