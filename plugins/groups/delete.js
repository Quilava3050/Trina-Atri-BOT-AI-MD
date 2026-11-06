const handler = async (m, { sock, reply, example, isBotAdmin }) => {

  if (!m.quoted) return reply(example("reply pesannya"))

  if (m.quoted.fromMe) {
    return sock.sendMessage(m.chat, { 
      delete: { remoteJid: m.chat, fromMe: true, id: m.quoted.id, participant: m.quoted.sender }
    })
  } else {
    if (!isBotAdmin) return reply(mess.botAdmin)
    return sock.sendMessage(m.chat, { 
      delete: { remoteJid: m.chat, fromMe: false, id: m.quoted.id, participant: m.quoted.sender }
    })
  }
}

handler.command = ["delete", "del", "d"] 
handler.admin   = true  

export default handler