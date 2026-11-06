process.on("uncaughtException", (err) => {
console.error("Caught exception:", err);
});

import { 
  S_WHATSAPP_NET, 
  downloadContentFromMessage,
  generateWAMessageFromContent,
  generateWAMessageContent,
  areJidsSameUser
} from "@whiskeysockets/baileys";

import * as fs from "fs/promises"; 
import * as fsSync from "fs";  
import chalk from "chalk";
import { fileURLToPath, pathToFileURL } from "url";
import util from "util";
import axios from "axios";
import fetch from "node-fetch";
import path from "path";
import { exec, spawn, execSync } from 'child_process';

//=============================================//
// * import file
import { handleMessage, getPluginStats, hasPluginCommand } from "./control/plugins.js"
import { getGroup, db, getSettings, getUser, incrementData } from './control/database.js';
import { isChatBanned } from './control/banned-chats.js';

//=============================================//
const readOwners = () => {
  try {
    const raw = fsSync.readFileSync("./data/owner.json", "utf8");
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(v => String(v).trim()).filter(Boolean);
  } catch {
    return [];
  }
};

export const owners = readOwners();
const wrongPrefixCooldown = new Map();
const lidResolveCache = new Map();

const normalizeUserId = (value = "") => {
  if (!value) return "";
  const str = String(value).trim();
  if (!str) return "";
  const base = str.split('@')[0].split(':')[0];
  return base.replace(/[^0-9]/g, "");
};

const idsMatch = (a = "", b = "") => {
  if (!a || !b) return false;
  if (a === b) return true;

  try {
    if (typeof areJidsSameUser === "function" && areJidsSameUser(a, b)) return true;
  } catch {}

  const aNum = normalizeUserId(a);
  const bNum = normalizeUserId(b);
  return Boolean(aNum && bNum && aNum === bNum);
};

const resolveLid = async (sock, jid) => {
  if (!jid || !String(jid).endsWith('@lid')) return [];
  if (lidResolveCache.has(jid)) return lidResolveCache.get(jid);

  try {
    const resolved = [];
    const lidMapping = sock.signalRepository?.lidMapping || sock.lidMapping;

    if (lidMapping?.getPNForLID) {
      const phoneJid = await lidMapping.getPNForLID(jid);
      if (phoneJid) resolved.push(phoneJid);
    }

    if (!resolved.length && sock.onWhatsApp) {
      const result = await sock.onWhatsApp(jid);
      resolved.push(...(result || []).flatMap(entry => [entry?.jid, entry?.lid]).filter(Boolean));
    }

    lidResolveCache.set(jid, resolved);
    return resolved;
  } catch {
    return [];
  }
};

