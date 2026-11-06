const handler = async (m, { sock, text }) => {

const metadata = await sock.groupMetadata(m.chat)

const admins = metadata.participants
.filter(v => v.admin !== null)
.map(v => v.id)

if (!admins.length)
return m.reply("Admin tidak ditemukan.")


let teks = text
? `*TAG ADMIN GRUP*\n\n${text}\n\n`
: "*TAG ADMIN GRUP*\n\n"


admins.forEach((jid, i) => {
teks += `${i + 1}. @${jid.split("@")[0]}\n`
})


await sock.sendMessage(m.chat, {
text: teks,
mentions: admins
}, { quoted: m })

}

handler.command = ["tagadmin", "tagalladm", "tagadm"]
handler.group = true

export default handler