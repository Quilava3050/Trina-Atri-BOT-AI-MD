import { readMenuStyle, writeMenuStyle } from "../../control/menu-settings.js";

const handler = async (m, { text, reply, usedPrefix }) => {
const menuType = readMenuStyle();

const menuName = {
1: "document + externalAdReply",
2: "externalAdReply V1",
3: "image V1",
4: "interactive modern list",
5: "externalAdReply V2",
6: "image V2",
7: "externalAdReply + image",
8: "document image",
9: "produk message"
}


if (!text) {

return reply(`*SET MENU DISPLAY:*

1. document + externalAdReply
2. externalAdReply V1
3. image V1
4. interactive modern list
5. externalAdReply V2
6. image V2
7. externalAdReply + image
8. document image
9. produk message

*EXAMPLE OF USE:*
> ${usedPrefix}setmenu 1

*MENU STATUS:*
› Menu mode : \`${menuType}\`
› Style menu : *${menuName[menuType] || "unknown"}*
`)
}


const type = Number(text)


if (type < 1 || type > 9)
return reply("Pilihan tidak valid.")


writeMenuStyle(type)


reply(`Menu display berhasil diganti ke mode *${type}*`)
}


handler.owner = true
handler.command = ["setmenu"]

export default handler