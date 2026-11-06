process.on("uncaughtException", (err) => {
  console.error("Caught exception:", err);
});

import "./settings.js";
import "./control/function.js";

import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadContentFromMessage,
  makeInMemoryStore,
  jidDecode,
  delay,
  Browsers,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

import fs from "fs";
import chalk from "chalk";
import { fileURLToPath, pathToFileURL } from "url";
import pkg from "cfonts";
const { say } = pkg;
import pino from 'pino';
import { Boom } from '@hapi/boom';
import path from "path";
import qrcode from "qrcode-terminal";
import { fileTypeFromBuffer } from "file-type";
import os from 'os';
import nou from 'node-os-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { plugins_handler, owners } from "./handler.js"; 
import { loadPlugins, startWatcher } from "./control/plugins.js";

const tio = nou.os.oos();
const tot = nou.drive.info();
const memInfo = nou.mem.info();
const totalGB = (memInfo.totalMemMb / 1024).toFixed(2);
const usedGB = (memInfo.usedMemMb / 1024).toFixed(2);
const freeGB = (memInfo.freeMemMb / 1024).toFixed(2);
const cpuCores = os.cpus().length;
const vpsUptime = runtime(os.uptime());

import { imageToWebp, videoToWebp, writeExifImg, writeExifVid } from './control/webp.js';
import WelcomeMessage from "./event/welcome.js";
import ConfigBaileys from "./control/config.js";
import checkGame from './control/game.js';
import { startAutoSholat } from './control/autosholat.js';
import { startAutoBerita } from './control/autoberita.js';
import { startAutoMotivasi } from './control/automotivasi.js';
import { startAutoEvent } from './control/autoEvent.js';
import { downloadTikTok } from './control/lib/tiktok.js';
import { downloadInstagram } from './control/lib/instagram.js';
import { downloadFacebook } from './control/lib/facebook.js';
import { downloadTwitter } from './control/lib/twitterX.js';
import { downloadPinterest } from './control/lib/pinterest.js';
import { downloadThreads } from './control/lib/threads.js';
import { downloadScribd } from './control/lib/scribd.js';
import { downloadVidey } from './control/lib/videy.js';
import { describeAutoDownloadError, findAutoDownloadUrl } from './control/lib/auto-download.js';
import { handleTriggerTrina } from './control/TriggerTrina.js';
import { startInitiativeScheduler } from './control/initiative.js';
import handleAiTag from './control/ai-tag.js';
import { captureGroupMessage } from './control/lib/msgstore.js';
import { captureAntiDeleteMessage, restoreAntiDeleteMessage } from './control/antidelete.js';

const downloadCache = new Set();
import { initDb, getSettings, getGroup } from './control/database.js';
import { isChatBanned } from './control/banned-chats.js';
import { attachOfferCall } from './control/offer-call.js';

// ** sistem database ** //
await initDb();
const botSet = await getSettings();
const settingEnabled = (value) => value === 1 || value === true || value === '1';
global.public = settingEnabled(botSet.public);
global.triggerTrinaEnabled = botSet.triggerTrina !== 0;
global.prefix = botSet.prefix;
global.multiprefix = settingEnabled(botSet.multiprefix);
global.autoread = settingEnabled(botSet.autoread);
global.readsw = settingEnabled(botSet.readsw);
global.reactsw = settingEnabled(botSet.reactsw);
global.grupreact = settingEnabled(botSet.grupreact);
global.grupstickerreact = settingEnabled(botSet.grupstickerreact);
global.anticall = settingEnabled(botSet.anticall);
global.autotyping = settingEnabled(botSet.autotyping); 
global.db = { users: {}, groups: {}, settings: {} };

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
const pairingCode = true;
const pairingState = { lastRequest: 0, inFlight: false, retryCount: 0 };
const reconnectState = { attempts: 0, lastReconnectAt: 0 };

