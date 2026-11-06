
import axios from "axios";

const handler = async (m, { sock, text, command, reply, usedPrefix }) => {
  try {
    if (!text) return reply(`Ex: ${usedPrefix}${command} username ny`);
    reply ("Wait...")
    const url = `${global.api.free1}/stalker/ttstalk?username=${text}`;
    const { data } = await axios.get(url);

    if (!data?.status) return reply("Gagal mengambil data!");

    const user = data.result.user;
    const stats = data.result.stats;

    let cap = `*🐣 TikTok Stalker Result*
- *Username:* ${user.uniqueId}
- *Nickname:* ${user.nickname}
- *Region:* ${user.region}
- *Akun dibuat:* ${new Date(user.createTime * 1000).toLocaleDateString()}
- *Verified:* ${user.verified ? "Yes" : "No"}
- *Private:* ${user.privateAccount ? "Yes" : "No"}

*💌 Other information*
- *Stats*
- Followers: ${stats.followerCount}
- Following: ${stats.followingCount}
- Likes: ${stats.heartCount}
- Video: ${stats.videoCount}`;

    await sock.sendMessage(m.chat, {
      image: { url: user.avatarLarger },
      caption: cap
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    reply("Error bang, cek username nya!");
  }
};

handler.command = ["ttstalker", "ttstalk", "stt",'stalktt']
export default handler;