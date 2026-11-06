import axios from "axios"

function isPin(url) {
  if (!url) return false;
  const patterns = [
    /^https?:\/\/(?:www\.)?pinterest\.com\/pin\/[\w.-]+/,
    /^https?:\/\/(?:www\.)?pinterest\.[\w.]+\/pin\/[\w.-]+/,
    /^https?:\/\/pin\.it\/[\w.-]+/,
    /^https?:\/\/(?:www\.)?pinterest\.com\/amp\/pin\/[\w.-]+/,
    /^https?:\/\/(?:[a-z]{2}|www)\.pinterest\.com\/pin\/[\w.-]+/,
    /^https?:\/\/(?:www\.)?pinterest\.com\/pin\/[\d]+(?:\/)?$/,
    /^https?:\/\/(?:www\.)?pinterest\.[\w.]+\/pin\/[\d]+(?:\/)?$/,
  ];
  return patterns.some(pattern => pattern.test(url.trim().toLowerCase()));
}

async function getCookies() {
  try {
    const response = await axios.get("https://www.pinterest.com/csrf_error/");
    const setCookieHeaders = response.headers["set-cookie"];
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.map(cookieString => {
        return cookieString.split(";")[0].trim();
      });
      return cookies.join("; ");
    }
    return null;
  } catch {
    return null;
  }
}

async function pindl(pinUrl) {
  try {
    const cookies = await getCookies();
    if (!cookies) return null;

    if (!isPin(pinUrl)) return null;

    let pinId = pinUrl.split("/pin/")[1]?.replace("/", "");

    if (!pinId) {
      const redirectUrl = await axios.get(pinUrl);
      pinId = redirectUrl.request.res.responseUrl.split("/pin/")[1].split("/")[0];
    }

    const url = "https://www.pinterest.com/resource/PinResource/get/";
    const params = {
      source_url: `/pin/${pinId}/`,
      data: JSON.stringify({
        options: { field_set_key: "detailed", id: pinId },
        context: {}
      }),
      _: Date.now()
    };

    const { data } = await axios.get(url, {
      headers: {
        cookie: cookies,
        referer: "https://www.pinterest.com/",
        "user-agent": "Mozilla/5.0"
      },
      params
    });

    const pd = data.resource_response?.data;
    if (!pd) return null;

    const media = [];

    if (pd.videos) {
      const list = Object.values(pd.videos.video_list).sort((a, b) => b.width - a.width);
      list.forEach(video => {
        media.push({
          type: "video",
          url: video.url,
          width: video.width,
          height: video.height
        });
      });
    }

    if (pd.images) {
      const im = {
        original: pd.images.orig,
        large: pd.images["736x"],
        medium: pd.images["474x"]
      };
      Object.entries(im).forEach(([quality, image]) => {
        if (image) {
          media.push({
            type: "image",
            quality,
            url: image.url,
            width: image.width,
            height: image.height
          });
        }
      });
    }

    return {
      id: pd.id,
      title: pd.title || "",
      description: pd.description || "",
      media
    };

  } catch {
    return null;
  }
}

async function pinterest(query, limit = 20) {
  try {
    const cookies = await getCookies();
    if (!cookies) return [];

    const url = "https://www.pinterest.com/resource/BaseSearchResource/get/";

    const dataParam = {
      options: {
        article_size: "normal",
        auto_correction_disabled: false,
        camera: null,
        custom_personalization_parameters: null,
        enable_query_correction: true,
        input: query,
        only_show_csr: true,
        page_size: Math.min(limit, 250),
        query,
        scope: "pins",
        top_level_domain: "com",
        bookmark: null
      },
      context: {}
    };

    const params = {
      source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
      data: JSON.stringify(dataParam),
      _: Date.now()
    };

    const headers = {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "cookie": cookies,
      "referer": "https://www.pinterest.com/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "x-app-version": "c056fb7",
      "x-pinterest-appstate": "active",
      "x-pinterest-pws-handler": "www/search.js",
      "x-pinterest-source-url": `/search/pins/?q=${encodeURIComponent(query)}`,
      "x-requested-with": "XMLHttpRequest"
    };

    const res = await axios.get(url, { headers, params });

    const results = res.data?.resource_response?.data?.results || [];
    if (!results.length) return [];

    return results
      .filter((r) => r.images?.orig)
      .slice(0, limit)
      .map((r) => ({
        upload_by: r.pinner?.username,
        fullname: r.pinner?.full_name,
        followers: r.pinner?.follower_count,
        caption: r.grid_title,
        image: r.images?.orig?.url,
        source: `https://www.pinterest.com/pin/${r.id}`
      }));

  } catch (e) {
    console.log("Search Error:", e);
    return [];
  }
}

let handler = async (m, { sock, text, reply, usedPrefix }) => {

  if (!text) return reply(`Contoh: ${usedPrefix}pin rumah`)

  reply("Wait...")

  try {
    const results = await pinterest(text, 10)

    if (!results || results.length === 0)
      return reply("❌ Tidak ada hasil ditemukan di Pinterest.")

    const selected = results.slice(0, 5)

    const album = selected.map((v, i) => ({
      image: { url: v.image },
      caption: i === 0 ? `Pinterest Result` : undefined
    }))

    await sock.sendMessage(
      m.chat,
      { album },
      { quoted: m }
    )

  } catch (err) {
    console.error(err)
    reply("⚠️ Terjadi kesalahan saat scrape Pinterest.")
  }
}

handler.command = ["pin", "pinterest"]
export default handler