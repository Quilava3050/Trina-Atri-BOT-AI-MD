global.onBot = function(seconds) {
    seconds = Number(seconds);

    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const dDisplay = d > 0 ? `${d} hari, ` : '';
    const hDisplay = h > 0 ? `${h} jam, ` : '';
    const mDisplay = m > 0 ? `${m} menit, ` : '';
    const sDisplay = s > 0 ? `${s} detik` : '';

    return dDisplay + hDisplay + mDisplay + sDisplay;
};

const handler = async (m, { sock }) => {
    
    const respon = `*${global.namaBot}* telah aktif selama:\n\`\`\`${global.onBot(process.uptime())}\`\`\``;

    await sock.sendMessage(m.chat, { text: respon }, { quoted: m });
};

handler.command = ["rt", "runtime"];
export default handler;