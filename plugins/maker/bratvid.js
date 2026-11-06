import axios from 'axios'
import { createSticker, StickerTypes } from 'wa-sticker-formatter'

let handler = async (m, { conn, sock, command, usedPrefix, text }) => {
  const client = conn || sock || global.sock;

  text = m.quoted && !text ? m.quoted.text : text
  if (!text) return m.reply(`Masukkan teks contoh : ${usedPrefix + command} hello world`)

  m.reply('Tunggu sebentar...')

  try {
    let url = `https://brat.siputzx.my.id/gif?text=${encodeURIComponent(text)}`
    let buffer = (await axios.get(url, { responseType: 'arraybuffer' })).data

    let stickerBuffer = await createSticker(buffer, {
      type: StickerTypes.FULL,
      pack: global.stickpack || 'Who is he',
      author: global.stickauth || 'Im Trina',
      quality: 80
    })

    await client.sendMessage(m.chat, {
      sticker: stickerBuffer
    }, { quoted: m })

  } catch (e) {
    console.error("[BratVideo Error]:", e)
    m.reply('Terjadi error saat membuat stiker.')
  }
}

handler.command = ['bratv', 'bratvid']
handler.tags = ['sticker']
handler.help = ['bratv <teks>']

export default handler