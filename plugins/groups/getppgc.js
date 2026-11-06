const handler = async (m, { sock, reply }) => {

try {

const ppUrl = await sock.profilePictureUrl(m.chat, "image")

await sock.sendMessage(m.chat, {
image: { url: ppUrl },
caption: "*Foto profil grup berhasil diambil.*"
}, { quoted: m })

} catch {

reply("Grup ini tidak memiliki foto profil.")

}

}

handler.command = ["getppgc", "ppgc", "getppgrup"]
handler.group = true

export default handler