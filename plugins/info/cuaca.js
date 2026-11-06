import axios from "axios";

const handler = async (m, { sock, text, usedPrefix, command }) => {
  try {
    
    if (!text) {
      return m.reply(
        `Contoh penggunaan:
${usedPrefix + command} pasiran jaya`
      );
    }

    m.reply("Wait. . .");

    const { data } = await axios.get(
      `${global.api.free9}/info/cuaca?q=${encodeURIComponent(text)}`
    );

    if (!data.status) return m.reply("❌ Data cuaca tidak ditemukan.");

    const wilayah = data.data.wilayah.nama;
    const lokasi = data.data.weather[0].lokasi;
    const cuaca = data.data.weather[0].cuaca[0][0];

    let teks = `🌤 *Info Cuaca*\n\n`;
    teks += `📍 Wilayah : ${wilayah}\n`;
    teks += `🏙 Provinsi : ${lokasi.provinsi}\n`;
    teks += `🏘 Kota : ${lokasi.kotkab}\n`;
    teks += `🌡 Suhu : ${cuaca.t}°C\n`;
    teks += `🌥 Cuaca : ${cuaca.weather_desc}\n`;
    teks += `💧 Kelembapan : ${cuaca.hu}%\n`;
    teks += `💨 Angin : ${cuaca.ws} km/j\n`;
    teks += `👁 Jarak Pandang : ${cuaca.vs_text}\n`;
    teks += `🕒 Waktu : ${cuaca.local_datetime}\n`;

    await sock.sendMessage(
      m.chat,
      {
        image: { url: cuaca.image },
        caption: teks
      },
      { quoted: m }
    );

  } catch (e) {
    console.log(e);
    m.reply("❌ Terjadi kesalahan.");
  }
};

handler.command = ["cuaca", "weather"];

export default handler;