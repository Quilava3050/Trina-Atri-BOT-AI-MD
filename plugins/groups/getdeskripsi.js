const handler = async (m, { sock, reply }) => {

const metadata = await sock.groupMetadata(m.chat)

const desc = metadata.desc || "Grup tidak memiliki deskripsi."

reply(`${desc}`)

}

handler.command = ["getdesc", "getdesk"]
handler.group = true

export default handler