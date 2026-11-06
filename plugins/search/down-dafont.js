//elyas_tzy x furqan
//izin wm min
import axios from 'axios';
import * as cheerio from 'cheerio';

let handler = async (m, { sock, args, usedPrefix }) => {
    let cmd = args[0]?.toLowerCase();

    // Fix 1: Tambahin return biar nggak kebablasan ke bawah pas command kosong
    if (!cmd) {
        return m.reply(`*Gunakan Salah Satu Command Ini*

1. *${usedPrefix}dafont search [nama_font]*
   Untuk mencari font berdasarkan nama.

2. *${usedPrefix}dafont dl [link_download]*
   Untuk mengunduh font dari link hasil pencarian.

*Example :*
${usedPrefix}dafont search fancy
${usedPrefix}dafont dl https://dl.dafont.com/dl/?f=fancy_nancy_2`);
    }

    switch (cmd) {
        case 'search':
            // Fix 2: Biar bisa nyari lebih dari 1 kata (contoh: search bloody mary)
            let query = args.slice(1).join(" ");
            if (!query) return m.reply('Mau Cari Apa Di Dafont?');
            
            try {
                m.reply('Wait...');

                let result = await dafont(query);
                if (!result.length) return m.reply(`❌ Font "${query}" tidak ditemukan`);

                let teks = `*『 DAFONT SEARCH 』*`;

                result.slice(0, 10).forEach((font, i) => {
                    teks += `\n\n*${i + 1}. ${font.name}*
✍️ Creator : ${font.creator}
⬇️ Download : ${font.total_down}
🔗 ${font.link}`;
                });

                teks += `\n\n*Gunakan:*\n${usedPrefix}dafont dl [link_download]`;
                m.reply(teks);
            } catch (e) {
                console.error(e);
                m.reply('❌ Error saat mencari font dari web.');
            }
            break;

        case 'dl':
            let url = args[1];
            if (!url) return m.reply('Mana Link Nya?');
            if (!url.startsWith('https://dl.dafont.com/')) return m.reply('❌ Link tidak valid. Pastikan pakai link dari hasil pencarian bot!');

            try {
                m.reply('Wait...');

                // Fix 3: Ubah fetch jadi axios (biar sejalan sama import lu di atas)
                const { data } = await axios.get(url, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(data);

                const name = url.split('=').pop() || "Dafont_File";
                
                await sock.sendMessage(
                    m.chat,
                    {
                        document: buffer,
                        mimetype: 'application/zip',
                        fileName: `${name}.zip`,
                    },
                    { quoted: m }
                );
            } catch (e) {
                console.error(e);
                m.reply('❌ Gagal download font, server Dafont mungkin sedang sibuk.');
            }
            break;

        default:
            m.reply(`*Subcommand Yang Tersedia :*\n${usedPrefix}dafont search\n${usedPrefix}dafont dl`);
    }
};

async function dafont(query) {
    // Pakai axios untuk scraping webnya
    const { data } = await axios.get('https://www.dafont.com/search.php?q=' + encodeURIComponent(query));
    
    const $ = cheerio.load(data);
    const result = [];

    $('.lv1left.dfbg').each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();

        const name = text.split(' by ')[0];
        const creator = text.split(' by ')[1] || '-';

        const total_down = $(el).parent().find('.light').first().text().trim();
        const link = $(el).parent().find('a.dl').attr('href');

        if (link) {
            result.push({
                name,
                creator,
                total_down,
                // Fix 4: Ini yang typo parah "lin k:" 
                link: 'https:' + link, 
            });
        }
    });

    return result;
}

handler.command = ["dafont"];

export default handler;