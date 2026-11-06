import Groq from 'groq-sdk'

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b'
const AI_NOTICE = '⚠️ AI ini tidak realtime dan mungkin keliru. Verifikasi informasi penting dari sumber terbaru.'

function cleanAnswer(answer) {
  return answer
    .replace(/^\s*[-_*+]{3,}\s*$/gm, '')
    .replace(/^\s*\+\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const handler = async (m, { sock, text, command, usedPrefix }) => {
  if (!text?.trim()) {
    return sock.sendMessage(m.chat, {
      text: `Penggunaan: ${usedPrefix}${command} <pertanyaan>\n\nContoh: ${usedPrefix}${command} Jelaskan relativitas dengan sederhana.`
    }, { quoted: m })
  }

  if (!global.groqKey) {
    return sock.sendMessage(m.chat, {
      text: 'API key Groq belum dikonfigurasi. Atur environment variable GROQ_API_KEY terlebih dahulu.'
    }, { quoted: m })
  }

  await sock.sendMessage(m.chat, { text: '🤖 Groq sedang berpikir...' }, { quoted: m })

  try {
    const groq = new Groq({ apiKey: global.groqKey })
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah asisten AI yang membantu dan menjawab dalam bahasa pengguna. Buat jawaban rapi dan mudah dibaca, gunakan format sederhana, jangan memakai garis pemisah atau tanda plus sebagai dekorasi. Jangan mengaku memiliki informasi realtime; jika tidak yakin atau informasinya mungkin sudah berubah, katakan dengan jelas.'
        },
        { role: 'user', content: text.trim() }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })

    const answer = cleanAnswer(completion.choices[0]?.message?.content || '')
    if (!answer) throw new Error('Groq tidak mengembalikan jawaban.')

    await sock.sendMessage(m.chat, { text: `${answer}\n\n${AI_NOTICE}` }, { quoted: m })
  } catch (error) {
    console.error('Groq AI Error:', error)
    const errorMessage = error.status === 404
      ? `Model Groq "${MODEL}" tidak tersedia atau akun tidak memiliki akses. Atur GROQ_MODEL ke model aktif yang tersedia di Groq Console.`
      : `Gagal mendapatkan jawaban dari Groq: ${error.message || error}`
    await sock.sendMessage(m.chat, {
      text: errorMessage
    }, { quoted: m })
  }
}

handler.help = ['groq <pertanyaan>']
handler.tags = ['ai']
handler.command = ['groq', 'askgroq']

export default handler
