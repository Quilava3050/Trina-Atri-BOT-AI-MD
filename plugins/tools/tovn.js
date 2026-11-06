import fs from "fs"
import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"
import { fileURLToPath } from "url"
import { randomUUID } from "crypto"
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"
import { generateWaveform } from "../../control/lib/audio-waveform.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execFileAsync = promisify(execFile)

const handler = async (m, { sock, reply, example }) => {
  
  const quoted = m.quoted ? m.quoted : m
  const mime = (quoted.msg || quoted).mimetype || ""
  
  if (!/audio|video/.test(mime))
    return reply(example("reply ke video atau audio yang ingin dijadikan VN"))

  reply("Wait...")

  let mediaPath;
  let outPath;
  try {
    mediaPath = await sock.downloadAndSaveMediaMessage(quoted)
    outPath = path.join(__dirname, `temp_${randomUUID()}.ogg`)

    await execFileAsync(ffmpegInstaller.path, [
      "-y", "-i", mediaPath, "-vn", "-c:a", "libopus", "-b:a", "64k",
      "-ac", "1", "-ar", "48000", "-map_metadata", "-1", outPath
    ], { maxBuffer: 10 * 1024 * 1024 })

    const fileBuffer = fs.readFileSync(outPath)

    const waveformArray = await generateWaveform(fileBuffer)

    await sock.sendMessage(
      m.chat,
      {
        audio: { url: outPath },
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
        waveform: waveformArray 
      },
      { quoted: m }
    )

  } catch (err) {
    console.error("[TOVN] Gagal mengonversi audio:", err.stderr?.trim().slice(-2000) || err)
    reply("Gagal mengonversi ke VN.")
  } finally {
    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath)
    if (outPath && fs.existsSync(outPath)) fs.unlinkSync(outPath)
  }
}

handler.command = ["toptt", "tovn", "tovoicenote"]
export default handler