// plugins/grup/intro.js
const handler = async (m, { sock, reply }) => {

  reply(`╭─〔 🐼 𝐈𝐧𝐭𝐫𝐨𝐝𝐮𝐜𝐞 𝐘𝐨𝐮𝐫𝐬𝐞𝐥𝐟 〕
│ ✦ 𝐍𝐚𝐦𝐚      : 
│ ✦ 𝐔𝐦𝐮𝐫      : 
│ ✦ 𝐆𝐞𝐧𝐝𝐞𝐫    : 
│ ✦ 𝐇𝐨𝐛𝐢      : 
│ ✦ 𝐊𝐞𝐚𝐡𝐥𝐢𝐚𝐧  : 
╰───────────────────────
_📌 Jangan lupa baca deskripsi grup_`)
};

handler.command = ["intro"];
handler.group = true

export default handler;