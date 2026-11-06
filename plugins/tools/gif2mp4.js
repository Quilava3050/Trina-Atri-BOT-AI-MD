import fs from 'fs/promises'
import path from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

const execFileAsync = promisify(execFile)

const handler = async (m, { sock, usedPrefix, command }) => {
  const mediaMessage = m.quoted || m
  const mediaType = mediaMessage.mtype || ''
  const supportedTypes = ['imageMessage', 'videoMessage', 'stickerMessage']

  if (!supportedTypes.includes(mediaType)) {
    return m.reply(`Reply GIF atau stiker animasi dengan ${usedPrefix + command}.`)
  }

  let inputPath
  let outputPath

  try {
    const input = await mediaMessage.download()
    if (!input?.length) throw new Error('Media tidak berhasil diunduh.')

    const tempId = randomUUID()
    inputPath = path.join(tmpdir(), `gif2mp4-${tempId}.input`)
    outputPath = path.join(tmpdir(), `gif2mp4-${tempId}.mp4`)
    await fs.writeFile(inputPath, input)

    await execFileAsync(ffmpegInstaller.path, [
      '-y',
      '-i', inputPath,
      '-an',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
      '-movflags', '+faststart',
      '-c:v', 'libx264',
      outputPath
    ])

    const video = await fs.readFile(outputPath)
    await sock.sendMessage(m.chat, {
      video,
      mimetype: 'video/mp4',
      caption: 'Konversi GIF ke MP4 selesai.'
    }, { quoted: m })
  } catch (error) {
    console.error('[GIF2MP4] Conversion failed:', error)
    await m.reply(`Gagal mengonversi media ke MP4: ${error.message || error}`)
  } finally {
    await Promise.all([
      inputPath && fs.rm(inputPath, { force: true }),
      outputPath && fs.rm(outputPath, { force: true })
    ].filter(Boolean))
  }
}

handler.help = ['gif2mp4']
handler.tags = ['tools']
handler.command = ['gif2mp4', 'togifmp4']

export default handler
