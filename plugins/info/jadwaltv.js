import axios from "axios";

const handler = async (m, { sock, text, usedPrefix, command }) => {
  try {
    if (!text) {
      return m.reply(
        `Contoh penggunaan:
${usedPrefix + command} sctv`
      );
    }

    m.reply("Wait. . .");

    const { data } = await axios.get(
      `${global.api.free9}/info/jadwaltv?channel=${encodeURIComponent(text)}`
    );

    if (!data.status) return m.reply("❌ Jadwal TV tidak ditemukan.");

    let teks = `📺 *Jadwal TV ${text.toUpperCase()}*\n\n`;

    data.data.forEach((v, i) => {
      teks += `${i + 1}. ${v.jam}\n`;
      teks += `   ${v.acara}\n\n`;
    });

    m.reply(teks);

  } catch (e) {
    console.log(e);
    m.reply("❌ Terjadi kesalahan.");
  }
};

handler.command = ["jadwaltv", "tv"];

export default handler;