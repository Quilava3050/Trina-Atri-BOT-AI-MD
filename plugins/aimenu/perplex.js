import { generateText } from 'ai';
import { createPerplexity } from '@ai-sdk/perplexity';

function cleanAnswer(text) {
  return text
    .replace(/\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const handler = async (m, { sock, text, command, usedPrefix }) => {
  const prompt = text?.trim();
  if (!prompt) {
    return sock.sendMessage(m.chat, {
      text: `Penggunaan: ${usedPrefix}${command} <pertanyaan>\n\nContoh: ${usedPrefix}${command} Apa perkembangan terbaru kecerdasan buatan?`
    }, { quoted: m });
  }

  const apiKey = global.perplexityKey || process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return sock.sendMessage(m.chat, {
      text: 'API key Perplexity belum dikonfigurasi. Atur environment variable PERPLEXITY_API_KEY lalu restart bot.'
    }, { quoted: m });
  }

  await sock.sendMessage(m.chat, {
    text: 'Sedang mencari informasi...'
  }, { quoted: m });

  try {
    const perplexity = createPerplexity({ apiKey });
    const result = await generateText({
      model: perplexity('high'),
      prompt,
      providerOptions: {
        perplexity: {
          instructions: 'Jawab dalam bahasa Indonesia dengan jelas dan ringkas. Gunakan pencarian web untuk informasi terkini dan bedakan fakta dengan ketidakpastian. Jangan gunakan tanda bintang atau format markdown.',
          language_preference: 'id',
          store: false
        }
      }
    });

    const answer = cleanAnswer(result.text);
    if (!answer) throw new Error('Perplexity tidak mengembalikan jawaban.');

    const sourceLines = result.sources
      .filter(source => source.url)
      .map((source, index) => `${index + 1}. ${source.title || source.url}\n${source.url}`);
    const message = sourceLines.length
      ? `${answer}\n\nSumber:\n${sourceLines.join('\n')}`
      : answer;

    await sock.sendMessage(m.chat, { text: message }, { quoted: m });
  } catch (err) {
    console.error('Error Perplexity AI:', err);
    await sock.sendMessage(m.chat, {
      text: `Gagal mendapatkan jawaban dari Perplexity: ${err.message || err}`
    }, { quoted: m });
  }
};

handler.help = ['perplexity <pertanyaan>'];
handler.tags = ['ai'];
handler.command = ['perplexity', 'pplx','perplex'];

export default handler;