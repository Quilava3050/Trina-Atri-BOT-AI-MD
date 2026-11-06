
import fs from "fs"

const handler = async (m, { sock, text, command, reply, example, downloadContentFromMessage, usedPrefix, q }) => {

if (!text.includes("./")) return reply(example(`filenya mana?\n\nContoh: ${usedPrefix}${command} ./package.json\n\n*sambil reply file nya!*`));
let files = fs.readdirSync(text.split(m.quoted.fileName)[0])
if (!files.includes(m.quoted.fileName)) return reply("File not found") 
let media = await downloadContentFromMessage(m.quoted, "document")
let buffer = Buffer.from([])
for await(const chunk of media) {
buffer = Buffer.concat([buffer, chunk])
}
fs.writeFileSync(text, buffer)
reply(`Tunggu kejap. . .`)
await sleep(5000)
reply(`Berhasil mengganti file ${q}`)
}

handler.command = ["gfl", "gantifile", "ganti-file"];
handler.owner = true

export default handler;