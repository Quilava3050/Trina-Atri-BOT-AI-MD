import { delay } from 'baileys';

let handler = async (m, { sock, conn, text, usedPrefix, command }) => {
   const client = sock || conn;

   if (!m.quoted) {
      return m.reply(`Reply pesan yang ingin diproses.\nContoh: *${usedPrefix + command} teks baru*`);
   }

   if (!text) {
      return m.reply(`Masukkan teks pengganti.\nContoh: *${usedPrefix + command} halo dunia*`);
   }

   const stanzaId = m.quoted.id; // target stanza

   try {
      const tempId = await client.relayMessage(
         m.chat,
         {
            extendedTextMessage: {
               text: '',
               contextInfo: {
                  isGroupStatus: true,
               },
            },
         },
         {}
      );

      const tempId2 = await client.relayMessage(
         m.chat,
         {
            protocolMessage: {
               key: {
                  remoteJid: m.chat,
                  fromMe: true,
                  id: tempId,
               },
               type: 14,
               editedMessage: {
                  extendedTextMessage: {
                     text: text,
                     contextInfo: {
                        isGroupStatus: false,
                     },
                  },
               },
            },
         },
         {
            messageId: stanzaId,
         }
      );

      await delay(100);

      await Promise.allSettled([
         client.sendMessage(m.chat, {
            delete: {
               remoteJid: m.chat,
               id: tempId,
               fromMe: true,
            },
         }),
         client.sendMessage(m.chat, {
            delete: {
               remoteJid: m.chat,
               id: tempId2,
               fromMe: true,
            },
         }),
      ]);
   } catch (e) {
      console.error('[fakemsg]', e);
      await m.reply('Error: ' + (e?.message || e));
   }
};

handler.help = ['fakemsg <teks>'];
handler.tags = ['owner'];
handler.command = ['fakemsg']
handler.owner = true;
handler.group = true;

export default handler;