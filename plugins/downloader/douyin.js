import axios from "axios"
import querystring from "querystring"
import * as cheerio from "cheerio";

async function savetik(url) {
  try {
    const endpoint = "https://savetik.co/api/ajaxSearch";

    const data = querystring.stringify({
      q: url,
      lang: "id",
      cftoken: "",
    });

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "*/*",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
      Referer: "https://savetik.co/id/douyin-downloader",
    };

    const res = await axios.post(endpoint, data, { headers });

    const html =
      typeof res.data.data === "string"
        ? res.data.data
        : res.data?.data?.html || "";

    if (!html) throw new Error("⚠️ Respon Savetik kosong");

    const $ = cheerio.load(html);

    const caption = $("h3").text().trim();
    const thumbnail = $("img").attr("src") || "";

    // === VIDEO ===
    const video = $('a:contains("Unduh MP4")').attr("href") || "";
    const video_hd = $('a:contains("Unduh MP4 HD")').attr("href") || "";

    // === AUDIO ===
    const audio = $('a:contains("Unduh MP3")').attr("href") || "";

    // === FOTO DOUIYIN ===
    let images = [];

    // #1 "Unduh Foto"
    $('a:contains("Foto")').each((i, el) => {
      const href = $(el).attr("href");
      if (href) images.push(href);
    });

    // #2 fallback: semua file CDN yang bukan video/audio
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      if (
        (href.includes("cdn") ||
          href.includes("media") ||
          href.includes("file")) &&
        !href.endsWith(".mp4") &&
        !href.endsWith(".mp3") &&
        !href.includes("video")
      ) {
        images.push(href);
      }
    });

    images = [...new Set(images)];

    return {
      status: true,
      caption,
      thumbnail,
      video,
      video_hd,
      audio,
      images,
      isImagePost: images.length > 0 && !video && !video_hd,
    };
  } catch (e) {
    return {
      status: false,
      msg: e.message,
    };
  }
}

const handler = async (m, { sock, text, command, reply, example }) => {
  try {

    if (!text) return m.reply(example("link video / foto Douyin nya??"));

    m.reply("Wait...");

    const result = await savetik(text);
    if (!result.status)
      return m.reply("⚠️ Gagal mengambil data dari savetik.co\n" + result.msg);

    const { caption, thumbnail, video_hd, video, images, isImagePost } = result;

    if (isImagePost) {
  for (const img of images) {
    try {
      const pic = await axios.get(img, { responseType: "arraybuffer" });

      await sock.sendMessage(
        m.chat,
        {
          image: pic.data,
          mimetype: "image/jpeg",
          caption: "Result",
        },
        { quoted: m }
      );

    } catch (err) {
      console.log("Gagal kirim foto:", img, err.message);
      await m.reply("⚠️ Foto gagal dimuat: " + img);
    }
  }
  return;
}

    // === HANDLE VIDEO ===
    if (video_hd || video) {
      let jpegThumb = null;
      if (thumbnail) {
        try {
          jpegThumb = (
            await axios.get(thumbnail, { responseType: "arraybuffer" })
          ).data;
        } catch {}
      }

      await sock.sendMessage(
        m.chat,
        {
          video: { url: video_hd || video },
          caption: `Result`,
          jpegThumbnail: jpegThumb,
        },
        { quoted: m }
      );

      return;
    }

    return m.reply("⚠️ Media tidak ditemukan!");

  } catch (err) {
    console.error("Error Douyin Downloader:", err.message);
    m.reply("⚠️ Gagal mengunduh media Douyin. Mungkin link invalid atau limit situs.");
  }
};

handler.command = ["douyindl", "dy", "douyin"];
export default handler;