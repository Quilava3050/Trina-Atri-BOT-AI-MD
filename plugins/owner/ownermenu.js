import fs from "fs"

const getOwnerTarget = (m, args) => {
    const numberArg = args?.find(arg => /\d/.test(arg))
    if (numberArg) return numberArg

    const mentionedJid = m.mentionedJid?.[0]
    if (mentionedJid) return mentionedJid

    if (!m.quoted) return null

    return m.quoted.sender ||
        m.quoted.key?.participant ||
        m.quoted.key?.senderPn ||
        m.quoted.participant ||
        m.msg?.contextInfo?.participant ||
        (!m.isGroup ? m.quoted.key?.remoteJid || m.quoted.chat : null)
}

const normalizeOwnerJid = async (target, sock, m) => {
    if (!target) return null
    let value = String(target).trim()
    if (typeof sock.decodeJid === "function") {
        value = sock.decodeJid(value) || value
    }

    if (value.endsWith("@lid")) {
        const lidMapping = sock.signalRepository?.lidMapping || sock.lidMapping
        let mappedJid = null
        if (typeof lidMapping?.getPNForLID === "function") {
            try {
                mappedJid = await lidMapping.getPNForLID(value)
            } catch (error) {
                console.warn("[OWNER] Gagal resolve LID melalui mapping:", error?.message || error)
            }
        }
        const candidates = [mappedJid]

        if (sock.groupMetadata && m.isGroup) {
            try {
                const metadata = await sock.groupMetadata(m.chat)
                const participant = metadata.participants?.find(item =>
                    [item.lid, item.id, item.jid, item.phoneNumber].includes(value)
                )
                candidates.push(
                    participant?.jid,
                    participant?.phoneNumber,
                    participant?.full?.jid,
                    participant?.full?.phoneNumber
                )
            } catch (error) {
                console.warn("[OWNER] Gagal mencari peserta grup untuk LID:", error?.message || error)
            }
        }

        const phoneJid = candidates.find(candidate =>
            typeof candidate === "string" && candidate.endsWith("@s.whatsapp.net")
        )
        if (phoneJid) return phoneJid

        const matches = typeof sock.onWhatsApp === "function"
            ? await sock.onWhatsApp(value).catch(() => [])
            : []
        return matches?.find(match =>
            typeof match?.jid === "string" && match.jid.endsWith("@s.whatsapp.net")
        )?.jid || null
    }

    if (value.endsWith("@s.whatsapp.net")) {
        const number = value.split("@")[0].replace(/[^0-9]/g, "")
        return number ? `${number}@s.whatsapp.net` : null
    }

    const number = value.replace(/[^0-9]/g, "")
    return /^\d{7,15}$/.test(number) ? `${number}@s.whatsapp.net` : null
}

const handler = async (m, { sock, text, args, command, reply, owners, example }) => {

switch (command) {
case "listowner": case "listown": { 
if (m.isBaileys) return m.reply("ngapain 😂?")
if (owners.length < 1) return m.reply("Tidak ada owner tambahan")
let teks = `List Owner Tambahan:\n\n`
for (let i of owners) {
teks += `* ${i.split("@")[0]} (@${i.split("@")[0]})\n`
}
sock.sendMessage(m.chat, {text: teks, mentions: owners}, {quoted: m})
}
break

case "addowner": case "addown": { 
if (m.isBaileys) return m.reply("ngapain 😂?")
    try {
        const target = getOwnerTarget(m, args)
        if (!target) return reply(example(`nomor atau reply/tag pengguna`))
        const nomor = await normalizeOwnerJid(target, sock, m)
        if (!nomor) return reply("Tidak bisa mendapatkan nomor WhatsApp dari target tersebut.")
        const ceknya = await sock.onWhatsApp(nomor)
        if (!ceknya?.some(result => result?.exists)) return reply(`Masukkan nomor yang valid dan terdaftar di WhatsApp!`)
        if (owners.includes(nomor)) return reply("Nomor sudah ada di daftar owner.")
        owners.push(nomor)
        fs.writeFileSync("./data/owner.json", JSON.stringify(owners))
        return reply(`Berhasil menambahkan ${nomor} ke daftar owner.`)
    } catch (error) {
        console.error("[OWNER] Gagal menambahkan owner:", error)
        return reply("❌ Gagal menyimpan owner baru.")
    }
}
break

case "delowner": case "delown": { 
if (m.isBaileys) return m.reply("ngapain 😂?")
    try {
        const target = getOwnerTarget(m, args)
        if (!target) return reply(example(`nomor atau reply/tag pengguna`))
        const nomor = await normalizeOwnerJid(target, sock, m)
        if (!nomor) return reply("Tidak bisa mendapatkan nomor WhatsApp dari target tersebut.")
        const ownerIndex = owners.indexOf(nomor)
        if (ownerIndex === -1) return reply("Nomor tidak ditemukan di daftar owner.")
        owners.splice(ownerIndex, 1)
        fs.writeFileSync("./data/owner.json", JSON.stringify(owners))
        return reply(`Berhasil menghapus ${nomor} dari daftar owner.`)
    } catch (error) {
        console.error("[OWNER] Gagal menghapus owner:", error)
        return reply("❌ Gagal menyimpan perubahan daftar owner.")
    }
}
break
}

}

handler.command = [
"addown", 
"listown", 
"delown",
"addowner", 
"listowner", 
"delowner"
]
handler.owner = true

export default handler;