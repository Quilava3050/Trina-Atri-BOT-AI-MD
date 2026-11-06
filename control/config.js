import { 
  extractMessageContent,
  jidNormalizedUser,
  proto,
  delay,
  getContentType,
  areJidsSameUser,
  generateWAMessage 
} from "@whiskeysockets/baileys";

import fs from "fs";
import chalk from "chalk";
import path, { fileURLToPath, pathToFileURL } from "url";

export default (sock, msg) => {
  if (!msg) return msg;

  const WebMessageInfo = proto.WebMessageInfo;

  if (msg.key) {
    msg.id = msg.key.id;
    msg.chat = msg.key.remoteJid;
    msg.from = msg.chat.startsWith("status")
      ? jidNormalizedUser(msg.key.participant || msg.participant)
      : jidNormalizedUser(msg.chat);
    msg.isBaileys = msg.id
      ? (msg.id.startsWith("3EB0") || msg.id.startsWith("B1E") || msg.id.startsWith("BAE") || msg.id.startsWith("3F8"))
      : false;
    msg.fromMe = msg.key.fromMe;
    msg.isGroup = msg.chat.endsWith("@g.us");
    msg.sender = sock.decodeJid(msg.fromMe ? sock.user.id : (msg.participant || msg.key.participant || msg.chat));
    if (msg.isGroup) msg.participant = sock.decodeJid(msg.key.participant) || "";
  }

  if (msg.message) {
    msg.mtype = getContentType(msg.message);
    msg.prefix = ".";
    const content = msg.message[msg.mtype];
    msg.msg = (msg.mtype === "viewOnceMessage")
      ? msg.message[msg.mtype].message[getContentType(msg.message[msg.mtype].message)]
      : content;

    msg.body = msg?.message?.conversation ||
      msg?.msg?.caption ||
      msg?.msg?.text ||
      (msg.mtype === "extendedTextMessage" && msg.msg.text) ||
      (msg.mtype === "buttonsResponseMessage" && msg.msg.selectedButtonId) ||
      (msg.mtype === "interactiveResponseMessage" && JSON.parse(msg.msg.nativeFlowResponseMessage.paramsJson)?.id) ||
      (msg.mtype === "templateButtonReplyMessage" && msg.msg.selectedId) ||
      (msg.mtype === "listResponseMessage" && msg.msg.singleSelectReply?.selectedRowId) ||
      "";

    let quoted = msg.quoted = msg.msg?.contextInfo?.quotedMessage || null;
    msg.mentionedJid = msg.msg?.contextInfo?.mentionedJid || [];

    if (quoted) {
      let quotedType = getContentType(quoted);
      msg.quoted = quoted[quotedType];
      if (quotedType === "productMessage") {
        quotedType = getContentType(msg.quoted);
        msg.quoted = msg.quoted[quotedType];
      }
      if (typeof msg.quoted === "string") msg.quoted = { text: msg.quoted };

      msg.quoted.key = {
        remoteJid: msg.msg.contextInfo.remoteJid || msg.from,
        participant: jidNormalizedUser(msg.msg.contextInfo.participant),
        fromMe: areJidsSameUser(jidNormalizedUser(msg.msg.contextInfo.participant), jidNormalizedUser(sock.user.id)),
        id: msg.msg.contextInfo.stanzaId
      };

      msg.quoted.mtype = quotedType;
      msg.quoted.chat = msg.quoted.key.remoteJid;
      msg.quoted.id = msg.quoted.key.id;
      msg.quoted.from = /g\.us|status/.test(msg.quoted.chat) ? msg.quoted.key.participant : msg.quoted.chat;
      msg.quoted.isBaileys = msg.quoted.id
        ? (msg.quoted.id.startsWith("3EB0") || msg.quoted.id.startsWith("B1E") || msg.quoted.id.startsWith("3F8") || msg.quoted.id.startsWith("BAE"))
        : false;
      msg.quoted.sender = sock.decodeJid(msg.quoted.key.participant);
      msg.quoted.fromMe = areJidsSameUser(
        jidNormalizedUser(msg.quoted.sender),
        jidNormalizedUser(sock.user.id)
      );
      msg.quoted.text = msg.quoted.text || msg.quoted.caption || msg.quoted.conversation ||
        msg.quoted.contentText || msg.quoted.selectedDisplayText || msg.quoted.title || "";
      msg.quoted.mentionedJid = msg.msg.contextInfo?.mentionedJid || [];

      const fakeObj = proto.WebMessageInfo.fromObject({
        key: msg.quoted.key,
        message: quoted,
        ...(msg.isGroup ? { participant: msg.quoted.sender } : {})
      });
      msg.quoted.fakeObj = fakeObj;

      msg.quoted.download = (saveToFile = false) =>
        sock.downloadM(msg.quoted, msg.quoted.mtype.replace(/message/i, ""), saveToFile);
    }
  }

  if (msg.msg?.url)
    msg.download = (saveToFile = false) =>
      sock.downloadM(msg.msg, msg.mtype.replace(/message/i, ""), saveToFile);

  msg.text = msg.body;

  msg.reply = async (text, options = {}) => {
    const chat = options.chat || msg.chat;
    const quoted = options.quoted || msg;
    const mentions = [...(text.matchAll(/@(\d{0,16})/g))].map(m => m[1] + "@s.whatsapp.net");
    return sock.sendMessage(chat, { text, mentions, ...options }, { quoted });
  };

  return msg;
};

// auto-reload bila file diubah
const __filename = fileURLToPath(import.meta.url);
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(chalk.white.bold("~> Update File:"), chalk.green.bold(__filename));
  import(`${pathToFileURL(__filename).href}?update=${Date.now()}`);
});