import fs from "fs"

const handler = async (m, { sock, text, args, command, reply, sewa, example }) => {
switch (command) {
case "listsewa": {
if (m.isBaileys) return m.reply("ngapain 😂?")
if (sewa.length < 1) return m.reply("Tidak ada user premium")
let teks = `*List Pengguna Premium 🍀*\n\n`
for (let i of sewa) {
teks += `* ${i.split("@")[0]} (@${i.split("@")[0]})\n`
}
sock.sendMessage(m.chat, {text: teks, mentions: sewa}, {quoted: m})
}
break

case "addsewa": { 
if (m.isBaileys) return m.reply("ngapain 😂?")
    let nomor = args[0]
        ? args[0].replace(/[^0-9]/g, '')
        : m.quoted
        ? m.quoted.sender.replace(/[^0-9]/g, '')
        : m.mentionedJid && m.mentionedJid[0]
        ? m.mentionedJid[0].replace(/[^0-9]/g, '')
        : null
    if (!nomor) return reply(example(`reply/tag`))
    nomor += "@s.whatsapp.net"
    let ceknya = await sock.onWhatsApp(nomor)
    if (ceknya.length == 0) return reply(`Masukkan nomor yang valid dan terdaftar di WhatsApp!`)
    if (sewa.includes(nomor)) return reply("Nomor sudah ada di daftar premium")
    sewa.push(nomor)
    fs.writeFileSync("./data/sewa.json", JSON.stringify(sewa))
    reply(`Berhasil menambahkan ${nomor} ke daftar premium`)
}
break

case "delsewa": { 
if (m.isBaileys) return m.reply("ngapain 😂?")
    let nomor = args[0]
        ? args[0].replace(/[^0-9]/g, '')
        : m.quoted
        ? m.quoted.sender.replace(/[^0-9]/g, '')
        : m.mentionedJid && m.mentionedJid[0]
        ? m.mentionedJid[0].replace(/[^0-9]/g, '')
        : null
    if (!nomor) return reply(example(`reply/tag`))
    nomor += "@s.whatsapp.net"
    if (!sewa.includes(nomor)) return reply("Nomor tidak ditemukan di daftar premium")
    sewa.splice(sewa.indexOf(nomor), 1)
    fs.writeFileSync("./data/sewa.json", JSON.stringify(sewa))
    reply(`Berhasil menghapus ${nomor} dari daftar premium`)
}
break
}

}

handler.command = [
"addsewa", 
"listsewa", 
"delsewa"
]
handler.owner = true

export default handler;