import axios from "axios"
import fs from "fs"
import path from "path"
import os from "os"

const MAX_WA_BYTES = 100 * 1024 * 1024; // 100 MB
const DEFAULT_TIMEOUT = 120000;
const GH_TOKEN = process.env.GITHUB_TOKEN || "";

const axiosInstance = axios.create({
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "User-Agent": "github-downloader-bot",
    ...(GH_TOKEN ? { Authorization: `token ${GH_TOKEN}` } : {}),
  },
  maxRedirects: 5,
});

const parseGitHubUrl = (rawUrl) => {
  if (typeof rawUrl !== "string") return null;
  let url = rawUrl.trim().replace(/\?.*$/, "").replace(/#.*$/, "");
  url = url.replace(/\.git\/?$/i, "").replace(/\/+$/i, "");

  const patterns = {
    repo: /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)$/i, // user/repo
    tree: /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.+))?/i, // user/repo/tree/branch[/path]
    file: /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/i, // blob
    raw: /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/i, // raw
    gist: /^https?:\/\/gist\.github\.com\/([^/]+)\/([a-f0-9]+)/i,
  };

  for (const [type, regex] of Object.entries(patterns)) {
    const match = url.match(regex);
    if (match) return { type, match };
  }
  return null;
};

const humanSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
};

const getRemoteSize = async (url) => {
  try {
    const head = await axiosInstance.head(url);
    const len = head.headers["content-length"];
    return len ? parseInt(len, 10) : null;
  } catch (e) {
    try {
      const res = await axiosInstance.get(url, { responseType: "stream" });
      const len = res.headers["content-length"];
      if (res.data && typeof res.data.destroy === "function") res.data.destroy();
      return len ? parseInt(len, 10) : null;
    } catch (err) {
      return null;
    }
  }
};

const downloadToBuffer = async (url) => {
  const res = await axiosInstance.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
};

