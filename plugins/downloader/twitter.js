/*

 * @copyright Copyright (c) https://github.com/dylanpdx/BetterTwitFix
 * Sumber Scrape https://gist.githubusercontent.com/AxellNetwork/d9fac53537f5d2f06f4cf36111a8915c/raw/443e5263bd18b1dcb1655921f2d23be3a55250b2/vxtwitter.js
 
 Create a feature By 
 https://whatsapp.com/channel/0029VbAbEkb5Ejy7jjjG7p3H
 
 Jangan di hapus!!!!
 */

import axios from "axios"

async function vxtwitter(url) {
  if (/x.com/.test(url)) {
    url = url.replace("x.com", "twitter.com");
  }
  let { data } = await axios
    .get(url.replace("twitter.com", "api.vxtwitter.com"))
    .catch((e) => e.response);

  if (!data || !data.media_extended)
    throw new Error("⚠️ Media tidak ditemukan atau link tidak valid.");

  return {
    metadata: {
      title: data.text,
      id: data.tweetID,
      likes: data.likes?.toLocaleString() || 0,
      replies: data.replies?.toLocaleString() || 0,
      retweets: data.retweets?.toLocaleString() || 0,
      uploaded: new Date(data.date).toLocaleString(),
      author: data.user_name,
    },
    downloads: data.media_extended.map((a) => ({
      mimetype: a.type === "image" ? "image/jpg" : "video/mp4",
      url: a.url,
    })),
  };
}

const handler = async ( m, { sock, text, command, reply, example }) => {
  try {

    let input =
  text ||
  m.quoted?.text ||
  m.quoted?.caption ||
  m.quoted?.conversation ||
  "";

if (!input)
  return reply(example("link tweet nya mana?"));

const twitterRegex =
  /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\s]+\/status\/[0-9]+/i;

const match = input.match(twitterRegex);

if (!match)
  return reply("❌ Link harus dari tweet Twitter/X.");

const url = match[0];

reply("Wait. . .");

const result = await vxtwitter(url);
    const { metadata, downloads } = result;

    let sent = false;
    for (const media of downloads) {
      if (media.mimetype.startsWith("video")) {
        await sock.sendMessage(
          m.chat,
          { video: { url: media.url } },
          { quoted: m }
        );
        sent = true;
        break; // kirim satu video aja biar hemat bandwidth
      } else if (media.mimetype.startsWith("image")) {
        await sock.sendMessage(
          m.chat,
          { image: { url: media.url } },
          { quoted: m }
        );
        sent = true;
      }
    }

    if (!sent) return reply("⚠️ Tidak ada media ditemukan di tweet ini.");

  } catch (err) {
    console.error("Error Twitter Downloader:", err.response?.data || err.message);
    reply("⚠️ Gagal mengunduh media dari Twitter. (Cek link atau mungkin private).");
  }
};

handler.command = ["twitter", "tw", "twdl"];
export default handler;