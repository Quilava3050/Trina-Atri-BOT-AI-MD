import { AkinatorClient, Answers, Themes } from 'akinator-client'
import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const themes = {
  karakter: { id: 'karakter', label: 'Karakter', theme: Themes.Character, language: 'id' },
  hewan: { id: 'hewan', label: 'Hewan', theme: Themes.Animals, language: 'en' },
  objek: { id: 'objek', label: 'Objek', theme: Themes.Objects, language: 'en' }
}

const answerOptions = [
  { label: 'Ya', answer: Answers.Yes },
  { label: 'Tidak', answer: Answers.No },
  { label: 'Tidak tahu', answer: Answers.IDontKnow },
  { label: 'Mungkin ya', answer: Answers.Probably },
  { label: 'Mungkin tidak', answer: Answers.ProbablyNot }
]

const sendThemeSelection = async (sock, m, usedPrefix, command) => {
  const rows = [
    { title: 'Karakter', description: 'Pertanyaan dalam bahasa Indonesia', id: `${usedPrefix + command} tema karakter` },
    { title: 'Hewan', description: 'Pertanyaan dalam bahasa Inggris', id: `${usedPrefix + command} tema hewan` },
    { title: 'Objek', description: 'Pertanyaan dalam bahasa Inggris', id: `${usedPrefix + command} tema objek` }
  ]
  const message = generateWAMessageFromContent(m.chat, {
    interactiveMessage: {
      body: { text: '🎮 *Akinator - Pilih Tema*\n\nPilih jenis yang ingin ditebak.' },
      footer: { text: 'Tema hewan dan objek saat ini menggunakan pertanyaan bahasa Inggris.' },
      nativeFlowMessage: {
        buttons: [{
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Pilih tema',
            sections: [{ title: 'Tema permainan', rows }]
          })
        }],
        messageParamsJson: '{}',
        messageVersion: 1
      }
    }
  }, { quoted: m })

  await sock.relayMessage(m.chat, message.message, { messageId: message.key.id })
}

const sendQuestion = async (sock, m, aki, usedPrefix, command) => {
  const rows = answerOptions.map(({ label, answer }) => ({
    title: label,
    id: `${usedPrefix + command} ${answer}`
  }))
  if (aki.step > 0) {
    rows.push({
      title: 'Kembali',
      description: 'Batalkan jawaban terakhir',
      id: `${usedPrefix + command} kembali`
    })
  }
  rows.push({
    title: 'Akhiri permainan',
    id: `${usedPrefix + command} keluar`
  })

  const message = generateWAMessageFromContent(m.chat, {
    interactiveMessage: {
      body: {
        text: `🎮 *Akinator - ${aki.themeName}*\n\n🧠 *Pertanyaan ${aki.step + 1}:* ${aki.question}\n📊 *Progress:* ${aki.progression.toFixed(2)}%\n\nPilih jawaban dari daftar di bawah.${aki.language === 'en' ? '\n\n🌐 Pertanyaan dalam bahasa Inggris.' : ''}`
      },
      footer: { text: 'Akinator · Pilih salah satu jawaban' },
      nativeFlowMessage: {
        buttons: [{
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Pilih jawaban',
            sections: [{
              title: 'Jawaban',
              rows
            }]
          })
        }],
        messageParamsJson: '{}',
        messageVersion: 1
      }
    }
  }, { quoted: m })

  await sock.relayMessage(m.chat, message.message, { messageId: message.key.id })
}

const sendGuess = async (sock, m, aki, usedPrefix, command) => {
  const guess = aki.winResult
  const rows = [
    { title: 'Benar, akhiri permainan', id: `${usedPrefix + command} benar` },
    { title: 'Salah, lanjutkan permainan', id: `${usedPrefix + command} salah` }
  ]
  if (aki.step > 0) {
    rows.push({
      title: 'Koreksi jawaban sebelumnya',
      description: 'Kembali ke pertanyaan terakhir',
      id: `${usedPrefix + command} kembali`
    })
  }
  rows.push({ title: 'Akhiri permainan', id: `${usedPrefix + command} keluar` })

  const message = generateWAMessageFromContent(m.chat, {
    interactiveMessage: {
      body: {
        text: `🎉 *Akinator punya tebakan!*\n\n📛 *${guess.name}*\n📝 ${guess.description || 'Tidak ada deskripsi.'}\n\nTebakan Akinator benar?`
      },
      footer: { text: 'Kamu bisa mengoreksi jawaban jika tebakan ini salah.' },
      nativeFlowMessage: {
        buttons: [{
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Pilih tindakan',
            sections: [{ title: 'Konfirmasi tebakan', rows }]
          })
        }],
        messageParamsJson: '{}',
        messageVersion: 1
      }
    }
  }, { quoted: m })

  await sock.relayMessage(m.chat, message.message, { messageId: message.key.id })
}

