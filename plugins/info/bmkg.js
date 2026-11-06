import axios from "axios";

const handler = async (m, { sock }) => {
  try {
    m.reply("Wait. . .");

    const { data } = await axios.get(
      `${global.api.free9}/info/bmkg`
    );

    if (!data.status) return m.reply("❌ Gagal mengambil data BMKG.");

    const g = data.data.auto.Infogempa.gempa;

    let teks = `🌍 *Info Gempa BMKG*\n\n`;
    teks += `📅 Tanggal : ${g.Tanggal}\n`;
    teks += `⏰ Jam : ${g.Jam}\n`;
    teks += `📍 Wilayah : ${g.Wilayah}\n`;
    teks += `📌 Koordinat : ${g.Lintang} - ${g.Bujur}\n`;
    teks += `📏 Magnitude : ${g.Magnitude}\n`;
    teks += `📊 Kedalaman : ${g.Kedalaman}\n`;
    teks += `⚠️ Potensi : ${g.Potensi}\n`;
    teks += `📳 Dirasakan : ${g.Dirasakan}\n`;

    await sock.sendMessage(
      m.chat,
      {
        image: { url: g.downloadShakemap },
        caption: teks
      },
      { quoted: m }
    );

  } catch (e) {
    console.log(e);
    m.reply("❌ Terjadi kesalahan.");
  }
};

handler.command = ["gempa", "bmkg"];

export default handler;