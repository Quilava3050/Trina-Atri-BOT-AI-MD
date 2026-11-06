import "../../fitur/listmenu.js"

import axios from "axios"
import { Jimp } from 'jimp';
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { generateWAMessageFromContent, prepareWAMessageMedia, proto, generateWAMessageContent } from "@whiskeysockets/baileys"
import { readMenuStyle } from "../../control/menu-settings.js";

const execFileAsync = promisify(execFile);

const getBuffer = async (url) => {
    try {
        const res = await axios({
            method: "get",
            url,
            headers: { 'DNT': 1, 'Upgrade-Insecure-Requests': 1 },
            responseType: 'arraybuffer'
        });
        return Buffer.from(res.data);
    } catch (e) {
        return null;
    }
};

// Dibuat fungsi helper agar pembacaan thumbnail aman & kompatibel Jimp v1
const getThumbnailBuffer = async () => {
    try {
        const rawBuffer = await getBuffer(global.fotoBot);
        if (!rawBuffer) return Buffer.alloc(0);
        
        const image = await Jimp.read(rawBuffer);
        // Format resize & buffer baru untuk Jimp v1
        image.resize({ w: 200, h: 200 });
        return await image.getBuffer('image/jpeg');
    } catch (e) {
        return Buffer.alloc(0);
    }
};

const sendRandomVoice = async (sock, m) => {
  const voiceNumber = Math.floor(Math.random() * 3) + 1;
  const inputPath = path.join(process.cwd(), "media", `voice${voiceNumber}.mpeg`);
  const outputPath = path.join(process.cwd(), "temp", `menu_voice_${randomUUID()}.ogg`);

  if (!fs.existsSync(inputPath)) return;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  try {
    await execFileAsync(ffmpegInstaller.path, [
      "-y",
      "-i", inputPath,
      "-vn",
      "-c:a", "libopus",
      "-b:a", "64k",
      "-ac", "1",
      "-ar", "48000",
      "-map_metadata", "-1",
      outputPath
    ], { maxBuffer: 10 * 1024 * 1024 });

    await sock.sendMessage(m.chat, {
      audio: fs.readFileSync(outputPath),
      mimetype: "audio/ogg; codecs=opus",
      ptt: true
    }, { quoted: m });
  } catch (error) {
    const details = error.stderr?.trim().slice(-2000) || error.message || error;
    console.error("[MENU VOICE] Gagal mengirim voice note:", details);
  } finally {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
};

const sendMenuByType = async ( sock, m, menuType, teks, qkontak2, usedPrefix ) => {

//MENU TYPE 1 
if (menuType === 1) {
return sock.sendMessage(m.chat, {
  document: global.fotoBot,
    mimetype: "application/pdf",
    fileName: global.namaBot,
    caption: teks,
      contextInfo: {
         mentionedJid: [m.sender],
         isForwarded: true,
            forwardedNewsletterMessageInfo: {
             newsletterJid: global.idChannel,
             newsletterName: `version | ${global.versiBot}`,
            },
            externalAdReply: {
             title: `© ${global.namaBot}`,
             body: "",
             thumbnailUrl: global.qris,
             sourceUrl: "",
             mediaType: 1,
             renderLargerThumbnail: true
           }
        }
    }, { quoted: qkontak2 })
}

//MENU TYPE 2
if (menuType === 2) {
return sock.sendMessage(m.chat, {
    text: teks,
    contextInfo: {
       mentionedJid: [m.sender],
       isForwarded: true,
         forwardedNewsletterMessageInfo: {
            newsletterJid: global.idChannel,
            newsletterName: `version | ${global.versiBot}`,
         },
         externalAdReply: {
            title: `© ${global.namaBot}`,
            body: "",
            thumbnailUrl: global.qris,
            sourceUrl: "",
            mediaType: 1,
            renderLargerThumbnail: true
         }
      }
    }, { quoted: qkontak2 })
}

//TYPE MENU 3
if (menuType === 3) {
return sock.sendMessage(m.chat, {
  image: global.fotoBot,
   caption: teks,
    contextInfo: {
      mentionedJid: [m.sender],
      isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: global.idChannel,
          newsletterName: `version | ${global.versiBot}`,
        },
      }
    }, { quoted: qkontak2 })
}

//TYPE MENU 4
if (menuType === 4) {
   const media = await prepareWAMessageMedia(
      { image: global.fotoBot },
      { upload: sock.waUploadToServer }
   );

    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: {
            body: { text: teks },
            mentions: [m.sender],
            footer: { text: `\nRUN : ${runtime(process.uptime())}`},
            header: {
              hasMediaAttachment: true,
              imageMessage: media.imageMessage
            },
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 1,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: global.idChannel,
                newsletterName: `version | ${global.versiBot}`,
              },
            },
            nativeFlowMessage: {
              messageParamsJson: JSON.stringify({
                limited_time_offer: {
                  text: `ジャー`,
                  url: "https://t.me/qil_qila",
                  copy_code: "Hai Im Trina",
                  expiration_time: Date.now() + (24 * 60 * 60 * 1000)
                },
                bottom_sheet: {
                  in_thread_buttons_limit: 1,
                  divider_indices: [1, 2, 3],
                  list_title: `${global.namaBot} | version ${global.versiBot}`,
                  button_title: "MENU"
                }
              }),
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: JSON.stringify({
                    title: "list selection",
                    sections: [
                      {
                        title: "BUTTONS LIST",
                        highlight_label: "HOT",
                        rows: [
                          { title: "ALLMENU", description: "Displays all commands in the bot", id: `${usedPrefix}menu all` },
                          { title: "SCRIPT", description: "Displays script information", id: `${usedPrefix}sc` },
                          { title: "TOTAL FITUR", description: "Showing total features", id: `${usedPrefix}totalfitur` },
                          { title: "PING", description: "Check the platform running the bot", id: `${usedPrefix}ping` },
                        ]
                      }
                    ],
                    has_multiple_buttons: true
                  })
                },
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "BUY SCRIPT & CONTACT SUPPORT",
                    url: "https://t.me/qil_qila",
                    has_multiple_buttons: true
                  })
                },
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "JOIN CHANNEL",
                    url: "https://whatsapp.com/channel/0029VbAu5Ng0G0XrGE2Uz51W",
                    has_multiple_buttons: true
                  })
                },
              ],
            }
          }
        }
      }
    }, { quoted: qkontak2 });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
   }

