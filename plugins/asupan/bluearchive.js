import fetch from "node-fetch";

const handler = async (m, { sock, usedPrefix }) => {
  try {

    const imageUrl = `${global.api.free1}/random/ba`;

    await sock.sendMessage(m.chat, {
      image: { url: imageUrl },
      caption: `📌 *Blue Archive Random*\n\nKetik *.bluearchive* untuk gambar selanjutnya`,
      footer: `© ${namaBot} 2025`,
      buttons: [
        {
          buttonId: `${usedPrefix}bluearchive`,
          buttonText: { displayText: "Next" },
          type: 1
        }
      ],
      headerType: 1
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    m.reply("❌ Terjadi kesalahan saat mengambil data Blue Archive.");
  }
};

handler.command = ["bluearchive","ba","blue"];
export default handler;