import fs from 'fs';
import path from 'path';

const getMutedList = () => {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'database.json'), 'utf-8'));
    const muted = Object.values(data.groups).filter(g => g.mute === 1).map(g => ({ id: g.id }));
    return Promise.resolve(muted);
};

const handler = async (m, { sock, reply, command, db, getGroup }) => {
    
    if (command === 'bangc') {
        if (!m.isGroup) return reply(mess.group)  // ← cek manual di sini
        const chatDb = await getGroup(m.chat);
        if (chatDb.mute === 1) return reply("*Grup* ini sudah di *mute*");

        await db('groups', m.chat, 'mute', 1);
        return reply("Grup ini *berhasil di mute*");
    } 

    else if (command === 'unbangc') {
        if (!m.isGroup) return reply(mess.group)  // ← cek manual di sini
        const chatDb = await getGroup(m.chat);
        if (chatDb.mute === 0) return reply("Group ini tidak di *mute*");
        
        await db('groups', m.chat, 'mute', 0);
        return reply("Grup ini *berhasil diunmute*");
    } 

    else if (command === 'listbangc') {

        const list = await getMutedList();
        if (list.length === 0) {
            return reply("Tidak ada Grup Chat yang sedang di-mute.");
        }

        let listTeks = "*Group on Mute:*\n\n";
        
        const groupInfoPromises = list.map(async (row, index) => {
            const jid = row.id; 
            let groupName = "undefined";
            
            if (sock && sock.groupMetadata) {
                try {
                    const groupMetadata = await sock.groupMetadata(jid);
                    groupName = groupMetadata.subject;
                } catch (e) {
                    groupName = "Tidak Dapat Mengambil Nama";
                }
            }
            
            return `${index + 1}. ${groupName}\n› ${jid}\n\n`;
        });
        
        const groupInfo = await Promise.all(groupInfoPromises);
        listTeks += groupInfo.join('\n');
        
        return reply(listTeks);
    }
}

handler.command = ['bangc', 'unbangc', 'listbangc'];
handler.owner = true

export default handler;