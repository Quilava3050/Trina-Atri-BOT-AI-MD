import { randomBytes } from "crypto";
import sharp from "sharp";
import { generateWAMessageFromContent } from "@whiskeysockets/baileys";

const COLORS = [
  { id: "white", label: "Putih", hex: "#FFFFFF" },
  { id: "black", label: "Hitam", hex: "#000000" },
  { id: "red", label: "Merah", hex: "#FF0000" },
  { id: "blue", label: "Biru", hex: "#0000FF" },
  { id: "green", label: "Hijau", hex: "#00AA00" },
  { id: "yellow", label: "Kuning", hex: "#FFFF00" },
  { id: "pink", label: "Pink", hex: "#FF69B4" },
  { id: "purple", label: "Ungu", hex: "#800080" },
  { id: "gray", label: "Abu-abu", hex: "#808080" },
  { id: "cyan", label: "Cyan", hex: "#00FFFF" }
];

const MAX_IMAGE_SIZE = 12 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg";
const PENDING_TTL = 5 * 60 * 1000;
const pendingImages = new Map();
const pendingByUser = new Map();

const removeBackground = async (input, mimeType, hexColor) => {
  const apiKey = String(global.bgcolor || "").trim();
  if (!apiKey) {
    throw new Error("API key remove.bg belum dikonfigurasi. Isi global.bgcolor di settings.js.");
  }

  const form = new FormData();
  form.append("image_file", new Blob([input], { type: mimeType }), "image");
  form.append("size", "auto");
  form.append("format", "png");

  const response = await fetch(REMOVE_BG_ENDPOINT, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      Accept: "image/png"
    },
    body: form,
    signal: AbortSignal.timeout(60_000)
  });

  if (!response.ok) {
    const responseText = (await response.text()).slice(0, 2000);
    let detail = responseText;
    try {
      const payload = JSON.parse(responseText);
      detail = payload.errors?.map(error => error.title || error.detail || error.code).filter(Boolean).join("; ") ||
        payload.error || responseText;
    } catch {}
    throw new Error(`remove.bg (${response.status}): ${detail || response.statusText}`);
  }

  const foreground = Buffer.from(await response.arrayBuffer());
  if (!foreground.length) throw new Error("remove.bg mengembalikan gambar kosong.");

  return sharp(foreground, { limitInputPixels: MAX_IMAGE_PIXELS })
    .flatten({ background: hexColor })
    .jpeg({ quality: 92 })
    .toBuffer();
};

const clearPendingImage = (token) => {
  const pending = pendingImages.get(token);
  if (!pending) return;
  clearTimeout(pending.timer);
  pendingImages.delete(token);
  pendingByUser.delete(pending.userKey);
};

const handler = async (m, { sock, text, usedPrefix, command, reply }) => {
  if (!String(global.bgcolor || "").trim()) {
    return reply("API key remove.bg belum dikonfigurasi. Isi global.bgcolor di settings.js.");
  }

  const userKey = `${m.chat}:${m.sender || m.key?.participant || ""}`;
  const [token, colorId] = String(text || "").trim().split(/\s+/);

  if (token && colorId) {
    const pending = pendingImages.get(token);
    if (!pending || pending.userKey !== userKey || pending.chat !== m.chat) {
      return reply("Pilihan warna ini sudah kedaluwarsa atau bukan milikmu. Kirim ulang gambar dengan perintah *.bgcolor*.");
    }

    const color = COLORS.find(({ id }) => id === colorId.toLowerCase());
    if (!color) return reply("Pilihan warna tidak valid. Jalankan ulang perintah *.bgcolor* untuk memilih warna.");
    if (pending.processing) return;
    pending.processing = true;

    try {
      await sock.sendMessage(m.chat, { react: { text: "🕒", key: m.key } });
      const output = await removeBackground(pending.buffer, pending.mimeType, color.hex);

      clearPendingImage(token);
      await sock.sendMessage(m.chat, {
        image: output,
        caption: `Background diubah menjadi ${color.label} (${color.hex}).`
      }, { quoted: m });
      await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
    } catch (error) {
      pending.processing = false;
      console.error("[BGCOLOR] Gagal mengganti background:", error.message);
      await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      await reply(`Gagal mengganti background: ${String(error.message || error).slice(0, 500)}`);
    }
    return;
  }

  const image = m.quoted || m;
  const mime = image.mimetype || image.msg?.mimetype || "";
  if (!mime.startsWith("image/")) {
    return reply(`Kirim atau reply gambar dengan caption *${usedPrefix + command}* untuk memilih warna background.`);
  }

  try {
    const buffer = await image.download();
    if (!buffer?.length) throw new Error("Gambar kosong atau gagal diunduh.");
    if (buffer.length > MAX_IMAGE_SIZE) {
      return reply("Ukuran gambar maksimal 12 MB sesuai batas remove.bg.");
    }
    const metadata = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
    if (!metadata.width || !metadata.height) throw new Error("Dimensi gambar tidak dapat dibaca.");
    if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
      return reply("Resolusi gambar terlalu besar. Maksimal 40 megapiksel.");
    }

    const previousToken = pendingByUser.get(userKey);
    if (previousToken) clearPendingImage(previousToken);

    const newToken = randomBytes(6).toString("hex");
    const timer = setTimeout(() => clearPendingImage(newToken), PENDING_TTL);
    pendingImages.set(newToken, {
      buffer,
      mimeType: mime,
      chat: m.chat,
      userKey,
      timer,
      processing: false
    });
    pendingByUser.set(userKey, newToken);

    const rows = COLORS.map(({ id, label, hex }) => ({
      title: label,
      description: hex,
      id: `${usedPrefix + command} ${newToken} ${id}`
    }));
    const selection = generateWAMessageFromContent(m.chat, {
      interactiveMessage: {
        body: {
          text: "Pilih warna background. remove.bg akan memisahkan objek dari latar gambar."
        },
        footer: { text: "Pilihan berlaku selama 5 menit." },
        nativeFlowMessage: {
          buttons: [{
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Pilih warna",
              sections: [{ title: "Warna background", rows }]
            })
          }],
          messageParamsJson: "{}",
          messageVersion: 1
        }
      }
    }, { quoted: m });

    await sock.relayMessage(m.chat, selection.message, { messageId: selection.key.id });
  } catch (error) {
    console.error("[BGCOLOR] Gagal menyiapkan gambar:", error);
    await reply("Gagal membaca gambar. Pastikan formatnya didukung dan coba lagi.");
  }
};

handler.help = ["bgcolor"];
handler.tags = ["maker"];
handler.command = ["bgcolor"];

export default handler;
