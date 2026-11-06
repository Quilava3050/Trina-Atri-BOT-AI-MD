import axios from 'axios';
import * as cheerio from 'cheerio';
import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const tmpDir = path.resolve('./data/trash');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

let handler = async (m, { sock, text, usedPrefix, command, reply }) => {

    const hasRepliedImage = m.quoted && m.quoted.message?.imageMessage;
    const hasText = text && text.trim().length > 0;
    let tempFilePath;

    try {
        if (hasRepliedImage) {
            const media = await downloadMediaMessage(m.quoted, 'buffer', {});
            const image = await Jimp.read(media);

            image.resize(80, Jimp.AUTO).grayscale();
            const chars = '⣀⣤⣶⣿⡿⠿⠋⠁⢀⣀⣤⣶⣿⠿⣷⣿⣿⠉⠉⠙⠿⢿⣷⣿⣿⡿';
            let ascii = '';

            for (let y = 0; y < image.bitmap.height; y++) {
                for (let x = 0; x < image.bitmap.width; x++) {
                    const color = Jimp.intToRGBA(image.getPixelColor(x, y));
                    const charIndex = Math.floor((color.r / 255) * (chars.length - 1));
                    ascii += chars[charIndex];
                }
                ascii += '\n';
            }

            tempFilePath = path.join(tmpDir, `ascii-image-${Date.now()}.txt`);
            fs.writeFileSync(tempFilePath, ascii);

            await sock.sendMessage(m.chat, {
                document: { url: tempFilePath },
                fileName: 'ascii-art.txt',
                mimetype: 'text/plain',
                caption: 'This is the result!'
            }, { quoted: m });

        } else if (hasText) {
            const res = await axios.get('https://emojicombos.com/anime-text-art', {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const $ = cheerio.load(res.data);
            const results = [];

            $('.combo-ctn').each((_, el) => {
                const tags = $(el).find('.keywords a').map((i, tag) => $(tag).text().toLowerCase()).get();
                if (tags.some(tag => tag.includes(text.toLowerCase()))) {
                    const art = $(el).find('.emojis').text().trim();
                    if (art.length > 10) results.push(art);
                }
            });

            if (results.length === 0) return reply(`Tidak ditemukan seni ASCII untuk: *${text}*`);

            const limitedResults = results.slice(0, 10);
            const content = `*Hasil Pencarian ASCII Art untuk: ${text}*\n\n` +
                limitedResults.join('\n\n' + '-'.repeat(40) + '\n\n');

            tempFilePath = path.join(tmpDir, `ascii-search-${Date.now()}.txt`);
            fs.writeFileSync(tempFilePath, content);

            await sock.sendMessage(m.chat, {
                document: { url: tempFilePath },
                fileName: `ascii-${text}.txt`,
                mimetype: 'text/plain',
                caption: `Ditemukan *${limitedResults.length}* hasil untuk: *${text}*`
            }, { quoted: m });

        } else {
            return reply(`*Ex:* ${usedPrefix + command} cat`);
        }

    } catch (err) {
        console.error("ASCII Plugin Error:", err);
        reply(`Error: ${err.message}`);
        await sock.sendMessage(m.chat, { react: { text: '🍂', key: m.key } });
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    }
};

handler.command = ['asciis', 'cariasci'];
export default handler;