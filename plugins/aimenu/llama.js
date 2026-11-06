import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Mana pertanyaannya, sayang?\n\nContoh:\n${usedPrefix + command} siapa presiden indonesia sekarang?`);

    await m.reply('Tunggu ya, Trina lagi mikir...');

    try {
        const apiKey = global.zansxart || 'umaasa';
        const url = `https://api.zansxart.me/api/ai/llama?q=${encodeURIComponent(text)}`;

        const { data } = await axios.get(url, {
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!data.status || !data.response) {
            return m.reply('❌ Maaf, terjadi kesalahan dari server API.');
        }

        await m.reply(data.response);
    } catch (e) {
        m.reply('❌ Error: ' + e.message);
    }
};

export default Object.assign(handler, {
    help: ['llama'],
    tags: ['ai'],
    command: ['llama', 'ai-llama']
});