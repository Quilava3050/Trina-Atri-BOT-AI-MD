
import axios from "axios";

const handler = async (m, { sock, text, command, reply, usedPrefix }) => {
  try {

    if (!text) return reply(`Example:\n${usedPrefix}${command} username`);
    reply ("Wait...")
    const url = `${global.api.free1}/maker/lobbyffmax?text=${encodeURIComponent(
      text
    )}`;

    const buffer = (await axios.get(url, { responseType: "arraybuffer" })).data;

    await sock.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: `Result ✓`
      },
      { quoted: m }
    );
  } catch (err) {
    console.error(err);
    reply("Error bang, API nya mungkin lagi error!");
  }
};

handler.command = ["fakeff", "fff", "fakeloby"]
export default handler;