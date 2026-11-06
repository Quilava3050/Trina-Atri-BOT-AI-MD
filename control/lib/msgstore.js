import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const STORE_DIR = path.join(process.cwd(), 'data', 'msgstore');
const CONFIG_PATH = path.join(STORE_DIR, 'config.json');
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const MAX_GROUP_MEDIA_BYTES = 100 * 1024 * 1024;
const MAX_GROUP_ITEMS = 500;
const MEDIA_TYPES = new Set(['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage']);
const queues = new Map();

const groupKey = (chat) => Buffer.from(chat).toString('base64url');
const groupDir = (chat) => path.join(STORE_DIR, groupKey(chat));
const indexPath = (chat) => path.join(groupDir(chat), 'index.json');

const atomicWrite = async (file, value) => {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const tempPath = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await fs.promises.writeFile(tempPath, JSON.stringify(value, null, 2));
  await fs.promises.rename(tempPath, file);
};

const readConfig = async () => {
  try {
    const config = JSON.parse(await fs.promises.readFile(CONFIG_PATH, 'utf8'));
    if (!config || !config.enabled || typeof config.enabled !== 'object' || Array.isArray(config.enabled)) {
      throw new Error('Format konfigurasi msgstore tidak valid.');
    }
    return config;
  } catch (err) {
    if (err.code === 'ENOENT') return { enabled: {} };
    throw err;
  }
};

const readGroupIndex = async (chat) => {
  try {
    const value = JSON.parse(await fs.promises.readFile(indexPath(chat), 'utf8'));
    if (!value || !Array.isArray(value.items)) {
      throw new Error(`Index msgstore untuk ${chat} tidak valid.`);
    }
    let changed = !Number.isSafeInteger(value.nextId) || value.nextId < 1;
    const usedIds = new Set();
    let nextId = Number.isSafeInteger(value.nextId) && value.nextId > 0 ? value.nextId : 1;
    for (const item of value.items) {
      if (!item || typeof item !== 'object') {
        throw new Error(`Item index msgstore untuk ${chat} tidak valid.`);
      }
      const id = Number(item.id);
      if (!Number.isSafeInteger(id) || id < 1 || usedIds.has(id)) {
        while (usedIds.has(nextId)) nextId += 1;
        item.id = nextId++;
        changed = true;
      } else if (item.id !== id) {
        item.id = id;
        changed = true;
      }
      usedIds.add(item.id);
      nextId = Math.max(nextId, item.id + 1);
    }
    if (value.nextId !== nextId) {
      value.nextId = nextId;
      changed = true;
    }
    if (changed) await atomicWrite(indexPath(chat), value);
    return value;
  } catch (err) {
    if (err.code === 'ENOENT') return { nextId: 1, items: [] };
    throw err;
  }
};

const removeMedia = async (chat, item) => {
  if (!item.mediaFile || path.basename(item.mediaFile) !== item.mediaFile) return;
  await fs.promises.rm(path.join(groupDir(chat), item.mediaFile), { force: true });
};

const pruneExpired = async (chat, index, now = Date.now()) => {
  const retained = [];
  for (const item of index.items) {
    if (now - item.timestamp >= RETENTION_MS) {
      await removeMedia(chat, item);
    } else {
      retained.push(item);
    }
  }
  index.items = retained;
};

export const isMsgStoreEnabled = async (chat) => {
  const config = await readConfig();
  return config.enabled[chat] === true;
};

export const setMsgStoreEnabled = async (chat, enabled) => {
  const config = await readConfig();
  config.enabled[chat] = Boolean(enabled);
  await atomicWrite(CONFIG_PATH, config);
};

export const getMsgStoreItems = async (chat) => {
  const index = await readGroupIndex(chat);
  const count = index.items.length;
  await pruneExpired(chat, index);
  if (index.items.length !== count) await atomicWrite(indexPath(chat), index);
  return index.items.sort((a, b) => b.id - a.id);
};

export const getMsgStoreItem = async (chat, id) => {
  const items = await getMsgStoreItems(chat);
  return items.find((item) => item.id === Number(id)) || null;
};

export const deleteMsgStoreItem = async (chat, id) => {
  const index = await readGroupIndex(chat);
  await pruneExpired(chat, index);
  const itemIndex = index.items.findIndex((item) => item.id === Number(id));
  if (itemIndex < 0) {
    await atomicWrite(indexPath(chat), index);
    return null;
  }
  const [item] = index.items.splice(itemIndex, 1);
  await removeMedia(chat, item);
  await atomicWrite(indexPath(chat), index);
  return item;
};

export const clearMsgStore = async (chat) => {
  const index = await readGroupIndex(chat);
  for (const item of index.items) await removeMedia(chat, item);
  const count = index.items.length;
  index.items = [];
  await atomicWrite(indexPath(chat), index);
  return count;
};

export const readMsgStoreMedia = async (chat, item) => {
  if (!item?.mediaFile || path.basename(item.mediaFile) !== item.mediaFile) {
    throw new Error('Pesan ini tidak memiliki media yang tersimpan.');
  }
  return fs.promises.readFile(path.join(groupDir(chat), item.mediaFile));
};

const unwrapMessage = (message) => {
  let content = message;
  while (content && typeof content === 'object') {
    if (
      content.ephemeralMessage ||
      content.viewOnceMessage ||
      content.viewOnceMessageV2 ||
      content.viewOnceMessageV2Extension
    ) return null;
    if (content.documentWithCaptionMessage?.message) {
      content = content.documentWithCaptionMessage.message;
      continue;
    }
    return content;
  }
  return null;
};

