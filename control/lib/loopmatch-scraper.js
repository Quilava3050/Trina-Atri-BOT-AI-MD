// Isolated browser renderer for Loop Match.
import { execFile } from 'child_process'
import { promisify } from 'util'
import fsp from 'fs/promises'
import os from 'os'
import path from 'path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
 
const execFileAsync = promisify(execFile)
 
const SITE_URL = 'https://www.textmatchcut.app/'
const CUTS_PER_SECOND = 12
const ZOOM_LEVEL = 1.5
const BLUR_LEVEL = 1.0
const FPS = 30
 
let renderQueue = Promise.resolve()
 
function enqueue(task) {
  const run = renderQueue.then(task, task)
  renderQueue = run.catch(() => {})
  return run
}
 
async function launchBrowser() {
  try {
    const executablePath = await chromium.executablePath()
    return await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
      defaultViewport: { width: 1280, height: 2000 }
    })
  } catch (error) {
    if (error?.code === 'ENOSPC') {
      throw new Error(
        'Ruang disk server penuh saat mengekstrak Chromium ke direktori sementara (biasanya /tmp). Kosongkan atau tambah storage server, lalu restart bot.',
        { cause: error }
      )
    }

    throw new Error(
      `Gagal menjalankan Chromium bawaan. Pastikan paket @sparticuz/chromium terpasang dan server menggunakan Linux x64: ${error.message}`,
      { cause: error }
    )
  }
}

async function waitForSite(page) {
  try {
    await page.waitForFunction(
      () => typeof buildDescs === 'function' &&
        typeof renderCut === 'function' &&
        typeof lensBlur === 'function' &&
        typeof SFX === 'object' &&
        typeof VideoEncoder === 'function',
      { timeout: 40_000 }
    )
  } catch (error) {
    throw new Error(`Editor textmatchcut gagal dimuat: ${error.message}`, { cause: error })
  }
}
 
