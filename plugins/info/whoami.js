let handler = async (m, { sock, isOwner, isAdmin, isBotAdmin }) => {
  try {
    const jid = m.sender || ''
    const base = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '')

    const text = `*─── [ CHECK STATUS ] ───*

◦ *Jid:* ${jid}
◦ *Base Number:* ${base}
◦ *isOwner:* ${isOwner ? '✅ True' : '❌ False'}
◦ *isAdmin:* ${isAdmin ? '✅ True' : '❌ False'}
◦ *isBotAdmin:* ${isBotAdmin ? '✅ True' : '❌ False'}
◦ *isGroup:* ${m.isGroup ? '✅ True' : '❌ False'}`

    if (typeof m.reply === 'function') {
      await m.reply(text)
    } else if (sock?.sendMessage) {
      await sock.sendMessage(m.chat, { text }, { quoted: m })
    }
  } catch (e) {
    console.error('[Error Cek Status]:', e)
    if (typeof m.reply === 'function') {
      await m.reply('❌ Gagal mendapatkan status owner/admin!')
    }
  }
}

handler.help = ['whoami', 'cekowner', 'cekstatus']
handler.tags = ['info']
handler.command = ['whoami', 'cekowner', 'cekstatus']

export default handler