//=============================================//
export async function plugins_handler(m, sock, chatUpdate) {
try {
const body =
  m.message?.conversation ||
  m.message?.extendedTextMessage?.text ||
  m.message?.imageMessage?.caption ||
  m.message?.videoMessage?.caption ||
  m.message?.buttonsResponseMessage?.selectedButtonId ||
  m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
  m.message?.templateButtonReplyMessage?.selectedId ||
  (m.message?.interactiveResponseMessage
    ? JSON.parse(m.msg?.nativeFlowResponseMessage?.paramsJson || "{}")?.id
    : "") ||
  "";

const you = JSON.parse(fsSync.readFileSync("./data/ban.json") || "[]");
const list = JSON.parse(fsSync.readFileSync("./data/list.json"))

if (m.isGroup) {
  // cek list dulu sebelum proses command
  const listCheck = list.find(e => e.chatId === m.chat && e.cmd === body);
  if (listCheck) {
    if (listCheck.img) {
      sock.sendMessage(m.chat, { image: { url: listCheck.img }, caption: listCheck.respon }, { quoted: m });
    } else {
      m.reply(listCheck.respon);
    }
    return;
  }
}

const chatDb = await getGroup(m.chat);
const globalPrefix = global.prefix || '.';
const isMultiPrefix = global.multiprefix === true;

let prefix = null;
let isCmd = false;
const rawCommandBody = body.trim();
const isPrefixlessEvalShortcut =
  (Boolean(m.quoted) && /^q$/i.test(rawCommandBody)) ||
  /^\$(?:\s|$)/.test(rawCommandBody) ||
  /^=>(?:\s|$)/.test(rawCommandBody);

if (isPrefixlessEvalShortcut) {
    prefix = '';
    isCmd = true;
} else if (isMultiPrefix) {
    // Prefix ON: cuma 1 prefix yang valid
    if (body.startsWith(globalPrefix)) {
        prefix = globalPrefix;
        isCmd = true;
    } else {
    // Reminder kalau salah prefix
    const firstChar = body.charAt(0);
    const isLetter = /^[a-zA-Z0-9]/.test(firstChar);
    const validPrefixes = /^[.!/#$%^&*]/.test(firstChar); // hanya simbol umum
    if (!isLetter && validPrefixes && body.length > 1 && firstChar !== globalPrefix) {
        const cmd = body.slice(1).split(' ')[0];
        if (cmd && cmd.length < 20 && /^[a-zA-Z]/.test(cmd)) { // cmd harus huruf
            const cooldownKey = `${m.sender}_${m.chat}`;
            const lastSent = wrongPrefixCooldown.get(cooldownKey) || 0;
            const now = Date.now();

               if (now - lastSent > 30_000) { 
              wrongPrefixCooldown.set(cooldownKey, now);

              const teksPrefix = `W R O N G  P R E F I X\n` +
                `───────────────────\n` +
                `Hallo *${m.pushName}*\n` +
                `Prefix yang kamu gunakan salah.\n\n` +
                `Prefix benar : [ ${globalPrefix} ]\n` +
                `Contoh       : ${globalPrefix}menu\n` +
                `───────────────────`;

              sock.sendMessage(m.chat, {
                text: `\`\`\`${teksPrefix}\`\`\``,
                mentions: [m.sender],
                contextInfo: {
                  isForwarded: true,
                  forwardingScore: 99,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: global.idChannel,
                    serverMessageId: null,
                    newsletterName: global.namaChannel
                  }
                }
              }, { quoted: m });
            }
        }
    }
}
} else {
    const firstChar = body.charAt(0);
    const isLetter = /^[a-zA-Z0-9]/.test(firstChar);

    if (!isLetter && body.length > 1) {
        if (firstChar === '@') {
            prefix = null;
            isCmd = false;
        } else {
            prefix = firstChar;
            isCmd = true;
        }
    } else if (isLetter && body.length > 0) {
        prefix = '';
        isCmd = true;
    }
}

const command = isCmd? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
const args = isCmd ? body.slice(prefix.length).trim().split(/ +/).slice(1) : [];
const isRegisteredCommand = isCmd ? await hasPluginCommand(command) : false;

const quoted = m.quoted ? m.quoted : m
const mime = quoted?.msg?.mimetype || quoted?.mimetype || null
const qmsg = (m.quoted || m)
const q = args.join(" ");
const text = q;

const groupMetadata = m.isGroup ? await sock.groupMetadata(m.chat).catch(() => ({})) : {};
const participants = m.isGroup ? (groupMetadata.participants || []) : [];

const participantIds = participant => [
  participant?.id,
  participant?.jid,
  participant?.lid,
  participant?.phoneNumber,
  participant?.full?.id,
  participant?.full?.jid,
  participant?.full?.lid,
  participant?.full?.phoneNumber
].filter(Boolean);

const senderIds = [
  m.sender,
  m.senderLid,
  m.key?.participant,
  m.key?.senderPn
].filter(Boolean);

const senderParticipant = participants.find(participant =>
  participantIds(participant).some(id => senderIds.some(senderId => idsMatch(id, senderId)))
);

let resolvedSenderIds = [
  ...senderIds,
  ...participantIds(senderParticipant)
];

if (!m.isGroup) {
  const resolvedLids = await Promise.all(
    senderIds.filter(id => String(id).endsWith('@lid')).map(id => resolveLid(sock, id))
  );
  resolvedSenderIds = [...new Set([
    ...resolvedSenderIds,
    ...resolvedLids.flat()
  ])];
}

const botNumber = await sock.decodeJid(sock.user.id);

const globalOwners = (global.owner || []).map(v => String(v).trim()).filter(Boolean);
const localOwners = readOwners();

const allOwners = [
    botNumber,
    ...globalOwners,
    ...localOwners
].filter(Boolean);

const isOwner = allOwners.some(ownerId =>
  resolvedSenderIds.some(senderId => idsMatch(ownerId, senderId))
) || m.isDeveloper === true;
const isChatBlocked = m.isGroup && isChatBanned(m.chat);
const totalBan = you.length > 0 ? you.length : 0
const isBan = you.includes(m.sender)
const statusUsr = isOwner ? "owner" : "free user";

if (isChatBlocked && !isOwner) return;

if (global.autotyping && isCmd && !m.key.fromMe) {
 await sock.sendPresenceUpdate("composing", m.chat);
}

//=============================================//
// Detek User/Member Dalam Grup
const adminParticipants = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

const botNum = normalizeUserId(sock.user?.id || sock.user?.jid || botNumber || '');
const senderNum = normalizeUserId(m.sender || '');

const isAdmin = adminParticipants.some(p => {
    const ids = [p.id, p.jid, p.full?.id, p.full?.jid].filter(Boolean);

    return ids.some(id => idsMatch(id, m.sender) || (
        normalizeUserId(id) && senderNum && normalizeUserId(id) === senderNum
    ));
});

// Detek botIsAdmin
const botJid = sock.user?.id || sock.user?.jid || '';
const botLid = sock.user?.lid || '';
const cleanBotNum = normalizeUserId(botJid || botNumber || '');

const isBotAdmin = adminParticipants.some(p => {
    const adminIds = [p.id, p.jid, p.full?.id, p.full?.jid].filter(Boolean);

    return adminIds.some(adminId => {
        if (idsMatch(adminId, botJid)) return true;
        if (botLid && idsMatch(adminId, botLid)) return true;

        const cleanAdmin = normalizeUserId(adminId);
        if (cleanAdmin && cleanBotNum && cleanAdmin === cleanBotNum) return true;

        const pObj = participants.find(part => part.id === adminId || part.jid === adminId || idsMatch(part.id, adminId) || idsMatch(part.jid, adminId));
        if (pObj) {
            const pNum = normalizeUserId(pObj.jid || pObj.id || '');
            if (pNum && cleanBotNum && pNum === cleanBotNum) return true;
        }

        return false;
    });
});
//=============================================//
//Mute grup
if (m.isGroup && isCmd) {
        if (chatDb.mute === 1) {
            if (!isOwner) {
                return; 
            }
        }
    }

if (body.startsWith(prefix + command)) {
    if (global.pconly && m.isGroup) {
        return m.reply("Bot Hanya Dapat Digunakan di privat chat ⚠️");
    }
    if (global.gconly && !m.isGroup && !isOwner) {
    return await sock.sendMessage(m.chat, {
        react: { text: "🚫", key: m.key }
    });
    }
}
 
//=============================================//
// * fungsi untuk jadwal sholat**
async function JadwalSholat(kota) {
  try {
    // cari ID kota
    const search = await axios.get(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(kota)}`)
    const dataKota = search.data.data?.[0]
    if (!dataKota) return `⚠️ Kota *${kota}* tidak ditemukan.`

    // ambil jadwal sholat berdasarkan ID kota
    const jadwal = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/${dataKota.id}/${new Date().getFullYear()}/${new Date().getMonth()+1}/${new Date().getDate()}`)
    const j = jadwal.data.data.jadwal

    return `\`\`\`JADWAL SHOLAT 🌞\`\`\`

🏘️Kota : *${dataKota.lokasi}*
📆 Date : ${j.tanggal}

- 🕐 *Imsak:*  ${j.imsak}
- 🕌 *Subuh:* ${j.subuh}
- 🌞 *Dzuhur:* ${j.dzuhur}
- ☀️ *Ashar:* ${j.ashar}
- 🌇 *Maghrib:* ${j.maghrib}
- 🌙 *Isyak:* ${j.isya}

_Mari kita sholat ✨~_`
  } catch (err) {
    console.error(err)
    return "⚠️ Terjadi kesalahan saat mengambil jadwal sholat."
  }
}

//=============================================//
if (m.isGroup && !m.key.fromMe) {

    // ── 1. Parse afk_users dari grup ──
    let afkUsers = {};
    try {
        afkUsers = JSON.parse(chatDb.afk_users || '{}');
    } catch { afkUsers = {}; }

    // ── 2. Kumpulkan mention ──
    let mentions = [
        ...(m.msg?.contextInfo?.mentionedJid || []),
        ...(m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []),
        ...(m.message?.imageMessage?.contextInfo?.mentionedJid || []),
        ...(m.message?.videoMessage?.contextInfo?.mentionedJid || []),
        ...(m.message?.stickerMessage?.contextInfo?.mentionedJid || []),
        ...(m.message?.audioMessage?.contextInfo?.mentionedJid || []),
        ...(m.mentionedJid || [])
    ];

    mentions = [...new Set(mentions)];

    // ── 3. Translate LID ke JID secara aman, cukup sekali per event ──
    const lidMentions = mentions.filter(jid => jid && jid.endsWith('@lid'));
    let groupParticipants = [];
    if (lidMentions.length) {
        try {
            const groupMeta = await sock.groupMetadata(m.chat);
            groupParticipants = groupMeta.participants || [];
            mentions = mentions.map(jid => {
                if (!jid || !jid.endsWith('@lid')) return jid;
                const match = groupParticipants.find(p => p.lid === jid);
                return match ? (match.jid || match.id || jid) : jid;
            });
        } catch (e) {
            console.error("[AFK] Gagal translate LID:", e.message);
        }
    }

    // ── 4. Tambah quoted user (reply) ──
    const quotedUser = m.quoted?.sender || null;
    let resolvedQuoted = quotedUser;
    if (quotedUser && quotedUser.endsWith('@lid')) {
        try {
            const groupMeta = groupParticipants.length ? { participants: groupParticipants } : await sock.groupMetadata(m.chat).catch(() => ({ participants: [] }));
            const gParticipants = groupMeta.participants || [];
            const match = gParticipants.find(p => p.lid === quotedUser);
            resolvedQuoted = match ? (match.jid || match.id || quotedUser) : quotedUser;
        } catch {}
    }

    const mentionUser = [...new Set([
        ...mentions,
        ...(resolvedQuoted ? [resolvedQuoted] : [])
    ])].filter(jid => jid && !jid.endsWith('@lid'));

    // ── 5. Cek AFK untuk setiap mention/reply ──
    const repliedUsers = new Set();
    for (const ment of mentionUser) {
        if (repliedUsers.has(ment)) continue;
        const afkData = afkUsers[ment];
        if (afkData && afkData.time > -1) {
            repliedUsers.add(ment);
            const duration = Date.now() - afkData.time;
            const anu2 = ms(duration);
            await m.reply(`Eh, jangan di-tag orangnya lagi *AFK!* 😴\n\n🕒 Sejak: ${anu2.hours} jam, ${anu2.minutes} menit, ${anu2.seconds} detik lalu\n💬 Alasan: ${afkData.reason || 'Tanpa alasan'}`);
        }
    }

    // ── 6. Un-AFK pengirim kalau dia lagi AFK ──
    if (afkUsers[m.sender] && afkUsers[m.sender].time > -1) {
        const afkData = afkUsers[m.sender];
        const duration = Date.now() - afkData.time;
        const anu = ms(duration);

        delete afkUsers[m.sender];
        await db('groups', m.chat, 'afk_users', JSON.stringify(afkUsers));

        await sock.sendMessage(m.chat, {
            text: `Yeay! @${m.sender.split('@')[0]} udah balik dari *AFK!* 🎉\n\n🕒 Durasi: ${anu.hours} jam, ${anu.minutes} menit, ${anu.seconds} detik\n💬 Alasan: ${afkData.reason || 'Tanpa alasan'}`,
            mentions: [m.sender]
        }, { quoted: m });
    }
}


//=============================================//
if (m.isGroup) {
  if (chatDb.antichannel === 1 && isBotAdmin) {

    const isForwardChannel =
      m.message?.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo ||
      m.msg?.contextInfo?.forwardedNewsletterMessageInfo

    if (isForwardChannel && !isOwner && !isAdmin && !m.key.fromMe) {

      const participant = m.key.participant || m.sender;

      await sock.sendMessage(m.chat, {
        text: `*Group Security!*
› Hii @${m.sender.split('@')[0]}
› Pesan dari *Channel* tidak diperbolehkan di sini!`,
        mentions: [m.sender]
      }, { quoted: m });

      await sleep(500);

      await sock.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          id: m.key.id,
          participant: participant,
          fromMe: false
        }
      });

    }
  }
}

