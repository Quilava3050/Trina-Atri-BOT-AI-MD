let handler = async (m, { text, reply, JadwalSholat }) => {
  if (!text) return reply('*Masukkan nama kota!*')
  const hasil = await JadwalSholat(text)
  reply(hasil)
}

handler.command = ["jadwalsholat"]

export default handler