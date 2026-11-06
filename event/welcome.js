import fs from "fs";
import "../settings.js";
import "../control/function.js";
import { getGroup } from "../control/database.js"; 

const getParticipantJid = participant => {
   if (typeof participant === "string") return participant;
   if (!participant || typeof participant !== "object") return "";

   return participant.phoneNumber || participant.jid || participant.id || participant.lid || "";
};

async function WelcomeMessage(sock, update) {
   try {
      const { id, author, participants, action } = update;
      const groupData = await getGroup(id);

      let metadata;
      let groupName = "Group WhatsApp"; 
      let totalMembers = 0;
      let totalAdmins = 0;

      try {
         metadata = await sock.groupMetadata(id);
         groupName = metadata.subject;
         totalMembers = metadata.participants.length;
         totalAdmins = metadata.participants.filter(v => v.admin !== null).length; 
      } catch (e) {
         console.log("Gagal ambil metadata grup.");
      }
            
      for (let n of participants) {
         let teks = "";

         // 1. Dapatkan String JID dari Objek/String menggunakan fungsi pembantu
         const participantJid = getParticipantJid(n);
         if (!participantJid) continue;

         // 2. Ambil angka nomor HP untuk display @mention
         let userJid = participantJid.split("@")[0];
         let actor = author ? getParticipantJid(author).split("@")[0] : "Admin";

         // Fake Quoted minimalis & unik sesuai aksi
         const getQuoted = (titleText) => ({
            key: { 
               remoteJid: "0@s.whatsapp.net", 
               participant: "0@s.whatsapp.net" 
            },
            message: { 
               extendedTextMessage: { 
                  text: `📌 Notification: ${titleText}` 
               } 
            }
         });

         if (action === "add") {
            if (groupData.welcome !== 1) continue;
            
            const defaultWelcome = `👋 *WELCOME TO GROUP*\n` +
               `─────────────\n` +
               `◦ *Member:* @${userJid}\n` +
               `◦ *Grup:* ${groupName}\n` +
               `◦ *Total Member:* ${totalMembers} Anggota\n` +
               `─────────────\n` +
               `Ketik *.intro* untuk perkenalan.\n` +
               `*Jangan lupa baca deskripsi grup yaa kak!* ✨`;

            teks = groupData.welcome_text 
               ? groupData.welcome_text.replace(/@user/g, `@${userJid}`).replace(/@namagrup/g, `*${groupName}*`).replace(/@total/g, totalMembers)
               : defaultWelcome;

            await sock.sendMessage(id, {
               text: teks,
               contextInfo: {
                  mentionedJid: author ? [getParticipantJid(author), participantJid] : [participantJid]
               }
            }, { quoted: getQuoted(`Welcome Message | ${groupName}`) });

         } else if (action === "remove") {
            if (groupData.goodbye !== 1) continue;

            const defaultGoodbye = `👋 *GOODBYE MEMBER*\n` +
               `─────────────\n` +
               `◦ *Member:* @${userJid}\n` +
               `◦ *Grup:* ${groupName}\n` +
               `◦ *Sisa Member:* ${totalMembers} Anggota\n` +
               `─────────────\n` +
               `Yahh, malah keluar dari grup... Sampai jumpa lagi!`;

            teks = groupData.goodbye_text 
               ? groupData.goodbye_text.replace(/@user/g, `@${userJid}`).replace(/@namagrup/g, `*${groupName}*`).replace(/@total/g, totalMembers)
               : defaultGoodbye;

            await sock.sendMessage(id, {
               text: teks,
               contextInfo: {
                  mentionedJid: author ? [getParticipantJid(author), participantJid] : [participantJid]
               }
            }, { quoted: getQuoted(`Goodbye Message | ${groupName}`) });

         } else if (action === "promote") {
            if (groupData.welcome !== 1) continue;

            teks = `⭐ *PROMOTE INFORMATION*\n` +
               `─────────────\n` +
               `◦ *User:* @${userJid}\n` +
               `◦ *Status:* Anggota ➔ *Admin*\n` +
               `◦ *Oleh:* @${actor}\n` +
               `◦ *Total Admin:* ${totalAdmins} Orang\n` +
               `─────────────\n` +
               `Selamat atas jabatan barunya! Tetap jaga ketertiban grup ya~`;

            await sock.sendMessage(id, {
               text: teks,
               contextInfo: {
                  mentionedJid: author ? [getParticipantJid(author), participantJid] : [participantJid]
               }
            }, { quoted: getQuoted(`Promote System | ${groupName}`) });

         } else if (action === "demote") {
            if (groupData.welcome !== 1) continue;

            teks = `📢 *DEMOTE INFORMATION*\n` +
               `─────────────\n` +
               `◦ *User:* @${userJid}\n` +
               `◦ *Status:* Admin ➔ *Member*\n` +
               `◦ *Oleh:* @${actor}\n` +
               `◦ *Total Admin:* ${totalAdmins} Orang\n` +
               `─────────────\n` +
               `Masa jabatan admin telah berakhir. Terima kasih atas kontribusinya!`;

            await sock.sendMessage(id, {
               text: teks,
               contextInfo: {
                  mentionedJid: author ? [getParticipantJid(author), participantJid] : [participantJid]
               }
            }, { quoted: getQuoted(`Demote System | ${groupName}`) });
         }
      }
   } catch (e) {
      console.log("Error di WelcomeMessage:", e);
   }
}

export default WelcomeMessage;