const handler = async (m, { text, command, reply, usedPrefix, db }) => {
  if (!text) return reply(
    `Atur pesan welcome/goodbye grup\n\n` +
    `*Variabel yang tersedia:*\n` +
    `- @user → mention member\n` +
    `- @namagrup → nama grup\n` +
    `- @total → total member\n\n` +
    `*Contoh:*\n` +
    `${usedPrefix}setwelcome Halo @user, welcome di *@namagrup*! Total member: @total\n` +
    `${usedPrefix}setgoodbye Bye @user, semoga sukses 👋\n\n` +
    `*Reset ke default:*\n` +
    `${usedPrefix}setwelcome reset`
  )

  if (text.toLowerCase() === 'reset') {
    await db('groups', m.chat, command === 'setwelcome' ? 'welcome_text' : 'goodbye_text', '')
    return reply(`Pesan ${command === 'setwelcome' ? 'welcome' : 'goodbye'} berhasil direset ke default.`)
  }

  const col = command === 'setwelcome' ? 'welcome_text' : 'goodbye_text'
  await db('groups', m.chat, col, text)
  reply(`Pesan *${command === 'setwelcome' ? 'welcome' : 'goodbye'}* berhasil diatur!\n\nPreview:\n${text.replace('@user', '@628xxx').replace('@namagrup', 'Nama Grup').replace('@total', '100')}`)
}

handler.command = ['setwelcome', 'setgoodbye']
handler.admin = true
handler.group = true

export default handler