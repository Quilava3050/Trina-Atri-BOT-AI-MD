/*
  ** Fitur kompres size foto 
  ** Sumber Fitur 
   https://whatsapp.com/channel/0029VbBoflt4dTnNWXV4zC09
  
  ** Sumber Scrape:
   https://whatsapp.com/channel/0029Vb4jDY82ER6beeXLOp0k
*/

import axios from "axios";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp"; 

const MAX_SIZE = 5 * 1024 * 1024; 

const handler = async (m, { sock, usedPrefix, command }) => {
  try {

    let mediaMessage;
    if (m.message?.imageMessage) mediaMessage = m.message.imageMessage;
    else if (m.message?.documentMessage && m.message.documentMessage.mimetype.startsWith('image/')) {
      mediaMessage = m.message.documentMessage;
    } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
      mediaMessage = m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
    } else {
      return m.reply(`Ex: ${usedPrefix + command} dengan kirim foto/reply foto`);
    }

    const filePath = await sock.downloadAndSaveMediaMessage(mediaMessage, './tmp');
    let buffer = await fs.readFile(filePath);

    if (buffer.length > MAX_SIZE) return m.reply('Ukuran gambar maksimal 5MB!');

    buffer = await sharp(buffer)
      .resize({ width: Math.floor(0.6 * 1024) }) 
      .toBuffer();
      
    async function tinyOnce(buf, cookies = "") {
      const res = await axios.post(
        "https://tinyjpg.com/backend/opt/shrink",
        buf,
        {
          headers: {
            "Content-Type": "image/png",
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://tinyjpg.com/",
            "Origin": "https://tinyjpg.com",
            "Cookie": cookies
          },
          responseType: "json"
        }
      );
      return res.data;
    }

    async function fetchOutput(url) {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      return Buffer.from(res.data);
    }

    async function tinyCompress(buf, cookies = "", times = 3) {
      let lastJson = null;
      for (let i = 0; i < times; i++) {
        const json = await tinyOnce(buf, cookies);
        lastJson = json;
        buf = await fetchOutput(json.output.url);
      }
      return { buffer: buf, lastJson };
    }

    const cookies = "CookieConsent=...; _ga=...; __stripe_mid=..."; 
    const { buffer: compressedBuffer, lastJson } = await tinyCompress(buffer, cookies); 
    await sock.sendMessage(m.chat, {
      image: compressedBuffer,
      caption:`*Successfully compress the image!*
      
- Initial size: *${(buffer.length / 1024).toFixed(2)} KB*
- Size after compression: *${(compressedBuffer.length / 1024).toFixed(2)} KB*`
    }, { quoted: m });

    await fs.unlink(filePath);

  } catch (e) {
    m.reply(e.message);
  }
};
handler.command = ["cimg", "tiny", "kompresimg", "kompresfoto"];
export default handler;