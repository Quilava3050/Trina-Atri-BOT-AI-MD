const handler = async (m, { sock, reply, command, usedPrefix }) => {
    let video;

    try {
        if (m.quoted && m.quoted.mtype === "videoMessage") {
            video = await m.quoted.download();
        } else if (m.mtype === "videoMessage") {
            video = await m.download();
        }
    } catch (error) {
        console.error("[PTVCH] Gagal download video:", error);
        return reply("❌ Gagal mengunduh video.");
    }

    if (!video) {
        return reply(`Kirim atau reply video lalu gunakan ${usedPrefix + command}.`);
    }

    const channelId = global.idChannel;
    if (!channelId || !channelId.endsWith("@newsletter")) {
        return reply("❌ ID channel belum dikonfigurasi dengan benar di settings.js.");
    }

    await reply("⏳ Mengirim video ke channel sebagai PTV...");

    try {
        await sock.sendMessage(channelId, {
            video,
            mimetype: "video/mp4",
            ptv: true
        });

        await sock.sendMessage(m.chat, {
            react: { text: "✅", key: m.key }
        });
        return reply("✅ Video berhasil dikirim ke channel sebagai PTV.");
    } catch (error) {
        console.error("[PTVCH] Gagal mengirim ke channel:", error);
        return reply("❌ Gagal mengirim video ke channel. Pastikan bot sudah mengikuti channel tersebut.");
    }
};

handler.help = ["ptvch"];
handler.tags = ["owner"];
handler.command = ["ptvch", "ptvchannel", "ptvchanel", "ptvstory"];
handler.owner = true;

export default handler;