const handler = async (m, { sock, args, usedPrefix, command }) => {
  const fkontak = {
    key: {
      participant: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast'
    },
    message: {
      contactMessage: {
        displayName: global.namaOwner || 'Owner',
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${global.namaOwner || 'Owner'};;;\nFN:${global.namaOwner || 'Owner'}\nEND:VCARD`
      }
    }
  }

  const input = args[0]?.toLowerCase()
  const user = global.db?.data?.users?.[m.sender]
  sock.akinator = sock.akinator || {}

  if (!input) {
    return sock.sendMessage(m.chat, {
      text: `🎮 *Akinator - Tebak-tebakan!*\n\n📌 *Perintah:*\n• *${usedPrefix + command} mulai* - Pilih tema dan mulai bermain\n• Pilih jawaban dari daftar yang muncul\n• Gunakan opsi *Kembali* untuk membatalkan jawaban terakhir\n• *${usedPrefix + command} keluar* - Mengakhiri permainan\n\nKarakter memakai bahasa Indonesia; tema hewan dan objek memakai bahasa Inggris.`
    }, { quoted: fkontak })
  }

  if (['keluar', 'end', 'stop'].includes(input)) {
    if (!(m.sender in sock.akinator)) {
      return sock.sendMessage(m.chat, { text: '🚫 Kamu tidak sedang bermain Akinator.' }, { quoted: fkontak })
    }
    delete sock.akinator[m.sender]
    if (user?.akinator) user.akinator.sesi = false
    return sock.sendMessage(m.chat, { text: '✅ Kamu telah keluar dari sesi Akinator.' }, { quoted: fkontak })
  }

  if (['mulai', 'start'].includes(input) && !args[1]) {
    if (m.sender in sock.akinator) {
      return sock.sendMessage(m.chat, { text: '⚠️ Kamu masih dalam sesi Akinator. Jawab dulu pertanyaannya.' }, { quoted: fkontak })
    }
    try {
      return await sendThemeSelection(sock, m, usedPrefix, command)
    } catch (error) {
      console.error('[AKINATOR] Gagal mengirim pilihan tema:', error)
      return sock.sendMessage(m.chat, {
        text: '⚠️ Daftar tema gagal dikirim. Coba lagi sebentar.'
      }, { quoted: fkontak })
    }
  }

  const requestedTheme = input === 'tema' ? args[1]?.toLowerCase() : ['mulai', 'start'].includes(input) ? args[1]?.toLowerCase() : null
  if (requestedTheme) {
    if (m.sender in sock.akinator) {
      return sock.sendMessage(m.chat, { text: '⚠️ Kamu masih dalam sesi Akinator. Jawab dulu pertanyaannya atau ketik keluar.' }, { quoted: fkontak })
    }
    const selectedTheme = Object.hasOwn(themes, requestedTheme) ? themes[requestedTheme] : null
    if (!selectedTheme) {
      return sock.sendMessage(m.chat, {
        text: `❌ Tema tidak dikenal. Pilih karakter, hewan, atau objek melalui *${usedPrefix + command} mulai*.`
      }, { quoted: fkontak })
    }
    let aki
    try {
      aki = new AkinatorClient({
        language: selectedTheme.language,
        theme: selectedTheme.theme,
        childMode: false
      })
      await aki.start()
    } catch (error) {
      console.error('[AKINATOR] Gagal memulai sesi:', error)
      return sock.sendMessage(m.chat, {
        text: '⚠️ Layanan Akinator sedang tidak bisa memulai permainan. Coba lagi beberapa saat nanti.'
      }, { quoted: fkontak })
    }
    aki.themeName = selectedTheme.label
    aki.language = selectedTheme.language

    sock.akinator[m.sender] = aki
    if (user?.akinator) user.akinator.sesi = true

    try {
      return await sendQuestion(sock, m, aki, usedPrefix, command)
    } catch (error) {
      console.error('[AKINATOR] Gagal mengirim pertanyaan:', error)
      delete sock.akinator[m.sender]
      if (user?.akinator) user.akinator.sesi = false
      return sock.sendMessage(m.chat, {
        text: '⚠️ Permainan berhasil dimulai, tetapi pertanyaan gagal dikirim. Silakan mulai ulang.'
      }, { quoted: fkontak })
    }
  }

  if (!(m.sender in sock.akinator)) {
    return sock.sendMessage(m.chat, {
      text: `⚠️ Kamu belum memulai sesi Akinator. Ketik *${usedPrefix + command} mulai*`
    }, { quoted: fkontak })
  }

  const aki = sock.akinator[m.sender]
  if (input === 'benar') {
    if (!aki.won) {
      return sock.sendMessage(m.chat, { text: 'ℹ️ Akinator belum memberikan tebakan.' }, { quoted: fkontak })
    }
    try {
      await aki.submitWin()
      const guess = aki.winResult
      const caption = `✅ *Tebakan benar!*\n\n📛 *${guess.name}*\n📝 ${guess.description || 'Tidak ada deskripsi.'}`
      if (guess.pictureUrl) {
        await sock.sendMessage(m.chat, { image: { url: guess.pictureUrl }, caption }, { quoted: fkontak })
      } else {
        await sock.sendMessage(m.chat, { text: caption }, { quoted: fkontak })
      }
      delete sock.akinator[m.sender]
      if (user?.akinator) user.akinator.sesi = false
    } catch (error) {
      console.error('[AKINATOR] Gagal mengonfirmasi tebakan:', error)
      return sock.sendMessage(m.chat, {
        text: '⚠️ Tebakan belum bisa dikonfirmasi. Sesi tetap tersedia; coba lagi atau ketik keluar.'
      }, { quoted: fkontak })
    }
    return
  }

  if (input === 'salah') {
    if (!aki.won) {
      return sock.sendMessage(m.chat, { text: 'ℹ️ Akinator belum memberikan tebakan.' }, { quoted: fkontak })
    }
    try {
      await aki.continue()
      if (aki.ko) {
        await sock.sendMessage(m.chat, {
          text: '🤔 Akinator belum bisa menebak tokohmu. Permainan diakhiri, coba mulai lagi!'
        }, { quoted: fkontak })
        delete sock.akinator[m.sender]
        if (user?.akinator) user.akinator.sesi = false
        return
      }
      return await sendQuestion(sock, m, aki, usedPrefix, command)
    } catch (error) {
      console.error('[AKINATOR] Gagal melanjutkan setelah tebakan salah:', error)
      return sock.sendMessage(m.chat, {
        text: '⚠️ Akinator belum bisa melanjutkan setelah tebakan salah. Sesi tetap tersedia; coba koreksi jawaban atau ketik keluar.'
      }, { quoted: fkontak })
    }
  }

  if (['kembali', 'back'].includes(input)) {
    if (aki.step <= 0) {
      return sock.sendMessage(m.chat, { text: 'ℹ️ Kamu sudah berada di pertanyaan pertama.' }, { quoted: fkontak })
    }
    try {
      await aki.back()
      return await sendQuestion(sock, m, aki, usedPrefix, command)
    } catch (error) {
      console.error('[AKINATOR] Gagal kembali ke pertanyaan sebelumnya:', error)
      return sock.sendMessage(m.chat, {
        text: '⚠️ Pertanyaan sebelumnya tidak bisa dibuka. Sesi tetap berjalan; coba jawab lagi atau ketik keluar.'
      }, { quoted: fkontak })
    }
  }

  const answer = Number(input)
  if (!Number.isInteger(answer) || answer < 0 || answer > 4) {
    return sock.sendMessage(m.chat, {
      text: `❌ Pilihan tidak valid. Gunakan daftar jawaban atau ketik angka 0-4.\n\nKetik *${usedPrefix + command} keluar* untuk mengakhiri.`
    }, { quoted: fkontak })
  }

  try {
    await aki.answer(answer)

    if (aki.won) {
      await sendGuess(sock, m, aki, usedPrefix, command)
    } else if (aki.ko) {
      await sock.sendMessage(m.chat, {
        text: '🤔 Akinator belum bisa menebak tokohmu. Permainan diakhiri, coba mulai lagi!'
      }, { quoted: fkontak })
      delete sock.akinator[m.sender]
      if (user?.akinator) user.akinator.sesi = false
    } else {
      await sendQuestion(sock, m, aki, usedPrefix, command)
    }
  } catch (error) {
    console.error('[AKINATOR] Gagal memproses jawaban:', error)
    delete sock.akinator[m.sender]
    if (user?.akinator) user.akinator.sesi = false
    return sock.sendMessage(m.chat, {
      text: '⚠️ Terjadi kendala saat menghubungi Akinator. Permainan diakhiri; silakan mulai sesi baru.'
    }, { quoted: fkontak })
  }
}

handler.help = ['akinator']
handler.tags = ['game']
handler.command = ['akinator', 'aki']
handler.group = true

export default handler
