const handler = async (m, { sock, args, reply, command, usedPrefix }) => {

  let vid;

  if (m.quoted && m.quoted.mtype === "videoMessage") {
    vid = await m.quoted.download();
  } else if (m.mtype === "videoMessage") {
    vid = await m.download();
  }

  if (!vid)
    return reply(`Ex : ${usedPrefix + command} (reply video)`);

  await sock.sendMessage(
    m.chat,
    {
      video: vid,
      mimetype: "video/mp4",
      ptv: true,
    },
    { quoted: m }
  );
};

handler.command = ["toptv"];
export default handler;