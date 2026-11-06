import fs  from "fs"
import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"
import { fileURLToPath } from "url"
import { randomUUID } from "crypto"
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execFileAsync = promisify(execFile)

const handler = async (m, { sock, reply, example }) => {
  
  const quoted = m.quoted ? m.quoted : m;
  const mime = (quoted.msg || quoted).mimetype || "";
  if (!/video|audio/.test(mime)) return reply(example("reply ke video/audio yang ingin dijadikan MP3"));

  reply("Wait. . .");

  let mediaPath;
  let outPath;
  try {
    mediaPath = await sock.downloadAndSaveMediaMessage(quoted);
    outPath = path.join(__dirname, `temp_${randomUUID()}.mp3`);

    await execFileAsync(ffmpegInstaller.path, [
      "-y", "-i", mediaPath, "-vn", "-ar", "44100", "-ac", "2", "-b:a", "192k", outPath
    ], { maxBuffer: 10 * 1024 * 1024 });

    await sock.sendMessage(
      m.chat,
      {
        audio: { url: outPath },
        mimetype: "audio/mpeg",
        fileName: "audio.mp3",
      },
      { quoted: m }
    );
  } catch (err) {
    console.error("[TOMP3] Gagal mengonversi audio:", err.stderr?.trim().slice(-2000) || err);
    reply("❌ Gagal mengonversi video ke audio. Coba lagi nanti.");
  } finally {
    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
    if (outPath && fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }
};

handler.command = ["tomp3", "toaudio"];
export default handler;