//TYPE MENU 5
if (menuType === 5) {
   return sock.sendMessage(
            m.chat,
            {
                text: teks,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: `© ${global.namaBot} | powered by ${global.namaOwner}`,
                        thumbnailUrl: "https://chat.whatsapp.com/LGbxmgibQ9A4hjqPfsjMQg",
                        sourceUrl: "https://chat.whatsapp.com/LGbxmgibQ9A4hjqPfsjMQg",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            },
            { quoted: qkontak2 })
      }

//TYPE MENU 6
if (menuType === 6) {
return sock.sendMessage(m.chat, {
  image: global.fotoBot,
   caption: "",
   footer: teks,
   interactiveButtons: [],
    contextInfo: {
      mentionedJid: [m.sender],
      isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: global.idChannel,
          newsletterName: `version | ${global.versiBot}`,
        },
      }
   }, { quoted: qkontak2 })
 }
 
//TYPE MENU 7
if (menuType === 7) {
return sock.sendMessage(m.chat, {
  image: global.fotoOwner,
    caption: teks,
    contextInfo: {
       mentionedJid: [m.sender],
       isForwarded: true,
         forwardedNewsletterMessageInfo: {
            newsletterJid: global.idChannel,
            newsletterName: `version | ${global.versiBot}`,
         },
         externalAdReply: {
            title: `© ${global.namaBot}`,
            body: "",
            thumbnailUrl: global.qris,
            sourceUrl: "",
            mediaType: 1,
            renderLargerThumbnail: true
         }
      }
   }, { quoted: qkontak2 })
 }

//TYPE MENU 8
if (menuType === 8) {
    const rawBuffer = await getBuffer(global.fotoBot);
    const thumbnailBuffer = await getThumbnailBuffer();

    return sock.sendMessage(m.chat, {
        document: rawBuffer || Buffer.alloc(0), 
        fileName: `© [${global.namaBot}]`,
        mimetype: "image/png",
        fileLength: 1,
        jpegThumbnail: thumbnailBuffer, 
        caption: teks,
        contextInfo: {
            isForwarded: true,
            mentionedJid: [m.sender],
            forwardedNewsletterMessageInfo: {
                newsletterName: `developer | ジャー`,
                newsletterJid: global.idChannel
            }
        }
    }, { quoted: qkontak2 });
 }
 
