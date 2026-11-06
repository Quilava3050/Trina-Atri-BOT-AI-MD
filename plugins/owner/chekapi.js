import fetch from 'node-fetch';

const handler = async (m, { sock, reply }) => {
    const client = sock || reply;

    try {
        await m.reply('🔍 *Memeriksa sisa limit & status API key...*');

        let linksData = [];
        let summaryText = [];

        /* ================= ZANSXART API ================= */
        try {
            const zansKey = global.zansxart || 'umaasa';
            const res = await fetch('https://api.zansxart.me/api/tools/checkkey', {
                headers: { 'X-API-Key': zansKey }
            });
            const json = await res.json();

            if (json?.status && json?.result) {
                const r = json.result;
                summaryText.push(`*1. ZansXart API*\n• Email: ${r.email}\n• Plan: ${r.plan.toUpperCase()} (${r.role})\n• Limit Sisa: ${r.remaining} / ${r.limit} (Terpakai: ${r.used})\n• Expired: ${r.expiry.split('T')[0]}`);
                linksData.push({
                    text: '🌐 ZansXart API Dashboard',
                    title: `Plan: ${r.plan.toUpperCase()} | Limit Sisa: ${r.remaining}`,
                    url: 'https://api.zansxart.me'
                });
            }
        } catch (e) {
            console.error('Error ZansXart:', e);
        }

        /* ================= BOTCAHX API ================= */
        try {
            if (global.btc) {
                const res = await fetch(`https://api.botcahx.eu.org/api/checkkey?apikey=${global.btc}`);
                const json = await res.json();

                if (json?.status && json?.result) {
                    const r = json.result;
                    summaryText.push(`*2. Botcahx API*\n• User: ${r.username || '-'}\n• Status: ${r.premium ? 'Premium' : 'Free'}\n• Limit Sisa: ${r.limit ?? '-'}\n• Expired: ${r.expired || '-'}`);
                    linksData.push({
                        text: '⚡ Botcahx API Dashboard',
                        title: `Status: ${r.premium ? 'Premium' : 'Free'} | Limit: ${r.limit ?? '-'}`,
                        url: 'https://api.botcahx.eu.org'
                    });
                }
            }
        } catch (e) {
            console.error('Error Botcahx:', e);
        }

        if (!summaryText.length) {
            return m.reply('❌ *Gagal mengambil data dari semua API key.* Pastikan API key di `config.js` sudah benar.');
        }

        const botName = global.namaBot || 'Trina';

        // Mengirimkan pesan dalam format Rich Response (Inline Links)
        await client.sendMessage(m.chat, {
            disclaimerText: `${botName.toUpperCase()} • API STATUS`,
            headerText: `## 📊 ${botName.toUpperCase()} API KEY STATUS`,
            contentText: summaryText.join('\n\n') + '\n\n---',
            links: linksData,
            footerText: '✨ Status server & API siap digunakan!'
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        return m.reply('❌ Terjadi kesalahan sistem saat mengecek API key: ' + e.message);
    }
};

handler.help = ['checkapi', 'api'];
handler.command = ['checkapi', 'checkkey', 'api', 'chk'];
handler.owner = true;

export default handler;