async function renderOnSite({ keyword, ratio, sound }) {
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'textmatch-'))
  let browser = null
 
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await waitForSite(page)

    const browserScript = async (keyword, ratio, sound, cps, zoomLevel, blurLevel, FPS) => {
const holdMs = 380;
    const sizes = { '9:16': { w: 1080, h: 1920 }, '1:1': { w: 1080, h: 1080 }, '16:9': { w: 1920, h: 1080 } };
    const { w: W, h: H } = sizes[ratio];
    await Promise.all(['bold', '', 'bold italic', 'italic'].map((weight) =>
      document.fonts.load(String(weight + ' ' + Math.round(H * 0.04) + 'px "Playfair Display"').replace(/\s+/g, ' ').trim())
    ));
    await document.fonts.ready;
 
    const fpc = Math.max(1, Math.round(FPS / cps));
    const nCuts = Math.min(Math.ceil(cps * 4), 60);
    const holdFrames = Math.round((holdMs / 1000) * FPS);
    const total = nCuts * fpc + holdFrames;
    const descs = buildDescs(nCuts, keyword, W, H, zoomLevel);
    const CW = 2 * W;
    const CH = 2 * H;
 
    const flat = document.createElement('canvas');
    flat.width = CW;
    flat.height = CH;
    const fCtx = flat.getContext('2d');
    const cut = document.createElement('canvas');
    cut.width = CW;
    cut.height = CH;
    const cCtx = cut.getContext('2d');
    const main = document.createElement('canvas');
    main.width = W;
    main.height = H;
    const mCtx = main.getContext('2d');
 
    const config = {
      codec: 'avc1.640028',
      width: W,
      height: H,
      bitrate: 8000000,
      framerate: FPS,
      avc: { format: 'annexb' },
      latencyMode: 'quality'
    };
    const support = await VideoEncoder.isConfigSupported(config);
    if (!support.supported) throw new Error('encoder video tidak mendukung h264');
 
    const chunks = [];
    let encoderError = null;
    const encoder = new VideoEncoder({
      output: (chunk) => {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        chunks.push(data);
      },
      error: (error) => {
        encoderError = error;
      }
    });
    encoder.configure(config);
 
    let lastCut = -1;
    for (let frameIndex = 0; frameIndex < total; frameIndex++) {
      const cutIndex = Math.min(Math.floor(frameIndex / fpc), nCuts - 1);
      if (cutIndex !== lastCut) {
        lastCut = cutIndex;
        const desc = descs[cutIndex];
        renderCut(fCtx, desc, CW, CH);
        cCtx.clearRect(0, 0, CW, CH);
        lensBlur(cCtx, flat, desc.focalCx, desc.focalCy, desc.focalR, CW, CH, blurLevel);
      }
 
      const desc = descs[cutIndex];
      const scale = desc.zoomScale;
      mCtx.save();
      mCtx.translate(W / 2, H / 2);
      mCtx.scale(scale, scale);
      mCtx.drawImage(cut, -W, -H);
      mCtx.restore();
 
      const frame = new VideoFrame(main, {
        timestamp: Math.round((frameIndex * 1000000) / FPS),
        duration: Math.round(1000000 / FPS)
      });
      encoder.encode(frame, { keyFrame: frameIndex % FPS === 0 });
      frame.close();
      if (encoderError) throw encoderError;
      while (encoder.encodeQueueSize > 4) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        if (encoderError) throw encoderError;
      }
    }
 
    await encoder.flush();
    encoder.close();
    if (encoderError) throw encoderError;
 
    const videoSize = chunks.reduce((size, chunk) => size + chunk.length, 0);
    const video = new Uint8Array(videoSize);
    let offset = 0;
    for (const chunk of chunks) {
      video.set(chunk, offset);
      offset += chunk.length;
    }
 
    let audio = null;
    if (sound !== 'none') {
      const duration = total / FPS;
      const sampleRate = 48000;
      const audioContext = new OfflineAudioContext(1, Math.ceil(sampleRate * duration), sampleRate);
      const gain = audioContext.createGain();
      gain.gain.value = 0.7;
      gain.connect(audioContext.destination);
      for (let cutIndex = 0; cutIndex < nCuts; cutIndex++) {
        const at = (cutIndex * fpc) / FPS + 0.016;
        (SFX[sound] || SFX.none)(audioContext, gain, at);
      }
      const rendered = await audioContext.startRendering();
      const samples = rendered.getChannelData(0);
      const wav = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(wav);
      const write = (wavOffset, text) => {
        for (let index = 0; index < text.length; index++) view.setUint8(wavOffset + index, text.charCodeAt(index));
      };
      write(0, 'RIFF');
      view.setUint32(4, 36 + samples.length * 2, true);
      write(8, 'WAVE');
      write(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      write(36, 'data');
      view.setUint32(40, samples.length * 2, true);
      for (let index = 0; index < samples.length; index++) {
        const value = Math.max(-1, Math.min(1, samples[index]));
        view.setInt16(44 + index * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
      }
      const bytes = new Uint8Array(wav);
      let binary = '';
      const chunkSize = 0x8000;
      for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunkSize));
      }
      audio = btoa(binary);
    }
 
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < video.length; index += chunkSize) {
      binary += String.fromCharCode.apply(null, video.subarray(index, index + chunkSize));
    }
    return { ok: true, frames: total, audio, video: btoa(binary) };
}
    const result = await page.evaluate(
      browserScript,
      keyword,
      ratio,
      sound,
      CUTS_PER_SECOND,
      ZOOM_LEVEL,
      BLUR_LEVEL,
      FPS
    )
 
    if (!result?.ok) throw new Error(result?.error || 'render video gagal')
    if (!result.video) throw new Error('hasil render video kosong')
 
    const videoPath = path.join(tempDir, 'video.h264')
    const audioPath = path.join(tempDir, 'audio.wav')
    const outputPath = path.join(tempDir, 'result.mp4')
    await fsp.writeFile(videoPath, Buffer.from(result.video, 'base64'))
 
    const hasAudio = Boolean(result.audio)
    if (hasAudio) {
      await fsp.writeFile(audioPath, Buffer.from(result.audio, 'base64'))
    }
 
    const ffmpegArgs = [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'h264',
      '-r',
      String(FPS),
      '-i',
      videoPath,
      ...(hasAudio ? ['-i', audioPath] : []),
      '-map',
      '0:v:0',
      ...(hasAudio ? ['-map', '1:a:0'] : []),
      '-vf',
      'scale=in_range=full:out_range=limited,format=yuv420p',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-profile:v',
      'high',
      '-color_range',
      'tv',
      ...(hasAudio ? ['-c:a', 'aac', '-b:a', '128k', '-ac', '1', '-ar', '48000', '-shortest'] : []),
      '-movflags',
      '+faststart',
      '-map_metadata',
      '-1',
      outputPath
    ]
 
    await execFileAsync(ffmpegInstaller.path, ffmpegArgs, {
      timeout: 180_000,
      maxBuffer: 4 * 1024 * 1024
    })
 
    const buffer = await fsp.readFile(outputPath)
    if (!buffer.length) throw new Error('hasil video kosong')
 
    return buffer
  } finally {
    if (browser) await browser.close()
    await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}
 
export const renderLoopmatch = (options) =>
  enqueue(() => renderOnSite(options))