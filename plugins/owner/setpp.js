let handler = async (m, { sock, usedPrefix, command }) => {
  // Objek Fake Quote (fkontak)
  const fkontak = {
    key: {
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast"
    },
    message: {
      contactMessage: {
        displayName: global.namaOwner || "Owner",
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${global.namaOwner || "Owner"};;;\nFN:${global.namaOwner || "Owner"}\nEND:VCARD`
      }
    }
  }

  try {
    // Ambil JID Bot dari sock
    const botJid = sock.user.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : sock.user.jid
    
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''

    if (!mime.startsWith('image/')) {
      return sock.sendMessage(m.chat, { 
        text: `Kirim atau reply gambar dengan caption *${usedPrefix + command}*` 
      }, { quoted: fkontak })
    }

    await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    const img = await q.download()
    if (!img) throw new Error('Gagal mengunduh gambar!')

    // Update Foto Profil Bot
    await sock.updateProfilePicture(botJid, img)

    await sock.sendMessage(m.chat, { 
      text: '✅ Sukses Mengganti Foto Profile Bot!' 
    }, { quoted: fkontak })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { 
      text: `❌ *Error:* ${e.message}` 
    }, { quoted: fkontak })
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
  }
}

handler.help = ['setbotpp']
handler.tags = ['owner']
handler.command = ['setbotpp', 'setppbot', 'setpp']
handler.owner = true

export default handler