//=============================================//
if (m.isGroup) {
  if (chatDb.antisticker === 1 && isBotAdmin) {
    if (m.message?.stickerMessage && !isOwner && !isAdmin && !m.key.fromMe) {
      const participant = m.key.participant || m.sender;
      await sock.sendMessage(m.chat, {
        text: `*Group Security!*
› Hii @${m.sender.split('@')[0]}, pesanmu dihapus.
› Jangan kirim *sticker* di sini!`,
        mentions: [m.sender]
      }, { quoted: m });

      await sleep(500);

      await sock.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          id: m.key.id,
          participant: participant,
          fromMe: false
        }
      });
    }
  }
}

//===============================================//
if (m.isGroup) {
    let mutedUsers = [];
    try {
        mutedUsers = JSON.parse(chatDb.muted_users || '[]');
    } catch (e) {
        mutedUsers = []; 
    }

    const sender = m.key.participant || m.participant || m.sender;
    if (mutedUsers.includes(sender) && !isOwner && !isAdmin && isBotAdmin && !m.key.fromMe) {
        
        await sleep(1000); 
        await sock.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: sender
            }
        });
    }
}

//=============================================//
if (m.isGroup) {
  if (chatDb.antilinkgc === 1 && isBotAdmin) {
    const regex = /(?:https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9]{20,24}/i;

    if (regex.test(m.text) && !isOwner && !isAdmin && isBotAdmin && !m.key.fromMe) {
      
      await sock.sendMessage(m.chat, {
        text: `*Group Security!*
› Hii @${m.sender.split('@')[0]}, pesanmu dihapus 
› Jangan kirim link *grup lain* di sini!`,
        mentions: [m.sender]
      }, { quoted: m });

      await sleep(600); 
      await sock.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          id: m.key.id,
          participant: m.key.participant || m.sender,
          fromMe: false
        }
      });
    }
  }
}

