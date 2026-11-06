const handler = async (m, { sock, text, command, reply, example }) => {
  try {

    if (!text) return reply(example('username YouTube nya'));
    reply ("Wait...")
    // API BARU
    const api = await fetch(
      `${global.api.free3}/stalker/youtube?username=${encodeURIComponent(text)}`
    );
    const res = await api.json();

    if (!res.status || !res.result)
      throw '❌ Gagal mengambil data dari API YouTube';

    const ch = res.result.channel || {};
    const videos = res.result.latest_videos || [];

    const caption = `*YouTube Stalker 🔴*

🎬 Channel: ${ch.username || '-'}
📛 Subscribers: ${ch.subscriberCount || '-'}
🎥 Total Videos: ${ch.videoCount || '-'}
📝 Description:
${ch.description || '-'}
🔗 Channel URL: ${ch.channelUrl || '-'}

━━━━━━━━━━━━━━━
🎞️ *5 Video Terbaru:*
${
  videos.length
    ? videos.slice(0, 5).map((v, i) => `
${i + 1}. *${v.title || '-'}*
📅 ${v.publishedTime || '-'}
👁️ ${v.viewCount || '-'}
⏱️ ${v.duration || '-'}
🔗 ${v.videoUrl || '-'}
`).join('\n')
    : 'Tidak ada video terbaru'
}
━━━━━━━━━━━━━━━`;

    await sock.sendMessage(
      m.chat,
      {
        image: { url: ch.avatarUrl },
        caption
      },
      { quoted: m }
    );
  } catch (error) {
    console.error(error);
    reply('❌ Terjadi kesalahan: ' + error);
  } finally {
    await sock.sendMessage(m.chat, { react: { text: '', key: m.key } });
  }
};

handler.command = ['ytstalk', 'yts2'];
export default handler;

