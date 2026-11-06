/*
  ** ubah sticker menjadi gambar/foto
*/

import fs from "fs";
import { exec } from "child_process";
import { fileTypeFromBuffer } from "file-type";
import path from "path";

const handler = async (m, { sock, command, reply }) => {
  
  const quoted = m.quoted || m;
  const mime = quoted.mimetype || "";

  if (!quoted) return reply("Reply sticker yang mau dikonversi!");
  if (!/webp/.test(mime)) return reply(`Balas stiker dengan caption *${prefix + command}*`);

  const mediaPath = await sock.downloadAndSaveMediaMessage(quoted);
  const outputPath = getRandom(".png");

  exec(`ffmpeg -i ${mediaPath} ${outputPath}`, async (err) => {
    fs.unlinkSync(mediaPath);
    if (err) {
      console.error(err);
      return reply("Gagal mengonversi stiker ke gambar!");
    }

    try {
      const buffer = fs.readFileSync(outputPath);
      await sock.sendMessage(
        m.chat,
        { image: buffer, caption: "*Berhasil dikonversi ke gambar!*" },
        { quoted: m }
      );
    } catch (e) {
      console.error(e);
      reply("Terjadi kesalahan saat mengirim gambar.");
    } finally {
      fs.unlinkSync(outputPath);
    }
  });
};

handler.command = ["toimage", "toimg"];
export default handler;