const mediaExtension = (media) => {
  const filename = media.fileName || media.filename || '';
  const fromName = path.extname(filename).slice(1).toLowerCase();
  if (/^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  const subtype = String(media.mimetype || '').split('/')[1]?.split(';')[0]?.toLowerCase();
  const knownExtensions = {
    jpeg: 'jpg',
    '3gpp': '3gp',
    'x-msvideo': 'avi',
    'octet-stream': 'bin',
  };
  return knownExtensions[subtype] || (subtype && /^[a-z0-9]{1,8}$/.test(subtype) ? subtype : 'bin');
};

const trimToLimits = async (chat, index, incomingSize) => {
  const totalMedia = () => index.items.reduce((sum, item) => sum + (item.mediaSize || 0), 0);
  while (
    index.items.length >= MAX_GROUP_ITEMS ||
    totalMedia() + incomingSize > MAX_GROUP_MEDIA_BYTES
  ) {
    const oldest = index.items.shift();
    if (!oldest) break;
    await removeMedia(chat, oldest);
  }
};

const capture = async (sock, message) => {
  const chat = message.key?.remoteJid;
  if (!chat?.endsWith('@g.us') || !message.message) return;
  const config = await readConfig();
  if (config.enabled[chat] !== true) return;

  const content = unwrapMessage(message.message);
  if (!content) return;
  const type = [...MEDIA_TYPES].find((candidate) => content[candidate]) ||
    ['conversation', 'extendedTextMessage'].find((candidate) => content[candidate]);
  if (!type) return;
  const body = content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    content.documentMessage?.caption ||
    '';
  if (typeof body === 'string' && /^[.!/#$]/.test(body.trim())) return;

  const media = content[type];
  const isMedia = MEDIA_TYPES.has(type);
  if (!isMedia && !(typeof body === 'string' && body.length)) return;

  const index = await readGroupIndex(chat);
  await pruneExpired(chat, index);
  const messageId = message.key.id;
  if (!messageId || index.items.some((item) => item.key.id === messageId)) return;

  let buffer;
  let mediaFile;
  if (isMedia) {
    if (Number(media.fileLength) > MAX_MEDIA_BYTES) {
      console.warn(`[MSGSTORE] Media ${messageId} dilewati: melewati batas 10 MB.`);
      return;
    }
    buffer = await sock.downloadM(media, type.replace(/Message$/, ''));
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new Error(`Media pesan ${messageId} gagal diunduh.`);
    }
    if (buffer.length > MAX_MEDIA_BYTES) {
      console.warn(`[MSGSTORE] Media ${messageId} dilewati: melewati batas 10 MB.`);
      return;
    }
  }

  await trimToLimits(chat, index, buffer?.length || 0);

  if (buffer) {
    mediaFile = `${randomUUID()}.${mediaExtension(media)}`;
    await fs.promises.mkdir(groupDir(chat), { recursive: true });
    await fs.promises.writeFile(path.join(groupDir(chat), mediaFile), buffer);
  }

  const timestamp = Number(message.messageTimestamp) * 1000 || Date.now();
  index.items.push({
    id: index.nextId++,
    timestamp,
    sender: message.key.participant || message.key.remoteJid,
    key: {
      remoteJid: chat,
      id: messageId,
      fromMe: Boolean(message.key.fromMe),
      ...(message.key.participant ? { participant: message.key.participant } : {}),
    },
    type,
    text: body,
    mimetype: media?.mimetype || '',
    fileName: media?.fileName || media?.filename || '',
    ptt: Boolean(media?.ptt),
    gifPlayback: Boolean(media?.gifPlayback),
    mediaFile,
    mediaSize: buffer?.length || 0,
  });
  await atomicWrite(indexPath(chat), index);
};

export const captureGroupMessage = async (sock, message) => {
  const chat = message.key?.remoteJid;
  if (!chat?.endsWith('@g.us')) return;
  const previous = queues.get(chat) || Promise.resolve();
  const current = previous.then(() => capture(sock, message));
  queues.set(chat, current.catch(() => {}));
  return current;
};

export const getMsgStoreItemByKey = async (chat, key) => {
  const items = await getMsgStoreItems(chat);
  return items.find((item) =>
    item.key?.id === key?.id &&
    item.key?.remoteJid === key?.remoteJid &&
    Boolean(item.key?.fromMe) === Boolean(key?.fromMe) &&
    (!key?.participant || item.key?.participant === key.participant)
  ) || null;
};

export const sendStoredMsgStoreItem = async (sock, chat, item) => {
  if (item.mediaFile) {
    const buffer = await readMsgStoreMedia(chat, item);
    const caption = item.text || undefined;
    switch (item.type) {
      case 'imageMessage':
        return sock.sendMessage(chat, { image: buffer, caption });
      case 'videoMessage':
        return sock.sendMessage(chat, { video: buffer, caption, gifPlayback: item.gifPlayback });
      case 'audioMessage':
        return sock.sendMessage(chat, { audio: buffer, mimetype: item.mimetype || 'audio/ogg', ptt: item.ptt });
      case 'documentMessage':
        return sock.sendMessage(chat, {
          document: buffer,
          mimetype: item.mimetype || 'application/octet-stream',
          fileName: item.fileName || `msgstore-${item.id}`,
          caption,
        });
      case 'stickerMessage':
        return sock.sendMessage(chat, { sticker: buffer });
      default:
        throw new Error(`Jenis media ${item.type} belum didukung.`);
    }
  }
  if (!item.text) throw new Error('Pesan tidak memiliki isi.');
  return sock.sendMessage(chat, { text: item.text });
};
