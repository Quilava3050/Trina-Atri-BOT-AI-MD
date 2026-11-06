import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

const execFileAsync = promisify(execFile);
const AUDIO_PATH = path.join(process.cwd(), "media", "udah-gede-nyari-esce.mp3");

const handler = async (m, { sock, reply }) => {
  if (!fs.existsSync(AUDIO_PATH)) {
    throw new Error(`Audio file tidak ditemukan: ${AUDIO_PATH}`);
  }

  const tempDir = path.join(process.cwd(), "temp");
  const outputPath = path.join(tempDir, `sc_${randomUUID()}.ogg`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  try {
    await execFileAsync(ffmpegInstaller.path, [
      "-y",
      "-i", AUDIO_PATH,
      "-vn",
      "-c:a", "libopus",
      "-b:a", "64k",
      "-ac", "1",
      "-ar", "48000",
      "-application", "voip",
      "-map_metadata", "-1",
      outputPath
    ], { maxBuffer: 10 * 1024 * 1024 });

    const audio = await fs.promises.readFile(outputPath);
    await sock.sendMessage(m.chat, {
      audio,
      mimetype: "audio/ogg; codecs=opus",
      ptt: true
    }, { quoted: m });
  } catch (error) {
    console.error("[SC] Gagal mengirim audio sebagai voice note:", error.stderr?.trim().slice(-2000) || error);
    await reply("❌ Gagal mengirim audio sebagai voice note.");
  } finally {
    await fs.promises.rm(outputPath, { force: true });
  }
};

handler.command = ["sc"];
handler.help = ["sc"];
handler.tags = ["main"];

export default handler;
