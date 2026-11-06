import fs from "fs"
import ffmpeg from "fluent-ffmpeg"
import path from "path"
import { fileURLToPath } from "url"
import { randomUUID } from "crypto"
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"
import { generateWaveform } from "../../control/lib/audio-waveform.js"
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const handler = async (m, { sock, reply, text, example }) => {
  let tmpInput
  let tmpOutput

  try {
    if (!global.idChannel) return reply("global.idChannel belum diisi!")

    const q = m.quoted ? m.quoted : m
    const mime = q.mimetype || ""

    // ContextInfo pengganti extAd yang ringan dan rapi khusus Channel
    const contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: global.idChannel,
        serverMessageId: 1,
        newsletterName: global.versiBot || "Official Channel"
      }
    }

    // 1. Kirim Pesan Teks
    if (!mime) {
      if (!text) return reply(example("pesannya (support audio/foto/video)"))
      await sock.sendMessage(
        global.idChannel,
        {
          text,
          contextInfo
        }
      )
      return reply("Succes send to channel!")
    }

    // 2. Kirim Gambar
    if (/image/.test(mime)) {
      reply("Wait...")
      const img = await q.download()

      await sock.sendMessage(
        global.idChannel,
        {
          image: img,
          caption: text || "",
          contextInfo
        }
      )

      return reply("Succes send to channel!")
    }

    // 3. Kirim Video
    if (/video/.test(mime)) {
      reply("Wait...")
      const vid = await q.download()

      await sock.sendMessage(
        global.idChannel,
        {
          video: vid,
          caption: text || "",
          mimetype: "video/mp4",
          contextInfo
        }
      )

      return reply("Succes send to channel!")
    }

    // 4. Kirim Audio / Voice Note
    if (/audio/.test(mime)) {
      reply("Wait...")
      const media = await q.download()

      const id = randomUUID()
      tmpInput = path.join(__dirname, `temp_input_${id}.mp3`)
      tmpOutput = path.join(__dirname, `temp_output_${id}.ogg`)

      fs.writeFileSync(tmpInput, media)

      await new Promise((resolve, reject) => {
        ffmpeg(tmpInput)
          .toFormat("ogg")
          .audioCodec("libopus")
          .on("end", resolve)
          .on("error", reject)
          .save(tmpOutput)
      })

      const converted = fs.readFileSync(tmpOutput)
      const waveformArray = await generateWaveform(converted)

      await sock.sendMessage(global.idChannel, {
        audio: converted,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
        waveform: waveformArray,
        contextInfo
      })

      return reply("Succes send to channel!")
    }

    reply("⚠️ Jenis file tidak didukung.")

  } catch (err) {
    console.error(err)
    reply("❌ Gagal mengirim ke channel!")
  } finally {
    if (tmpInput && fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput)
    if (tmpOutput && fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput)
  }
}

handler.command = ["upch"]
handler.owner = true

export default handler