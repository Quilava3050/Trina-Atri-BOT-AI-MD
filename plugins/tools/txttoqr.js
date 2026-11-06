let handler = async (m, { sock, text, usedPrefix, command }) => {

	if (!text) return m.reply(`Use example: \n${usedPrefix + command} <teks>`);
	
	sock.sendFile(m.chat, `https://quickchart.io/qr?text=${encodeURIComponent(text)}`, 'qrcode.png', 'Result!', m);
};

handler.command = ["qr", "texttoqr"]

export default handler;