// lib/converter.js
import { promises as fs } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    const tmp = join(global.__dirname(import.meta.url), '../tmp', Date.now() + '.' + ext)
    const out = tmp + '.' + ext2

    try {
      await fs.writeFile(tmp, buffer)

      const ff = spawn('ffmpeg', [
        '-y',
        '-i', tmp,
        '-vn',
        ...args,
        out
      ])

      let stderr = ''
      ff.stderr.on('data', (chunk) => (stderr += chunk.toString()))

      ff.on('error', async (err) => {
        await fs.unlink(tmp).catch(() => {})
        reject(err)
      })

      ff.on('close', async (code) => {
        await fs.unlink(tmp).catch(() => {})
        if (code !== 0) {
          console.error('❌ FFmpeg Error:\n', stderr)
          return reject(new Error(`FFmpeg exited with code ${code}`))
        }
        try {
          const data = await fs.readFile(out)
          resolve({
            data,
            filename: out,
            async delete() {
              await fs.unlink(out).catch(() => {})
            }
          })
        } catch (e) {
          reject(e)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Convert Audio to Playable WhatsApp PTT (voice note)
 */
function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:a', 'libopus',
    '-b:a', '64k',
    '-ar', '48000',
    '-ac', '1',           // Mono — biar bisa diputar di WhatsApp
    '-vbr', 'on',
    '-compression_level', '10',
    '-f', 'opus'
  ], ext, 'ogg')
}

/**
 * Convert Audio to WhatsApp-compatible Audio (music, etc)
 */
function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-ar', '48000',
    '-ac', '2',
    '-vbr', 'on',
    '-compression_level', '10',
    '-f', 'opus'
  ], ext, 'opus')
}

/**
 * Convert Video to WhatsApp-compatible MP4
 */
function toVideo(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-crf', '28',
    '-preset', 'veryfast',
    '-movflags', '+faststart'
  ], ext, 'mp4')
}

export {
  toAudio,
  toPTT,
  toVideo,
  ffmpeg,
}
