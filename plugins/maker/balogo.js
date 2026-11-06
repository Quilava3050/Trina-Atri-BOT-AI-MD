import fs from "fs";
import baLogo from "ba-logo";

const handler = async (m, { sock, text, command, reply, example, args, usedPrefix }) => {
  try {

    if (!args[0])
      return reply(`*Cara Penggunaan :*\n${usedPrefix}${command} TrinaQuil`);

    const input = args.join(" ").trim();

    await reply("Wait. . .");

    const image = await baLogo(input);
    const buffer = await image.toBuffer(); 

    await sock.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: `Berhasil membuat logo dengan tulisan: *${input}*`,
      },
      { quoted: m }
    );
  } catch (e) {
    console.error("[ba-logo Handler Error]", e);
    reply(`❌ *Ups, gagal membuat logo!*\n\nDetail: ${e.message || e}`);
  }
};

handler.command = ["balogo", "logo","buatlogo"];
export default handler;
