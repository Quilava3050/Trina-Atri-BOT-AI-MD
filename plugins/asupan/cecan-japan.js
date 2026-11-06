import fetch from "node-fetch"

const handler = async (m, { sock, reply, command, usedPrefix }) => {
  const api = `${global.api.free9}/r/cecan/japan`

  try {
    let res = await fetch(api)
    let buffer = Buffer.from(await res.arrayBuffer())

    await sock.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: `Result!\nKlik *next* untuk melihat lainya!`,
        buttons: [
          {
            buttonId: `${usedPrefix}${command}`,
            buttonText: { displayText: "Next" },
            type: 1,
          }
        ],
        headerType: 4
      },
      { quoted: m }
    )

  } catch (e) {
    reply("❌ Error: " + e.message)
  }
}

handler.command = ["jepang", "japan", "cecan-japan"]
export default handler