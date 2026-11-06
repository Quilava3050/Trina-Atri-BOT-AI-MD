import axios from "axios";

const handler = async (m, { sock, usedPrefix, command }) => {
  try {
    m.reply("Wait. . .");

    const { data } = await axios.get(
      `${global.api.free9}/info/event-indonesia`
    );

    if (!data.status) return m.reply("❌ Gagal mengambil data event.");

    let teks = `📅 *Event Indonesia*\n\n`;

    // Hari ini
    teks += `*Hari Ini (${data.data.hari_ini.tanggal})*\n`;
    if (data.data.hari_ini.events.length === 0) {
      teks += `Tidak ada event hari ini\n\n`;
    } else {
      data.data.hari_ini.events.forEach((v, i) => {
        teks += `${i + 1}. ${v}\n`;
      });
      teks += `\n`;
    }

    // Event Nasional Mendatang
    teks += `*Event Nasional Mendatang*\n`;
    data.data.mendatang.event_nasional.slice(0, 5).forEach((v, i) => {
      teks += `${i + 1}. ${v.event}\n`;
      teks += `📆 ${v.date} • ${v.daysUntil} hari lagi\n\n`;
    });

    // Hari Libur Mendatang
    teks += `*Hari Libur Mendatang*\n`;
    data.data.mendatang.hari_libur.slice(0, 5).forEach((v, i) => {
      teks += `${i + 1}. ${v.event}\n`;
      teks += `📆 ${v.date} • ${v.daysUntil} hari lagi\n\n`;
    });

    m.reply(teks);

  } catch (e) {
    console.log(e);
    m.reply("❌ Terjadi kesalahan.");
  }
};

handler.command = ["eventindo", "harinasional"];

export default handler;