//=============================================//
if (m.isGroup) {
  if (chatDb.antilinkch === 1 && isBotAdmin) {
    const regex = /(?:https?:\/\/)?whatsapp\.com\/channel\/[A-Za-z0-9]{15,45}/i;
    if (regex.test(m.text) && !isOwner && !isAdmin && isBotAdmin && !m.key.fromMe) {

      const participant = m.key.participant || m.sender;

      await sock.sendMessage(m.chat, {
        text: `*Group Security!*
› Hii @${m.sender.split('@')[0]}, pesanmu dihapus 
› Jangan kirim link *saluran WhatsApp* di sini!`,
        mentions: [m.sender]
      }, { quoted: m });

      await sleep(600);
      await sock.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          id: m.key.id,
          participant: participant,
          fromMe: false
        }
      });
    }
  }
}

//=============================================//
if (m.isGroup) {
  if (chatDb.antitoxic === 1 && isBotAdmin) {
    
    const pornWords = [
      "18+", "hentai", "sexi",
      "porn", "porno", "xnxx", "xvideos",
      "jav", "fetish", "gay", "sexy", "sex", "hot",
      "bikini", "sepak", "ngentot",
      "anjing","kontol","memek","asu","bangsat",
      "babi","goblok","tolol","idiot","jingan",
      "bacot","ngentot","jancok","pantek","kampang",
      "kimak","pepek","bego","tai","fuck",
      "laso","ajng","ajg","bapaklu","emaklu","palalu",
      "lol","penis","mmk","su","lonte","jalang","tytyd",
      "titit","yatim","yapit","piatu","pungut","anjir",
      "mani","sperma","sepongin","kocoqin","kocok","coli",
      "sex","sepong","fck", "lapet", "ngesex", "bugil", "tobugil",
      "telanjang", "naked"
    ];

    const pesan = (m.text || "").toLowerCase();
    const Warn = pornWords.some(k => pesan.includes(k));
    if (Warn && !isOwner && !isAdmin && !m.key.fromMe) {

      const participant = m.key.participant || m.sender;
      await sock.sendMessage(m.chat, {
        text: `*Group Security!*
› Hii @${m.sender.split('@')[0]}, pesanmu dihapus  
› Kata terlarang tidak diperbolehkan di grup ini.`,
        mentions: [m.sender]
      }, { quoted: m });

      await sleep(600);
      await sock.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          id: m.key.id,
          participant: participant,
          fromMe: false
        }
      });
    }
  }
}
//=============================================//
if (m.isGroup) {
  if (chatDb.antitagsw === 1 && isBotAdmin) {
    if (!isOwner && !isAdmin && !m.key.fromMe) {
      if (m.message?.groupStatusMentionMessage) {
        
        const participant = m.key.participant || m.sender;
        await sock.sendMessage(m.chat, {
          text: `*Group Security!*
› Hii @${m.sender.split('@')[0]}, pesanmu dihapus  
› Jangan tag *status* di sini!`,
          mentions: [m.sender]
        }, { quoted: m });

        await sleep(600); 
        await sock.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            id: m.key.id,
            participant: participant,
            fromMe: false
          }
        });
      }
    }
  }
}

