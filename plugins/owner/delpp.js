const handler = async (m, { sock }) => {
  await sock.removeProfilePicture(sock.user.id)
  m.reply("*Berhasil menghapus profile bot*")
}

handler.command = ["delppbot", "delpp"]
handler.owner = true

export default handler