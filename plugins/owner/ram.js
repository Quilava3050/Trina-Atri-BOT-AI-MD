import os from 'os'

let handler = async (m, { sock }) => {
  let totalStorage = Math.floor(os.totalmem() / 1024 / 1024) + ' MB'
  let freeStorage = Math.floor(os.freemem() / 1024 / 1024) + ' MB'
  let cpuModel = os.cpus()[0].model
  let cpuSpeed = (os.cpus()[0].speed / 1000).toFixed(2)
  let cpuCount = os.cpus().length

  let message = `
*Your Bot Specifications*:

• *Total Storage*: ${totalStorage}
• *Free Storage*: ${freeStorage}
• *CPU Model*: ${cpuModel}
• *CPU Speed*: ${cpuSpeed} GHz
• *Number of CPU Cores*: ${cpuCount}
`.trim()

  await sock.sendMessage(m.chat, {
    text: message,
    contextInfo: {
      mentionedJid: [m.sender],
      isForwarded: true,
      forwardingScore: 99,
      forwardedNewsletterMessageInfo: {
        newsletterJid: global.idChannel,
        serverMessageId: null,
        newsletterName: global.namaChannel
      }
    }
  }, { quoted: m })
}

handler.help = ['botspec']
handler.tags = ['info']
handler.command = ['ram', 'botspec', 'botinfo', 'specs']

export default handler