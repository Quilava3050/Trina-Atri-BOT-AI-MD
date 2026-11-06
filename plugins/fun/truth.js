import axios from 'axios';

let handler = async (m) => {
    try {
        // Pake axios sesuai import di atas
        const { data } = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/kata-kata/truth.json');

        // Logika acak bawaan standar JS (Pasti Work)
        let truth = data[Math.floor(Math.random() * data.length)];
        
        // Kirim hasil ke chat
        m.reply(`*🎯 TRUTH*\n\n“${truth}”`);

    } catch (e) {
        console.error('[Truth Error]:', e.message);
        m.reply('❌ Waduh, gagal ngambil data Truth. Coba lagi nanti bwang!');
    }
};

handler.help = ['truth'];
handler.tags = ['fun'];
handler.command = ["truth"];

export default handler;