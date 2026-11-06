import axios from 'axios';

let handler = async (m) => {
    try {
        // Pake axios buat ngambil data JSON
        const { data } = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/kata-kata/dare.json');

        // Logika acak bawaan standar JS (Pasti Work)
        let dare = data[Math.floor(Math.random() * data.length)];
        
        // Kirim hasil ke chat
        m.reply(`*🎯 DARE*\n\n“${dare}”`);

    } catch (e) {
        console.error('[Dare Error]:', e.message);
        m.reply('❌ Waduh, gagal ngambil data Dare. Coba lagi nanti bwang!');
    }
};

handler.command = ["dare"];

export default handler;