//=============================================//
if (m.isGroup) {
  if (chatDb.antipromosi === 1 && isBotAdmin) {
    if (!isOwner && !isAdmin && !m.key.fromMe) {

      const pesan = (
        m.text ||
        m.message?.extendedTextMessage?.text ||
        ""
      ).toLowerCase();
      const promoWords = [
        "ready", "sell", "price", "jual",
        "redi", "remdi", "buy", "beli", "order", "sewa",
        "diskon", "jasa", "murah", "murmer", "promo",
        "reseller", "garansi", "bergaransi", "nokos",
        "stock", "stok", "bayar", "pembayaran", "payment",
        "dp", "own panel", "panel", "apk premium", "idr", "maharin",
        "function", "bug", "crash"
      ];


      const adaPromo = promoWords.some(word => pesan.includes(word));
      if (adaPromo) {
        const participant = m.key.participant || m.sender;

        await sock.sendMessage(m.chat, {
          text: `*Group Security!*
› Hii @${m.sender.split('@')[0]}, pesanmu dihapus  
› Kata *promosi* terdeteksi!`,
          mentions: [m.sender]
        }, { quoted: m });

        await sleep(600); 
        await sock.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            id: m.key.id,
            participant: participant,
            fromMe: false
          }
        });
      }
    }
  }
}

