/*
  ** convert sticker to videos
*/

import axios  from "axios"
import fs  from "fs"
import BodyForm  from "form-data"
import * as cheerio from "cheerio";

async function webp2mp4File(path) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!fs.existsSync(path)) throw new Error("File tidak ditemukan!");

      const form = new BodyForm();
      form.append("new-image-url", "");
      form.append("new-image", fs.createReadStream(path));

      const upload = await axios({
        method: "post",
        url: "https://ezgif.com/webp-to-mp4", 
        data: form,
        maxRedirects: 5,
        timeout: 60000,
        headers: {
          ...form.getHeaders(),
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(upload.data);
      const file = $('input[name="file"]').attr("value");
      if (!file) {
        console.log(upload.data.slice(0, 200)); 
        throw new Error("Gagal upload ke ezgif (file kosong)");
      }

      const form2 = new BodyForm();
      form2.append("file", file);
      form2.append("convert", "Convert WebP to MP4!");

      const convert = await axios({
        method: "post",
        url: "https://ezgif.com/webp-to-mp4/" + file,
        data: form2,
        maxRedirects: 5,
        timeout: 60000,
        headers: {
          ...form2.getHeaders(),
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      const $$ = cheerio.load(convert.data);
      const src = $$("#output > p.outfile > video > source").attr("src");
      if (!src) throw new Error("Gagal ambil link hasil convert!");

      resolve({
        status: true,
        result: "https:" + src,
      });
    } catch (err) {
      reject(err);
    }
  });
}

const handler = async (m, { sock, reply, command, example }) => {
  
  const quoted = m.quoted ? m.quoted : m;
  const mime = (quoted.msg || quoted).mimetype || "";
  if (!/webp/.test(mime)) return reply(example("reply sticker nya pastikan sticker animated!"))
  
  reply("Wait. . .");

  try {
    const media = await sock.downloadAndSaveMediaMessage(quoted);
    const webpToMp4 = await webp2mp4File(media);

    await sock.sendMessage(m.chat, {
      video: { url: webpToMp4.result },
      caption: "*Sticker To Video Succes 🍀*",
    }, { quoted: m });

    fs.unlinkSync(media);
  } catch (err) {
    console.error(err);
    reply("Gagal mengonversi sticker. Coba lagi nanti.");
  }
};

handler.command = ["tovid", "tovideo"];
export default handler;