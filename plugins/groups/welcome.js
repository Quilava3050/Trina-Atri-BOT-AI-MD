const handler = async (m, { text, reply, db, usedPrefix }) => {

if (!text)
return reply(`Contoh:

${usedPrefix}welcome on
${usedPrefix}welcome off
`)

text = text.toLowerCase()


if (text === "on") {

await db("groups", m.chat, "welcome", 1)
await db("groups", m.chat, "goodbye", 1)

return reply("Welcome system aktif semua\n(welcome, goodbye, promote, demote)")
}


if (text === "off") {

await db("groups", m.chat, "welcome", 0)
await db("groups", m.chat, "goodbye", 0)

return reply("Welcome system dimatikan semua ❌")
}


reply("Gunakan on / off")

}

handler.command = ["welcome"]
handler.admin = true
handler.group = true

export default handler