//=============================================//
if (m.isGroup) {
  if (chatDb.antilinkall === 1 && isBotAdmin) {
    if (!isOwner && !isAdmin && !m.key.fromMe) {

      const pesan =
        m.text ||
        m.message?.extendedTextMessage?.text ||
        "";

      const regexLink = /https?:\/\/[^\s]+/i;
      const adaLink = regexLink.test(pesan);

      if (adaLink) {
        const participant = m.key.participant || m.participant || m.sender;

        await sock.sendMessage(
          m.chat,
          {
            text: `*Group Security!*
› Hii @${m.sender.split('@')[0]}, pesanmu dihapus 
› Jangan kirim *link* apapun di sini!`,
            mentions: [m.sender],
          },
          { quoted: m }
        );

        await sleep(1000);
        await sock.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            fromMe: false,
            id: m.key.id,
            participant: participant,
          },
        });
      }
    }
  }
}

//=============================================//
 const qkontak2 = {
  key: {
    fromMe: false,
    participant: "13135550002@s.whatsapp.net",
    remoteJid: "13135550002@s.whatsapp.net",
  },
  message: {
    interactiveMessage: {
      body: { text: "Payment Info" },
      nativeFlowMessage: {
        buttons: [
          {
            name: "payment_info",
            buttonParamsJson: JSON.stringify({
              currency: "IDR",
              total_amount: {
                value: 999999999999999,
                offset: 0,
              },
              reference_id: "Trina",
              type: "Services",
              order: {
                status: "pending",
                subtotal: {
                  value: 999999999999999,
                  offset: 0,
                },
                order_type: "ORDER",
                items: [
                  {
                    name: "Trina",
                    amount: {
                      value: 999999999999999,
                      offset: 0,
                    },
                    quantity: 1,
                    sale_amount: {
                      value: 999999999999999,
                      offset: 0,
                    },
                  },
                ],
              },
              payment_settings: [
                {
                  type: "pix_static_code",
                  pix_static_code: {
                    merchant_name: "Trina",
                    key: "Trina | 4with you",
                    key_type: "EVP",
                  },
                },
              ],
              share_payment_status: false,
            }),
          },
        ],
      },
    },
  },
};

