let handler = async (m, { sock, text, usedPrefix, command }) => {
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
    if (!text) {
      return sock.sendMessage(m.chat, { 
        text: `*Kirim link grup WhatsApp!*\n\n*Contoh:*\n${usedPrefix + command} https://chat.whatsapp.com/L1234567890ABCDEFG` 
      }, { quoted: fkontak })
    }

    // Regex untuk mengambil Kode Invite dari link WhatsApp
    const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i
    const match = text.match(linkRegex)

    if (!match || !match[1]) {
      return sock.sendMessage(m.chat, { 
        text: '❌ *Link grup tidak valid!* Pastikan link menggunakan domain `chat.whatsapp.com`.' 
      }, { quoted: fkontak })
    }

    const inviteCode = match[1]
    await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    // Memanggil fungsi Baileys untuk join grup via kode invite
    const res = await sock.groupAcceptInvite(inviteCode)

    await sock.sendMessage(m.chat, { 
      text: `✅ *Berhasil bergabung ke grup!*\n\n🆔 *Group ID:* ${res}` 
    }, { quoted: fkontak })

    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('[JOIN GROUP ERROR]:', e)
    
    let errMsg = 'Terjadi kesalahan saat mencoba bergabung ke grup.'
    if (e?.status === 401 || e?.message?.includes('not-authorized')) {
      errMsg = 'Gagal join! Bot mungkin telah dikeluarkan sebelumnya atau dibanned dari grup tersebut.'
    } else if (e?.status === 404 || e?.message?.includes('resource-limit')) {
      errMsg = 'Link grup sudah tidak berlaku / expired.'
    } else if (e?.status === 409 || e?.message?.includes('conflict')) {
      errMsg = 'Bot sudah berada di dalam grup tersebut!'
    }

    await sock.sendMessage(m.chat, { 
      text: `❌ *Gagal Join:* ${errMsg}` 
    }, { quoted: fkontak })
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
  }
}

handler.help = ['join <link_grup>']
handler.tags = ['owner']
handler.command = ['join', 'joingc', 'joingroup']
handler.owner = true

export default handler