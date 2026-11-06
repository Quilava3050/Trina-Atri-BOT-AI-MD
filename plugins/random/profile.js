let handler = async (m, { sock, text, usedPrefix, command }) => {
    let who

    if (text?.trim().toLowerCase() === 'me') {
        who = m.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        who = m.mentionedJid[0]
    } else if (m.quoted) {
        who = m.quoted.sender
    } else if (text) {
        who = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    } else {
        who = m.sender
    }

    await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

    try {
        let url = await sock.profilePictureUrl(who, 'image')
        
        let caption = `乂  *G E T  P R O F I L E* 乂\n\n`
        caption += `┌  ◦ *Target:* @${who.split('@')[0]}\n`
        caption += `└  ◦ *Status:* Berhasil diambil ✅`

        await sock.sendMessage(m.chat, {
            image: { url: url },
            caption: caption,
            mentions: [who]
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        let failText = `⚠️ *Gagal mengambil foto profil!*\n\nTarget @${who.split('@')[0]} mungkin:\n1. Tidak memasang foto profil.\n2. Foto profil di-privasi (Hanya Kontak).\n3. Nomor tidak valid.`
        
        await sock.sendMessage(m.chat, {
            text: failText,
            mentions: [who]
        }, { quoted: m })
    }
}

handler.help = ['getpp <@tag/reply/nomor>']
handler.tags = ['tools', 'group']
handler.command = ['getpp','pp','me','profile']


export default handler