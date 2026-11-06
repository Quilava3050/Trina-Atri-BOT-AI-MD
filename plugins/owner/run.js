import fs from "fs";
import path from "path";
import util from "util";

const debugDir = path.join(process.cwd(), "debug");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const getDebugFiles = () => {
  if (!fs.existsSync(debugDir)) return [];
  return fs.readdirSync(debugDir)
    .filter(file => file.toLowerCase().endsWith(".js"))
    .sort();
};

const handler = async (m, { sock, args, reply, text, usedPrefix }) => {
  const input = args?.[0]?.trim();
  const files = getDebugFiles();

  if (!files.length) {
    return reply("Belum ada file JavaScript di folder debug.");
  }

  // Jika tidak ada argumen, tampilkan daftar file beserta nomor urutnya
  if (!input) {
    const list = files.map((file, i) => `*${i + 1}.* ${file}`).join("\n");
    return reply(`File CRM yang tersedia:\n\n${list}\n\nCara pakai:\n• Pake angka: *${usedPrefix}run 1*\n• Pake nama: *${usedPrefix}run test.js*`);
  }

  let filename = input;

  // Jika input berupa angka, ambil file sesuai indeksnya
  if (/^\d+$/.test(input)) {
    const index = parseInt(input, 10) - 1;
    if (index < 0 || index >= files.length) {
      return reply(`Nomor file tidak valid. Pilih angka antara *1* sampai *${files.length}*.`);
    }
    filename = files[index];
  } else if (!filename.toLowerCase().endsWith(".js")) {
    filename += ".js";
  }

  if (!/^[A-Za-z0-9._-]+\.js$/i.test(filename)) {
    return reply("Nama file tidak valid. Hanya file .js di folder debug yang boleh dijalankan.");
  }

  const filepath = path.join(debugDir, filename);
  if (!fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) {
    return reply(`File *${filename}* tidak ditemukan di folder debug.`);
  }

  const code = fs.readFileSync(filepath, "utf8");

  try {
    const execute = new AsyncFunction(
      "sock",
      "m",
      "reply",
      "text",
      "usedPrefix",
      "util",
      code
    );

    const result = await execute(sock, m, reply, text, usedPrefix, util);
    if (result !== undefined) {
      const output = typeof result === "string" ? result : util.inspect(result, { depth: 4 });
      await reply(`Hasil eksekusi (*${filename}*):\n${output}`);
    }
  } catch (error) {
    console.error(`[RUN] Gagal menjalankan ${filename}:`, error);
    return reply(`❌ Gagal menjalankan *${filename}*:\n${error.message || error}`);
  }
};

handler.help = ["run [nomor/nama-file]"];
handler.tags = ["owner"];
handler.command = ["run", "runfile"];
handler.owner = true;

export default handler;