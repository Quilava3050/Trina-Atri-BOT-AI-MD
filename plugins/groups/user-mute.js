
const handler = async (m, { sock, args, command, reply, usedPrefix, chatDb, db }) => {

  let mutedUsers = [];
  try {
      mutedUsers = JSON.parse(chatDb.muted_users || '[]');
  } catch (e) {
      console.error('Error parsing muted_users JSON:', e);
      mutedUsers = [];
  }

  if (command === 'mute') {
    let num;
    if (m.quoted) {
      num = m.quoted.sender;
    } else if (m.mentionedJid?.length) {
      num = m.mentionedJid[0];
    } else if (args[0]) {
      num = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    } else {
      return reply(`Contoh: *${usedPrefix + command} @tag* atau reply pesan target.`);
    }

    if (mutedUsers.includes(num)) {
      return reply(`User @${num.split('@')[0]} sudah di-mute sebelumnya.`, { mentions: [num] });
    }

    mutedUsers.push(num);

    await db('groups', m.chat, 'muted_users', JSON.stringify(mutedUsers));
    
    return reply(`Berhasil mute @${num.split('@')[0]}`, { mentions: [num] });
  }

  if (command === 'unmute') {
    let num;
    if (m.quoted) {
      num = m.quoted.sender;
    } else if (m.mentionedJid?.length) {
      num = m.mentionedJid[0];
    } else if (args[0]) {
      num = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    } else {
      return reply(`Contoh: *${usedPrefix + command} @tag* atau reply pesan target.`);
    }

    if (!mutedUsers.includes(num)) {
      return reply(`User @${num.split('@')[0]} tidak sedang di-mute.`, { mentions: [num] });
    }

    mutedUsers = mutedUsers.filter(u => u !== num);

    await db('groups', m.chat, 'muted_users', JSON.stringify(mutedUsers));
    
    return reply(`Berhasil unmute @${num.split('@')[0]}.`, { mentions: [num] });
  }

  if (command === 'listmute') {
    if (!mutedUsers || !mutedUsers.length) {
      return reply('Tidak ada user yang di-mute di grup ini.');
    }

    let teks = '*DAFTAR USER DI-MUTE:*\n\n';
    mutedUsers.forEach((u, i) => {
        teks += `${i + 1}. @${u.split('@')[0]}\n`;
    });

    return sock.sendMessage(m.chat, {
      text: teks,
      mentions: mutedUsers
    }, { quoted: m });
  }
}

handler.command = ['mute', 'unmute', 'listmute'];
handler.owner = true
handler.admin = true
handler.group = true

export default handler;