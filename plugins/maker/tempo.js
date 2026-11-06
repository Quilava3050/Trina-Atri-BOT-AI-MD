import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const runFFmpeg = (inputPath, outputPath, speed) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilter([
        `asetrate=48000*${speed}`,
        "aresample=48000"             // FIX WAJIB: biar audio balance & tidak rusak
      ])
      .on('error', (err) => {
        console.error('FFmpeg Error:', err.message);
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
};

const handler = async (m, { sock, text, usedPrefix, command }) => {
  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || q.mediaType || '';

  if (!/audio/.test(mime)) return m.reply(`*How to use:*
- *${usedPrefix + command} <kecepatan>*

*Example:*
- *${usedPrefix + command} 0.8* (untuk memperlambat)
- ${usedPrefix + command} 1.5* (untuk mempercepat)

Angka di bawah 1 memperlambat, di atas 1 mempercepat. Range: 0.5 - 2.0
Reply audio nya juga`);

  const speed = parseFloat(text);
  if (isNaN(speed)) {
    return m.reply(`Harap masukkan angka kecepatan yang valid.\nContoh: *${usedPrefix + command} 0.8*`);
  }

  if (speed < 0.5 || speed > 2.0) {
    return m.reply('Kecepatan harus berada di antara 0.5 dan 2.0 untuk menjaga kualitas audio.');
  }

  await m.reply('Sedang memproses audio, mohon tunggu...');

  // download buffer
  const media = await q.download();

  // buat folder temp
  const tempDir = path.join(tmpdir(), 'wa-bot-temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  // deteksi extension sesuai mimetype
  const ext = mime.includes("ogg") || mime.includes("opus") ? ".opus" : ".mp3";

  const id = randomUUID();
  const inputPath = path.join(tempDir, `input_${id}${ext}`);
  const outputPath = path.join(tempDir, `output_${id}.mp3`);

  fs.writeFileSync(inputPath, media);

  try {
    await runFFmpeg(inputPath, outputPath, speed);

    // Baileys terbaru → kirim lewat sendMessage, bukan sendFile
    await sock.sendMessage(m.chat, {
      audio: fs.readFileSync(outputPath),
      mimetype: "audio/mpeg",
      fileName: "result.mp3",
      ptt: false
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply(`Terjadi kesalahan saat memproses audio: ${e.message}`);
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
};

handler.command = ["tempo", "tm"];
export default handler;