//TYPE MENU 9
if (menuType === 9) {
let msg = await generateWAMessageFromContent(m.chat, {
  interactiveMessage: {
    body: { text: teks},
    footer: { text: `\nRUN : ${runtime(process.uptime())}`},
    contextInfo: {
      mentionedJid: [m.sender]
    },
    header: {
      title: `© ${global.namaBot}`,
      hasMediaAttachment: true,
      productMessage: {
        product: {
          productImage: await (async () => {
            const { imageMessage } = await generateWAMessageContent(
              { image: global.fotoBot },
              { upload: sock.waUploadToServer }
            )
            return imageMessage
          })(),
          productId: "9116471035103640",
          title: `${global.namaBot}`,
          currencyCode: "IDR",
          priceAmount1000: "100000000",
          retailerId: "4144242",
          url: "https://wa.me/c/6285185011474",
          productImageCount: 1
        },
        businessOwnerJid: "6285185011474@s.whatsapp.net"
      }
    },
    nativeFlowMessage: {
      buttons: [
        {
          name: 'galaxy_message',
          buttonParamsJson: JSON.stringify({
            mode: 'published',
            flow_message_version: '3',
            flow_token: '1:1307913409923914:293680f87029f5a13d1ec5e35e718af3',
            flow_id: '1307913409923914',
            flow_cta: '',
            flow_action: ' × ',
            flow_action_payload: {
              screen: 'QUESTION_ONE',
              params: {
                user_id: '123456789',
                referral: 'campaign_xyz'
              }
            },
            flow_metadata: {
              flow_json_version: '201',
              data_api_protocol: 'v2',
              flow_name: 'Lead Qualification [en]',
              data_api_version: 'v2',
              categories: ['Lead Generation', 'Sales']
            }
          })
        },
        {
          name: 'catalog_message',
          buttonParamsJson: JSON.stringify({
            thumbnail_product_retailer_id: '4144242'
          })
        }
      ]
    }
  }
}, { quoted: qkontak2 })

await sock.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id })
 }

}

const handler = async ( m, { sock, text, reply, usedPrefix, totalBan, statusUsr, qkontak2 }) => {

const menuType = readMenuStyle();

const prfx = global.multiprefix? `${global.prefix || "."}`: "multi prefix"
let sub = (text ?? "").trim().toLowerCase()

const headerInfo = `\`\`\`Your info\`\`\`
   • Your name : ${m.pushName}
   • Your status : ${statusUsr}`

const sendMenu = async (teks, type = menuType) => sendMenuByType( sock, m, type, teks, qkontak2, usedPrefix )

if (sub === "") {
const teks = `Hello @${m.sender.split("@")[0]}

\`\`\`Script information\`\`\`
   • Name bot : *${global.namaBot}*
   • Version bot : *${global.versiBot}*
   • Developer : *${global.namaOwner}*
   • Library : *baileys*
   • Database security : *number matching*
   • Type : *plugins*
   • Modules : *ESM*

\`\`\`Other information\`\`\`
   • Type menu : *${menuType}*
   • Mode bot : ${global.public ? "*public*" : "*private*"}
   • Prefix : *${prfx}*
   • User banned : *${totalBan}* 

\`\`\`Menu list\`\`\`
   ├── ${usedPrefix}menu all
   ├── ${usedPrefix}menu owner
   ├── ${usedPrefix}menu tools
   ├── ${usedPrefix}menu ai
   ├── ${usedPrefix}menu search
   ├── ${usedPrefix}menu stalk
   ├── ${usedPrefix}menu download
   ├── ${usedPrefix}menu maker
   ├── ${usedPrefix}menu fun
   ├── ${usedPrefix}menu grup
   ├── ${usedPrefix}menu asupan
   ├── ${usedPrefix}menu islam
   └── ${usedPrefix}menu info`
await sendMenu(teks, menuType)
await sendRandomVoice(sock, m)
return
}

switch (sub) {
case "all":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | allmenu ]*

\`\`\`Script information\`\`\`
   • Name bot : *${global.namaBot}*
   • Version bot : *${global.versiBot}*
   • Developer : *${global.namaOwner}*
   • Library : *baileys*
   • Database security : *number matching*
   • Type : *plugins*
   • Modules : *ESM*

${headerInfo}

${global.allmenu()}`)

case "owner":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | owner ]*

${headerInfo}

${global.ownmenu()}`)

case "tools":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | tools ]*

${headerInfo}

${global.tools()}`)

case "ai":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | AI ]*

${headerInfo}

${global.aimenu()}`)

case "download":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | downloader ]*

${headerInfo}

${global.download()}`)

case "stalk":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | stalk ]*

${headerInfo}

${global.stalk()}`)

case "search":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | search ]*

${headerInfo}

${global.search()}`)

case "grup":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | groups ]*

${headerInfo}

${global.grup()}`)

case "islam":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | Islamic ]*

${headerInfo}

${global.islam()}`)

case "fun":
case "game":
return sendMenu(
`Hello @${m.sender.split("@")[0]}
> *[ Category menu | games ]*

${headerInfo}

${global.fun()}`)

case "asupan":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | asupan ]*

${headerInfo}

${global.asupan()}`)

case "maker":
return sendMenu(
`Hello @${m.sender.split("@")[0]}
> *[ Category menu | maker ]*

${headerInfo}

${global.maker()}`)

case "random":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | RANDOM ]*

${headerInfo}

${global.random()}`
)

case "setbot":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | SETBOT ]*

${headerInfo}

${global.setbot()}`
)

case "info":
return sendMenu(`Hello @${m.sender.split("@")[0]}
> *[ Category menu | info ]*

${headerInfo}

${global.info()}`)

default:
return reply(
`Submenu *${sub}* tidak ditemukan.

Gunakan:
${usedPrefix}menu`)
}
}

handler.command = ["menu"]
export default handler