async function requestPairingSafe(sock, number, customPair = null) {
  const now = Date.now();
  if (pairingState.inFlight && now - pairingState.lastRequest < 30000) return null;

  pairingState.inFlight = true;
  pairingState.lastRequest = now;

  try {
    const code = customPair
      ? await sock.requestPairingCode(number, customPair)
      : await sock.requestPairingCode(number);

    pairingState.retryCount = 0;
    return code;
  } catch (err) {
    pairingState.retryCount += 1;
    if (pairingState.retryCount >= 2) {
      console.warn("[PAIRING] Request pairing gagal berulang, menunggu cooldown sebelum mencoba lagi.");
      pairingState.lastRequest = now + 60000;
    }
    throw err;
  } finally {
    pairingState.inFlight = false;
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('Auth');
  const { version: v } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    version: v,
    browser: Browsers.ubuntu("Chrome"),
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg.message || undefined;
      }
      return sock;
    },
    logger: pino({ level: "silent" })
  });
  attachOfferCall(sock);
  global.conn = sock;
  global.sock = sock;
  let pairingRequested = false;
  let pairingTimer = null;

  store?.bind(sock.ev);
  sock.store = store;
  console.clear();

  sock.ev.on('creds.update', saveCreds);

  // ── Connection Update ─────────────────────────────────────────
  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (!connection) return;

    if (connection === "connecting") {
      if (pairingCode) {
        console.log(chalk.cyan("[PAIRING] Mode pairing code aktif. Masukkan kode pairing di WA kamu."));
      }
      if (qr && !pairingCode) {
        console.log("Scan QR ini di WhatsApp:");
        qrcode.generate(qr, { small: true });
      }

      if (!sock.authState.creds.registered && !pairingRequested && !pairingTimer) {
        const number = String(global?.pairing?.number || "6281399797379").replace(/\D/g, "");
        const customPair = global?.pairing?.customCode || null;

        pairingTimer = setTimeout(async () => {
          pairingTimer = null;
          if (pairingRequested || sock.authState.creds.registered) return;

          pairingRequested = true;
          console.log(chalk.yellow(`[PAIRING] Meminta kode pairing untuk nomor: ${number}...`));

          try {
            const code = await requestPairingSafe(sock, number, customPair);
            if (code) {
              console.log(chalk.cyan(`🔑 Kode Pairing${customPair ? " Kustom" : ""}: ${code}`));
            }
          } catch (err) {
            pairingRequested = false;
            console.error("[PAIRING] Error request pairing code:", err);
          }
        }, 5000);
      }
    }

    if (connection === "close") {
      if (pairingTimer) {
        clearTimeout(pairingTimer);
        pairingTimer = null;
      }

      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const disconnectError = lastDisconnect?.error;
      const errorMessage = disconnectError?.message || disconnectError?.output?.payload?.message || '';
      console.error("[CONNECTION CLOSED] Reason:", reason || disconnectError);
      if (reason === 405) {
        console.error("[CONNECTION CLOSED] Server menolak handshake (405). Cek kompatibilitas versi Baileys/session Auth.");
      }

      const retryDelay = Math.min(3000 * (reconnectState.attempts + 1), 20000);
      reconnectState.attempts += 1;

      if (reconnectState.attempts > 3) {
        console.warn("[RECONNECT] Sudah melewati batas retry aman. Bot berhenti auto reconnect untuk mencegah request ulang berlebihan.");
        return;
      }

      switch (reason) {
        case DisconnectReason.badSession:
        case 401:
          console.log("Bad Session / Unauthorized. Menghapus folder Auth...");
          if (fs.existsSync('Auth')) {
            fs.rmSync('Auth', { recursive: true, force: true });
          }
          await delay(retryDelay);
          await startBot();
          break;
        case 405:
        case 428:
          console.warn(`[CONNECTION] Server menutup socket (${reason}${errorMessage ? `: ${errorMessage}` : ''}). Tidak menghapus Auth dan menunggu sebelum mencoba ulang.`);
          await delay(30000);
          await startBot();
          break;
        case DisconnectReason.connectionClosed:
          console.log("[SYSTEM] Connection closed, reconnecting...");
          await delay(retryDelay);
          await startBot();
          break;
        case DisconnectReason.connectionLost:
          console.log("[SYSTEM] Connection lost, trying to reconnect...");
          await delay(retryDelay);
          await startBot();
          break; 
        case DisconnectReason.restartRequired:
          console.log("Restart Required...");
          await delay(retryDelay);
          await startBot();
          break; 
        case DisconnectReason.loggedOut:
          console.log("Device Logged Out. Menghapus folder Auth...");
          if (fs.existsSync('Auth')) {
            fs.rmSync('Auth', { recursive: true, force: true });
          }
          process.exit();
          break;
        case DisconnectReason.timedOut:
          console.log("Connection TimedOut, Reconnecting...");
          await delay(retryDelay);
          await startBot();
          break; 
        default:
          await delay(retryDelay);
          await startBot(); 
      }
    } else if (connection === "open") {
      reconnectState.attempts = 0;
      reconnectState.lastReconnectAt = Date.now();
      console.clear();
      startWatcher();
      startInitiativeScheduler(sock);
      
      console.log(chalk.gray('  [ » ] Memuat plugins...'));
      const loaded = await loadPlugins();
      console.log(chalk.green(`  [ ✓ ] Plugins  — ${loaded.length} plugin berhasil dimuat.`));

      console.log(chalk.gray('  [ » ] Memuat database...'));
      await delay(1000);
      console.log(chalk.green(`  [ ✓ ] Database — Berhasil dimuat.\n`));

      // Info Box Server
      nou.mem.info().then(memInfo => {
        const totalGB = (memInfo.totalMemMb / 1024).toFixed(2);
        const usedGB  = (memInfo.usedMemMb  / 1024).toFixed(2);
        const freeGB  = (memInfo.freeMemMb  / 1024).toFixed(2);

        nou.drive.info().then(tot => {
          const line = chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          console.log(line);
          console.log(chalk.magenta.bold('  📜  Script Information'));
          console.log(line);
          console.log(chalk.white(`  › Name       : ${global.namaBot}`));
          console.log(chalk.white(`  › Developer  : ${global.namaOwner}`));
          console.log(chalk.white(`  › Version    : ${global.versiBot}`));
          console.log(chalk.white(`  › Type       : Plugins (ESM)`));
          console.log(chalk.white(`  › Prefix     : ${global.prefix || '.'}`));
          console.log(line);
          console.log(chalk.blue.bold('  🖥️   Server Information'));
          console.log(line);
          console.log(chalk.white(`  › OS         : ${nou.os.type()}`));
          console.log(chalk.white(`  › CPU        : ${os.cpus()[0].model}`));
          console.log(chalk.white(`  › CPU Cores  : ${cpuCores} core(s)`));
          console.log(chalk.white(`  › RAM        : ${usedGB} / ${totalGB} GB  (free: ${freeGB} GB)`));
          console.log(chalk.white(`  › Disk       : ${tot.usedGb} / ${tot.totalGb} GB`));
          console.log(chalk.white(`  › Uptime VPS : ${vpsUptime}`));
          console.log(line);
          console.log(chalk.green.bold('  ✅  Bot connected & ready to use!'));
          console.log(line);
        });
      });

    }
  });

  // ── Message Handler ───────────────────────────────────────────
  sock.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      if (chatUpdate.type === 'notify' || chatUpdate.type === 'append') {
        for (const storedMessage of chatUpdate.messages || []) {
          if (!storedMessage.message || !storedMessage.key?.remoteJid?.endsWith('@g.us')) continue;
          if (storedMessage.message.protocolMessage) continue;
          try {
            await captureGroupMessage(sock, storedMessage);
          } catch (err) {
            console.error('[MSGSTORE] Gagal menyimpan pesan grup:', err);
          }
          try {
            const group = await getGroup(storedMessage.key.remoteJid);
            await captureAntiDeleteMessage(sock, storedMessage, group.antidelete === 1);
          } catch (err) {
            console.error('[ANTIDELETE] Gagal menyimpan pesan grup:', err);
          }
        }
      }
      if (chatUpdate.type !== 'notify') return;
      const msg = chatUpdate.messages[0];
      if (!msg.message) return;
      if (msg.message.protocolMessage) return;
      const m = await ConfigBaileys(sock, msg);

      if (m.isGroup && !msg.key.fromMe) {
        const group = await getGroup(m.chat);
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNumber = String(sender || '').split('@')[0].split(':')[0].replace(/\D/g, '');
        const ownerNumbers = [...new Set([
          ...(global.owner || []),
          ...(owners || [])
        ])].map((owner) =>
          String(owner).split('@')[0].split(':')[0].replace(/\D/g, '')
        );
        const isOwnerSender = Boolean(msg.key.fromMe) || ownerNumbers.includes(senderNumber);

        if (group.antifoto === 1 && !isOwnerSender && msg.message?.imageMessage) {
          try {
            await sock.sendMessage(m.chat, { delete: msg.key });
          } catch (error) {
            console.error('[ANTIFOTO] Gagal menghapus foto:', error);
          }
          return;
        }
      }

      if (msg.key.remoteJid === "status@broadcast") {
        return; 
      }
      
      if (global.autoread && !m.key.fromMe) {
        await sock.readMessages([m.key]);
      }
      
      const isOwner = await plugins_handler(m, sock, chatUpdate);
      if (m.isGroup && isChatBanned(m.chat) && !isOwner) return;

      await checkGame(m, sock);

      const body = m.text || m.caption || m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.msg?.text || '';
      const isPluginCommand = /^[\.!\/#$%^&*]/.test(body.trim());
      const autoDownloadUrl = findAutoDownloadUrl(body);

      const aiTagHandled = await handleAiTag(m, { sock, isOwner });
      if (aiTagHandled) return;

    // --- Auto DL & Trigger Handler ---
    // Deteksi apakah pesan mengandung media gambar (agar Trina Vision tetap jalan walau tanpa prefix/caption)
    const isImage = m.mtype === 'imageMessage' || (m.quoted && m.quoted.mtype === 'imageMessage') || /image/g.test(m.msg?.mimetype || m.quoted?.msg?.mimetype || '');

    // Jika bukan command plugin, jalankan AI Trina/Atri
    if (!autoDownloadUrl && !isPluginCommand && global.triggerTrinaEnabled && await handleTriggerTrina(m, sock, isOwner)) return;

    if (body && !body.startsWith('.') && !body.startsWith('!') && !body.startsWith('/')) {

      const url = autoDownloadUrl;
      if (url) {
        const cacheKey = `${m.chat}_${url}`;
        if (!downloadCache.has(cacheKey)) {
          downloadCache.add(cacheKey);
          setTimeout(() => downloadCache.delete(cacheKey), 10000);

          await sock.sendMessage(m.chat, { text: 'Media terdeteksi, sedang memproses download...' }, { quoted: m });

          const platform = /tiktok\.com|douyin\.com/i.test(url) ? 'TikTok'
            : /instagram\.com/i.test(url) ? 'Instagram'
            : /facebook\.com|fb\.watch/i.test(url) ? 'Facebook'
            : /twitter\.com|x\.com/i.test(url) ? 'Twitter/X'
            : /pin\.it|pinterest\.com/i.test(url) ? 'Pinterest'
            : /threads\.net|threads\.com/i.test(url) ? 'Threads'
            : /scribd\.com/i.test(url) ? 'Scribd'
            : /videy\.co/i.test(url) ? 'Videy'
            : null;

          try {
            let downloaded = false;
            if (platform === 'TikTok') downloaded = await downloadTikTok(url, m, sock);
            else if (platform === 'Instagram') downloaded = await downloadInstagram(url, m, sock);
            else if (platform === 'Facebook') downloaded = await downloadFacebook(url, m, sock);
            else if (platform === 'Twitter/X') downloaded = await downloadTwitter(url, m, sock);
            else if (platform === 'Pinterest') downloaded = await downloadPinterest(url, m, sock);
            else if (platform === 'Threads') downloaded = await downloadThreads(url, m, sock);
            else if (platform === 'Scribd') downloaded = await downloadScribd(url, m, sock);
            else if (platform === 'Videy') downloaded = await downloadVidey(url, m, sock);

            if (downloaded === false) {
              throw new Error('Layanan downloader tidak menemukan media atau tidak memberikan hasil. Pastikan tautan masih aktif dan kontennya dapat diakses.');
            }
          } catch (error) {
            const detail = describeAutoDownloadError(error);
            console.error(`[AUTO DOWNLOAD] ${platform || 'Media'} gagal:`, error);
            try {
              await sock.sendMessage(m.chat, {
                text: `Download otomatis ${platform ? `(${platform}) ` : ''}gagal.\nDetail: ${detail}`,
              }, { quoted: m });
            } catch (sendError) {
              console.error('[AUTO DOWNLOAD] Gagal mengirim detail error:', sendError);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error on message:", err);
  }
});

const restoreDeletedMessage = async (key, eventJid) => {
    const chat = key?.remoteJid || eventJid;
    if (!chat?.endsWith('@g.us')) return;

    try {
      const group = await getGroup(chat);
      await restoreAntiDeleteMessage(sock, key, chat, group.antidelete === 1);
    } catch (error) {
      console.error('[ANTIDELETE] Gagal mengirim ulang pesan:', error);
    }
};

sock.ev.on('messages.delete', async (event) => {
  const keys = event?.keys || (Array.isArray(event) ? event : []);
  for (const key of keys) {
    await restoreDeletedMessage(key, event?.jid);
  }
});

sock.ev.on('messages.update', async (updates) => {
  for (const update of updates || []) {
    const messageStubType = update?.update?.messageStubType;
    if (messageStubType !== 1 && messageStubType !== 'REVOKE') continue;
    const key = update.key || update.update.key;
    const chat = key?.remoteJid
    if (!chat?.endsWith('@g.us')) continue
    const group = await getGroup(chat);
    await restoreAntiDeleteMessage(sock, key, chat, group.antidelete === 1);
  }
});

  await startAutoSholat(sock);
  startAutoBerita();
  startAutoMotivasi(sock);
	startAutoEvent(sock);
  
  sock.ev.on("group-participants.update", async (update) => {
    await WelcomeMessage(sock, update);
  });
  
  sock.ev.on("call", async (celled) => {
    let anticall = global.anticall;
    if (!anticall) return;

    for (let data of celled) {
      if (!data.isGroup && data.status === "offer") {
        await sock.sendMessage(data.from, {
          text: `*ANTI CALL*\nMaaf @${data.from.split("@")[0]} kamu akan diblokir karena melakukan panggilan`,
          mentions: [data.from]
        });

        await delay(5000);
        const jid = data.from.includes('@') ? data.from : data.from + '@s.whatsapp.net';
        await sock.updateBlockStatus(jid, "block");
      }
    }
  });

  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return decode.user && decode.server && decode.user + '@' + decode.server || jid;
    } else return jid;
  };
  
  sock.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    try {
      const quoted = message.msg ? message.msg : message;
      const mime = (message.msg || message).mimetype || "";
      const messageType = message.mtype
        ? message.mtype.replace(/Message/gi, "")
        : mime.split("/")[0];

      const Randoms = Date.now();
      const fil = Randoms;

      if (!fs.existsSync("./data/trash")) {
        fs.mkdirSync("./data/trash", { recursive: true });
      }

      const stream = await downloadContentFromMessage(quoted, messageType);
      let buffer = Buffer.from([]);

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const type = (await fileTypeFromBuffer(buffer)) || { ext: "bin", mime: "application/octet-stream" };
      const trueFileName = attachExtension
        ? `./data/trash/${fil}.${type.ext}`
        : filename || `./data/trash/${fil}.${type.ext}`;

      fs.writeFileSync(trueFileName, buffer);

      return trueFileName;
    } catch (err) {
      console.error("Error saat download media:", err);
      return null;
    }
  };

  sock.downloadM = async (m, type, filename = '') => {
    if (!m || !(m.url || m.directPath)) return Buffer.alloc(0);
    const stream = await downloadContentFromMessage(m, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    if (filename) await fs.promises.writeFile(filename, buffer);
    return filename && fs.existsSync(filename) ? filename : buffer;
  };

  sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split`, `[1], 'base64')
      : /^https?:\/\//.test(path)
      ? await (await getBuffer(path))
      : fs.existsSync(path)
      ? fs.readFileSync(path)
      : Buffer.alloc(0);

    if (buff instanceof Error) {
      throw new Error(`Gagal mengunduh gambar sticker: ${buff.message}`, { cause: buff });
    }
    if (!Buffer.isBuffer(buff) || buff.length === 0) {
      throw new Error('Gambar sticker kosong atau tidak dapat diunduh.');
    }

    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifImg(buff, options);
    } else {
      buffer = await imageToWebp(buff);
    }

    await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
    return buffer;
  };

  sock.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split`, `[1], 'base64')
      : /^https?:\/\//.test(path)
      ? await (await getBuffer(path))
      : fs.existsSync(path)
      ? fs.readFileSync(path)
      : Buffer.alloc(0);

    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifVid(buff, options);
    } else {
      buffer = await videoToWebp(buff);
    }

    await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
    return buffer;
  };

  sock.getFile = async (PATH, save) => {
    let res;
    let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);

    let type = await fileTypeFromBuffer(data) || {
      mime: "application/octet-stream",
      ext: "bin"
    };

    let filename = path.join(__filename, './data/trash/' + new Date * 1 + '.' + type.ext);
    if (data && save) fs.promises.writeFile(filename, data);
    return {
      res,
      filename,
      size: await getSizeMedia(data),
      ...type,
      data
    };
  };

  sock.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
    let type = await sock.getFile(path, true);
    let { res, data: file, filename: pathFile } = type;

    if (res && res.status !== 200 || file.length <= 65536) {
      try {
        throw { json: JSON.parse(file.toString()) };
      } catch (e) {
        if (e.json) throw e.json;
      }
    }

    let opt = { filename };
    if (quoted) opt.quoted = quoted;
    if (!type) options.asDocument = true;

    let mtype = '', mimetype = type.mime, convert;
    if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
    else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
    else if (/video/.test(type.mime)) mtype = 'video';
    else if (/audio/.test(type.mime)) {
      convert = await (ptt ? toPTT : toAudio)(file, type.ext);
      file = convert.data;
      pathFile = convert.filename;
      mtype = 'audio';
      mimetype = 'audio/ogg; codecs=opus';
    } else mtype = 'document';

    if (options.asDocument) mtype = 'document';

    delete options.asSticker;
    delete options.asLocation;
    delete options.asVideo;
    delete options.asDocument;
    delete options.asImage;

    let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype };
    let m;

    try {
      m = await sock.sendMessage(jid, message, { ...opt, ...options });
    } catch (e) {
      m = null;
    } finally {
      if (!m) m = await sock.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
      file = null;
      return m;
    }
  };

  sock.sendContact = async (jid, kon = [], name, desk = "Developer Bot", quoted = '', opts = {}) => {
    const list = kon.map(i => ({
      displayName: typeof name !== 'undefined' ? name : 'Unknown',
      vcard:
        'BEGIN:VCARD\n' +
        'VERSION:3.0\n' +
        `N:;${name || 'Unknown'};;;\n` +
        `FN:${name || 'Unknown'}\n` +
        'ORG:Unknown\n' +
        'TITLE:\n' +
        `item1.TEL;waid=${i}:${i}\n` +
        'item1.X-ABLabel:Ponsel\n' +
        `X-WA-BIZ-DESCRIPTION:${desk}\n` +
        `X-WA-BIZ-NAME:${name || 'Unknown'}\n` +
        'END:VCARD'
    }));

    await sock.sendMessage(
      jid,
      { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts },
      { quoted }
    );
  };
}

startBot();

fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(chalk.white.bold("~> Update File :"), chalk.green.bold(__filename));
  import(`${pathToFileURL(__filename).href}?update=${Date.now()}`);
});