const handler = async (m, { sock, text, reply }) => {
  try {

    if (!text) return m.reply("url github nya mna?");

    const url = text.trim();
    const parsed = parseGitHubUrl(url);
    if (!parsed) return m.reply("URL GitHub tidak valid atau tipe tidak didukung");

    const { type, match } = parsed;

    const sendLinkOnly = async (link, note) => {
      await m.reply(`📎 Link: ${link}\n${note || ""}`);
    };

    // ---------- repo / repo.git ----------
    if (type === "repo" || type === "repo_git") {
      const user = match[1], repo = match[2];
      await m.reply("Wait...");

      let repoData;
      try {
        const r = await axiosInstance.get(`https://api.github.com/repos/${user}/${repo}`);
        repoData = r.data;
      } catch (err) {
        if (err.response && err.response.status === 404) return m.reply("❌ Repo tidak ditemukan (404).");
        return m.reply("❌ Gagal mengambil info repo dari GitHub.");
      }

      const branch = repoData.default_branch || "master";
      const zipUrl = `https://github.com/${user}/${repo}/archive/refs/heads/${branch}.zip`;
      const filename = `${repo}-${branch}.zip`;

      const size = await getRemoteSize(zipUrl);
      if (size && size > MAX_WA_BYTES) {
        return sendLinkOnly(zipUrl, `*ZIP ~ ${humanSize(size)} terlalu besar untuk dikirim lewat WA*`);
      }

      // download
      const buffer = await downloadToBuffer(zipUrl);
      if (buffer.length > MAX_WA_BYTES) {
        return sendLinkOnly(zipUrl, `*ZIP ~ ${humanSize(buffer.length)} terlalu besar untuk dikirim lewat WA*`);
      }

      await sock.sendMessage(m.chat, {
        document: buffer,
        fileName: filename,
        mimetype: "application/zip",
        caption: `*GitHub Downloader*\n> File Name : ${filename}`,
      }, { quoted: m });

      return;
    }

    // ---------- tree (branch) ----------
    if (type === "tree") {
      const user = match[1], repo = match[2], branch = match[3];
      const zipUrl = `https://github.com/${user}/${repo}/archive/refs/heads/${branch}.zip`;
      const filename = `${repo}-${branch}.zip`;

      await m.reply("Wait...");

      const size = await getRemoteSize(zipUrl);
      if (size && size > MAX_WA_BYTES) {
        return sendLinkOnly(zipUrl, `*ZIP ~ ${humanSize(size)} terlalu besar untuk dikirim lewat WA*`);
      }

      const buffer = await downloadToBuffer(zipUrl);
      if (buffer.length > MAX_WA_BYTES) {
        return sendLinkOnly(zipUrl, `*ZIP ~ ${humanSize(buffer.length)} terlalu besar untuk dikirim lewat WA*`);
      }

      await sock.sendMessage(m.chat, {
        document: buffer,
        fileName: filename,
        mimetype: "application/zip",
        caption: `*GitHub Downloader*\n> File Name : ${filename}`,
      }, { quoted: m });

      return;
    }

    // ---------- file (blob) ----------
    if (type === "file") {
      const user = match[1], repo = match[2], branch = match[3], filePath = match[4];
      const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${filePath}?ref=${branch}`;

      await m.reply("Wait...");

      let fileData;
      try {
        const r = await axiosInstance.get(apiUrl);
        fileData = r.data;
      } catch (err) {
        if (err.response && err.response.status === 404) return m.reply("❌ File tidak ditemukan (404).");
        return m.reply("❌ Gagal mengambil metadata file dari GitHub.");
      }

      const rawUrl = fileData.download_url;
      const size = fileData.size || (rawUrl ? await getRemoteSize(rawUrl) : null);

      if (fileData.encoding === "base64" && (fileData.size || 0) <= 1024 * 5) {
        // keep response text same as user original
        return m.reply(`*GitHub Downloader*\n> File Name : ${fileData.name}`);
      }

      if (!rawUrl) {
        return m.reply(`*GitHub Downloader*\n> File Name : ${fileData.name}`);
      }

      if (size && size > MAX_WA_BYTES) {
        return sendLinkOnly(rawUrl, `*File ~ ${humanSize(size)} terlalu besar untuk dikirim via WA*`);
      }

      const buffer = await downloadToBuffer(rawUrl);
      if (buffer.length > MAX_WA_BYTES) {
        return sendLinkOnly(rawUrl, `*File ~ ${humanSize(buffer.length)} terlalu besar untuk dikirim via WA*`);
      }

      const ext = path.extname(fileData.name).toLowerCase();
      const isText = ["", ".md", ".txt", ".js", ".ts", ".json", ".py", ".sh", ".css", ".html"].includes(ext);
      if (isText && buffer.length < 100 * 1024) {
        await m.reply(`${fileData.name}\n\n` + buffer.toString().slice(0, 4000));
      } else {
        await sock.sendMessage(m.chat, {
          document: buffer,
          fileName: fileData.name,
          mimetype: "application/octet-stream",
          caption: `*GitHub Downloader*\n> File Name : ${fileData.name}`,
        }, { quoted: m });
      }
      return;
    }

    // ---------- raw ----------
    if (type === "raw") {
      const filePath = match[4];
      const rawUrl = url;
      const size = await getRemoteSize(rawUrl);
      if (size && size > MAX_WA_BYTES) return sendLinkOnly(rawUrl, `*File ~ ${humanSize(size)} terlalu besar untuk dikirim via WA*`);

      await m.reply("Wait...");
      const buffer = await downloadToBuffer(rawUrl);
      if (buffer.length > MAX_WA_BYTES) return sendLinkOnly(rawUrl, `*File ~ ${humanSize(buffer.length)} terlalu besar untuk dikirim via WA*`);

      const name = path.basename(filePath || "file");
      const ext = path.extname(name).toLowerCase();
      const isText = [".md", ".txt", ".js", ".ts", ".json", ".py", ".sh", ".css", ".html"].includes(ext);
      if (isText && buffer.length < 100 * 1024) {
        await m.reply(buffer.toString().slice(0, 4000));
      } else {
        await sock.sendMessage(m.chat, {
          document: buffer,
          fileName: name,
          mimetype: "application/octet-stream",
          caption: `*GitHub Downloader*\n> File Name : ${name}`,
        }, { quoted: m });
      }
      return;
    }

    // ---------- gist ----------
    if (type === "gist") {
      const user = match[1], gistId = match[2];
      await m.reply("Wait...");

      let gist;
      try {
        const r = await axiosInstance.get(`https://api.github.com/gists/${gistId}`);
        gist = r.data;
      } catch (err) {
        if (err.response && err.response.status === 404) return m.reply("❌ Gist tidak ditemukan (404).");
        return m.reply("❌ Gagal mengambil gist dari GitHub.");
      }

      const files = Object.entries(gist.files || {}).map(([fname, f]) => ({ name: fname, raw_url: f.raw_url, size: f.size || 0 }));
      if (!files.length) return m.reply("⚠️ Gist kosong.");

      const smallFiles = files.filter(f => f.size && f.size <= MAX_WA_BYTES);
      if (smallFiles.length > 0) {
        for (const f of smallFiles) {
          try {
            const buf = await downloadToBuffer(f.raw_url);
            if (buf.length <= MAX_WA_BYTES) {
              const ext = path.extname(f.name).toLowerCase();
              const isText = [".md", ".txt", ".js", ".py", ".json"].includes(ext);
              if (isText && buf.length < 100 * 1024) {
                await m.reply(`${f.name}\n\n${buf.toString().slice(0, 4000)}`);
              } else {
                await sock.sendMessage(m.chat, {
                  document: buf,
                  fileName: f.name,
                  mimetype: "application/octet-stream",
                }, { quoted: m });
              }
            } else {
              await m.reply(`⚠️ File ${f.name} terlalu besar, link: ${f.raw_url}`);
            }
          } catch (e) {
            await m.reply(`⚠️ Gagal download ${f.name}, link: ${f.raw_url}`);
          }
        }
        return;
      }

      const list = files.map(f => `- ${f.name} (${humanSize(f.size)})\n  ${f.raw_url}`).join("\n\n");
      return m.reply(`💡 Gist: ${gist.description || "-"}\n\nFiles:\n${list}`);
    }

    return m.reply("Tipe URL GitHub tidak didukung.");
  } catch (err) {
    console.error("GH handler error:", err?.response?.data || err?.message || err);
    return m.reply("Gagal mengambil data GitHub. Pastikan URL valid dan coba lagi.");
  }
};

handler.command = ["gh", "gitdl", "gitclone"];
export default handler;