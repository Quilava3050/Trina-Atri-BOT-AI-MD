import { delay } from '@whiskeysockets/baileys';

const handler = async (m, { sock, conn, args, text, usedPrefix, command }) => {
  const client = sock || conn || global.sock || global.conn;

  if (!client?.relayMessage) {
    return m.reply("Koneksi bot tidak mendukung relayMessage.");
  }

  if (!text || !parseInt(args[0], 10)) {
    return m.reply(`Contoh penggunaan: *${usedPrefix + command} <jumlah> <?target> <?delay>*`);
  }

  const [jump, target, dely] = args;
  const much = parseInt(jump, 10);
  const sabar = parseInt(dely, 10) || 500;

  // Formatting & sanitasi JID target
  let sendto;
  if (!target || target === "here") {
    sendto = m.chat;
  } else if (target.includes("@")) {
    sendto = target;
  } else {
    const cleanNum = target.replace(/[^0-9]/g, "");
    sendto = cleanNum ? `${cleanNum}@s.whatsapp.net` : m.chat;
  }

  if (!sendto) {
    return m.reply("JID / Target chat tidak valid.");
  }

  const notif = {
    sessionTransparencyMetadata: {
      disclaimerText: "~ let me know",
      hcaId: `hca_${Date.now()}`,
      sessionTransparencyType: 1
    }
  };

  const mContextInfo = {
    messageContextInfo: {
      botMetadata: {
        ...notif
      }
    }
  };

  const reaction = {
    ...mContextInfo,
    reactionMessage: {
      key: {
        remoteJid: sendto,
        id: m.id,
        fromMe: false
      },
      text: ""
    }
  };

  await client.sendMessage(m.chat, {
    react: { text: "⏳", key: m.key }
  });

  for (let i = 0; i < much; i++) {
    await client.relayMessage(sendto, reaction, {
      additionalAttributes: {
        type: "reaction"
      }
    });

    await delay(sabar);
  }

  await client.sendMessage(m.chat, {
    react: { text: "", key: m.key }
  });
};

handler.command = ["notify"];
handler.help = ["notify <jumlah> <?target> <?delay>"];
handler.tags = ["owner"];
handler.owner = true;

export default handler;