import axios from "axios"

const handler = async (m, { sock, text, reply, command, usedPrefix }) => {

  if (!text)
    return reply(`Example: *${usedPrefix}${command}* teksnya`)

  const media = `${global.api.free1}/maker/cewekbrat?text=${encodeURIComponent(text)}`
  await sock.sendImageAsSticker(m.chat, media, m, { author: "Trina" })
}

handler.command = ["cwbrat", "cwb", "bratcewe", "cewebrat"]
export default handler