const qtxt = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "0@s.whatsapp.net"
    },
    message: {
        newsletterAdminInviteMessage: {
            newsletterJid: "120363418430349552@newsletter",
            newsletterName: "TrinAtri",
            caption: `Powered By ${namaOwner}`,
            inviteExpiration: "1757494779"
        }
    }
};

const qkontak = {
key: {
participant: `15517868409@s.whatsapp.net`,
...(botNumber ? {
remoteJid: `15517868409@s.whatsapp.net`
} : {})
},
message: {
'contactMessage': {
'displayName': `私はジャーです`,
'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=15517868409:+1 551 786-8409\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
sendEphemeral: true
}}
}

const reply = m.reply = async (teks) => {
  return sock.sendMessage(m.chat, {
    text: `${teks}`,
    mentions: [m.sender]
  }, { quoted: m });
};

const example = (teks) => {
return `Cara pengguna:\n*${prefix+command}* ${teks}`
}

function styleText(text) {
const map = {
a:"ᴀ", b:"ʙ", c:"ᴄ", d:"ᴅ", e:"ᴇ",
f:"ꜰ", g:"ɢ", h:"ʜ", i:"ɪ", j:"ᴊ",
k:"ᴋ", l:"ʟ", m:"ᴍ", n:"ɴ", o:"ᴏ",
p:"ᴘ", q:"ǫ", r:"ʀ", s:"ꜱ", t:"ᴛ",
u:"ᴜ", v:"ᴠ", w:"ᴡ", x:"x", y:"ʏ", z:"ᴢ"
}

return text
.toLowerCase()
.split("")
.map(v => map[v] || v)
.join("")
}

//=============================================//
const handleData = { 
    sock,
    text, 
    q, 
    args, 
    isCmd, 
    mime, 
    qmsg, 
    command, 
    qtxt, 
    qkontak2,
    qkontak, 
    reply, 
    owners, 
    example, 
    totalBan, 
    getPluginStats, 
    list, 
    JadwalSholat, 
    downloadContentFromMessage, 
    S_WHATSAPP_NET, 
    generateWAMessageFromContent, 
    usedPrefix : prefix, 
    generateWAMessageContent, 
    db, 
    incrementData, 
    getUser, 
    getGroup, 
    getSettings,
    chatDb, 
    botNumber,
    styleText,
    statusUsr,
    isOwner, 
    isAdmin, 
    isBotAdmin,
    isBan, 
}

if (isCmd) {
  const isPublicMode = global.public || isOwner;
  if (!isPublicMode) return; 
  await handleMessage(m, sock, handleData.command.toLowerCase(), handleData);
}

//=============================================//
const from = m.key.remoteJid;
const chatType = from.endsWith("@g.us") ? "GROUP" : "PRIVATE";
const status = isOwner ? "owner" : "free user";
const bodyText = m.body || m.text || (m.message ? Object.values(m.message)[0]?.text : "") || "";

console.log(
  chalk.white.bold('\n'), chalk.bgGreen.bold('[✓] - MESSAGE DETECTED'),
  '\n' + chalk.white('──────────────────────────────'),
  '\n' + chalk.white('› Text      :'), chalk.green(bodyText || "[Media/Non-Text]"),
  '\n' + chalk.white('› Is Cmd    :'), isRegisteredCommand ? chalk.green('Yes') : chalk.red('No'),
  '\n' + chalk.white('› Command   :'), isCmd ? chalk.cyan(`${prefix}${command}`) : chalk.gray('-'),
  '\n' + chalk.white('› Chat In   :'), chalk.blue(chatType),
  '\n' + chalk.white('› Status    :'), chalk.yellow(status),
  '\n' + chalk.white('› Name      :'), chalk.cyan(m.pushName || "Unknown"),
  '\n' + chalk.white('› Sender    :'), chalk.magenta(m.sender),
  '\n' + chalk.white('──────────────────────────────') + '\n'
);

return isOwner;

//=============================================//
} catch (err) {
console.log(err)
await sock.sendMessage(global.owner+"@s.whatsapp.net", {text: err.toString()}, {quoted: m})
}}

//=============================================//
const __filename = fileURLToPath(import.meta.url);
fsSync.watchFile(__filename, () => { 
    fsSync.unwatchFile(__filename); 
    console.log(chalk.white.bold("~> Update File :"), chalk.green.bold(__filename));
    import(`${pathToFileURL(__filename).href}?update=${Date.now()}`);
});