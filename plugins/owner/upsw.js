import crypto from "crypto";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { generateWaveform } from "../../control/lib/audio-waveform.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);
const SWGC_HISTORY_FILE = path.join(process.cwd(), "data", "trash", "upswgc-history.json");
const STATUS_COLORS = [
  "#0A2315", "#0D2818", "#2D3A24", "#354228", "#3B4E41", "#26382B",
  "#400A10", "#4A0E17", "#3B0B14", "#361019", "#000000", "#121212",
  "#0F172A", "#1E293B", "#1C1412", "#1A1D20", "#0B132B"
];
const lastStatusColorByGroup = new Map();

// Temporary cache untuk menyimpan media & caption dari Private Chat
if (!global.swgcCache) global.swgcCache = new Map();

function randomBg(groupId) {
  const previousColor = lastStatusColorByGroup.get(groupId);
  const availableColors = previousColor
    ? STATUS_COLORS.filter(color => color !== previousColor)
    : STATUS_COLORS;
  const color = availableColors[Math.floor(Math.random() * availableColors.length)];
  lastStatusColorByGroup.set(groupId, color);
  console.log(`[SWGC] Warna status teks untuk ${groupId}: ${color}`);
  return Number.parseInt(`FF${color.slice(1)}`, 16);
}

function readSwgcHistory() {
  if (!fs.existsSync(SWGC_HISTORY_FILE)) return [];
  const history = JSON.parse(fs.readFileSync(SWGC_HISTORY_FILE, "utf8"));
  if (!Array.isArray(history)) throw new Error("Format riwayat status grup tidak valid.");
  return history;
}

function writeSwgcHistory(history) {
  fs.mkdirSync(path.dirname(SWGC_HISTORY_FILE), { recursive: true });
  fs.writeFileSync(SWGC_HISTORY_FILE, JSON.stringify(history.slice(0, 50), null, 2));
}

function saveSwgcHistory(item) {
  const history = readSwgcHistory();
  history.unshift(item);
  writeSwgcHistory(history);
}

async function deleteSwgcStatus(sock, m, item, reply) {
  if (!item?.id || !item?.groupId) {
    return reply("Data status tidak lengkap; status tidak dihapus.");
  }

  await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })
    .catch(error => console.warn("[DELSWGC] Gagal memasang reaksi proses:", error?.message || error));
  try {
    await sock.sendMessage(item.groupId, {
      delete: {
        remoteJid: item.groupId,
        fromMe: true,
        id: item.id
      }
    });

    const history = readSwgcHistory().filter(status =>
      !(status.id === item.id && status.groupId === item.groupId)
    );
    writeSwgcHistory(history);
    await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
      .catch(error => console.warn("[DELSWGC] Gagal memasang reaksi sukses:", error?.message || error));
    return reply(`✅ Status grup berhasil dihapus dari *${item.groupName || item.groupId}*.`);
  } catch (error) {
    console.error("[DELSWGC] Gagal menghapus status grup:", error);
    await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
      .catch(reactionError => console.warn("[DELSWGC] Gagal memasang reaksi gagal:", reactionError?.message || reactionError));
    return reply(`❌ Gagal menghapus status grup: ${error.message || error}`);
  }
}

async function handleDeleteSwgc(sock, m, args, reply) {
  const history = readSwgcHistory();
  if (!history.length) return reply("Riwayat status grup kosong.");

  const selection = args?.[0]?.trim().toLowerCase();
  if (!selection) {
    const entries = history.slice(0, 20).map((item, index) => {
      const title = item.groupName || item.groupId;
      const date = new Date(item.timestamp).toLocaleString("id-ID");
      return `${index + 1}. ${title} | ${date}\n   ID: ${item.id}`;
    });
    return reply(`*Riwayat Status Grup*\n\n${entries.join("\n\n")}\n\nHapus: .delswgc <nomor|ID|all>`);
  }

  if (selection === "all") {
    const failed = [];
    for (const item of [...history]) {
      try {
        await sock.sendMessage(item.groupId, {
          delete: {
            remoteJid: item.groupId,
            fromMe: true,
            id: item.id
          }
        });
      } catch (error) {
        console.error(`[DELSWGC] Gagal menghapus status ${item.id}:`, error);
        failed.push(item);
      }
    }
    writeSwgcHistory(failed);
    return reply(`Penghapusan diproses: ${history.length - failed.length}/${history.length} status berhasil.`);
  }

  const status = /^\d+$/.test(selection)
    ? history[Number(selection) - 1]
    : history.find(item => item.id === selection);
  if (!status) return reply("Nomor atau ID status tidak ditemukan di riwayat.");
  return deleteSwgcStatus(sock, m, status, reply);
}

// Fungsi Konversi Audio ke Voice Note Status
async function processAudioToVN(inputBuffer) {
  const tempFolder = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true });

  const id = crypto.randomUUID();
  const inPath = path.join(tempFolder, `in_sw_${id}.media`);
  const outPath = path.join(tempFolder, `out_sw_${id}.ogg`);

  try {
    fs.writeFileSync(inPath, inputBuffer);
    await execFileAsync(ffmpegInstaller.path, [
      "-y", "-i", inPath, "-vn", "-c:a", "libopus", "-b:a", "64k",
      "-ac", "1", "-ar", "48000", "-map_metadata", "-1", outPath
    ], { maxBuffer: 10 * 1024 * 1024 });

    const fileBuffer = fs.readFileSync(outPath);
    const waveform = await generateWaveform(fileBuffer);
    return { outPath, waveform };
  } catch (error) {
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    throw error;
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
  }
}

const handler = async (
  m,
  {
    sock,
    text,
    command,
    usedPrefix,
    reply,
    generateWAMessageFromContent,
    generateWAMessageContent,
  }
) => {

  async function sendGroupStatus(jid, content, groupName = jid) {
    const inside = await generateWAMessageContent(content, {
      upload: sock.waUploadToServer,
    });

    if (typeof content.text === "string" && content.backgroundArgb != null) {
      const textMessage = inside.extendedTextMessage ||
        (typeof inside.conversation === "string" ? { text: inside.conversation } : null);
      if (!textMessage) {
        throw new Error("Pesan teks status tidak menghasilkan extendedTextMessage untuk menerapkan warna.");
      }
      delete inside.conversation;
      inside.extendedTextMessage = {
        ...textMessage,
        backgroundArgb: content.backgroundArgb,
        font: content.font ?? 1,
      };
    }

    if (content.waveform) {
      if (!inside.audioMessage) {
        throw new Error("Waveform tersedia, tetapi audioMessage tidak terbentuk.");
      }
      inside.audioMessage.waveform = Buffer.from(content.waveform);
    }

    const messageSecret = crypto.randomBytes(32);

    const msg = generateWAMessageFromContent(
      jid,
      {
        messageContextInfo: { messageSecret },
        groupStatusMessageV2: {
          message: {
            ...inside,
            messageContextInfo: { messageSecret },
          },
        },
      },
      {}
    );

    await sock.relayMessage(jid, msg.message, {
      messageId: msg.key.id,
    });

    let historySaved = true;
    try {
      saveSwgcHistory({
        id: msg.key.id,
        groupId: jid,
        groupName,
        text: content.text || content.caption || "",
        timestamp: Date.now()
      });
    } catch (error) {
      historySaved = false;
      console.error("[SWGC] Status terkirim tetapi gagal disimpan ke riwayat:", error);
    }

    return { id: msg.key.id, historySaved };
  }

  if (command === "delswgc") {
    try {
      return await handleDeleteSwgc(sock, m, text?.trim().split(/\s+/), reply);
    } catch (error) {
      console.error("[DELSWGC] Gagal membaca atau memperbarui riwayat:", error);
      return reply(`❌ Gagal mengelola riwayat status grup: ${error.message || error}`);
    }
  }

  // --- SUB HANDLER: Jika user memilih dari tombol List ---
  if (command === "swgc_select") {
    const targetGc = text?.trim();
    const cachedData = global.swgcCache.get(m.sender);

    if (!cachedData) {
      return reply("❌ Data status sudah kedaluwarsa atau tidak ditemukan. Silakan jalankan ulang perintah `.swgc`.");
    }

    if (!targetGc) return reply("❌ ID Grup tidak valid.");

    const allgc = await sock.groupFetchAllParticipating();
    if (!allgc[targetGc]) return reply(`❌ Bot sudah tidak ada di grup tersebut.`);

    await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    try {
      let content = {};
      const { media, mime, caption } = cachedData;

      if (media && mime) {
        if (/image/.test(mime)) {
          content = caption ? { image: media, caption } : { image: media };
        } else if (/video/.test(mime)) {
          content = caption ? { video: media, caption } : { video: media };
        } else if (/audio/.test(mime)) {
          try {
            const { outPath, waveform } = await processAudioToVN(media);
            content = {
              audio: { url: outPath },
              mimetype: "audio/ogg; codecs=opus",
              ptt: true,
              waveform: waveform
            };
            setTimeout(() => { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); }, 10000);
          } catch (e) {
            console.error("Gagal proses audio:", e);
            throw new Error(`Gagal mengonversi audio untuk status grup: ${e.message || e}`);
          }
        } else if (/sticker/.test(mime)) {
          content = { sticker: media };
        }
      } else {
        content = {
          text: caption || " ",
          backgroundArgb: randomBg(targetGc),
          font: 1,
        };
      }

      const uploadResult = await sendGroupStatus(targetGc, content, allgc[targetGc]?.subject || targetGc);
      
      // Hapus cache setelah berhasil
      global.swgcCache.delete(m.sender);

      await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      const historyNotice = uploadResult.historySaved ? "" : "\n⚠️ Status terkirim, tetapi ID-nya gagal disimpan sehingga tidak muncul di riwayat hapus.";
      return reply(`✅ Status berhasil ter-upload di grup *${allgc[targetGc]?.subject || targetGc}*!${historyNotice}`);

    } catch (e) {
      console.error(e);
      await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      return reply(`❌ Gagal mengirim status: ${e.message || e}`);
    }
  }

  // --- MAIN HANDLER: .swgc / .upswgc ---
  const isQuoted = !!m.quoted;
  const mime = isQuoted ? (m.quoted.mimetype || m.quoted.mtype) : null;
  let caption = text?.trim() || "";
  let media = null;

  if (isQuoted) {
    media = await m.quoted.download();
  }

  // A. PRIVATE CHAT HANDLER (Tampilkan List Grup)
  if (!m.isGroup) {
    const groupsObj = await sock.groupFetchAllParticipating();
    const groups = Object.values(groupsObj);

    if (!groups.length) return reply("Bot tidak bergabung di grup manapun.");

    if (!caption && !isQuoted) {
      return reply(
        `*Cara pakai di Private Chat:*\n` +
        `› ${usedPrefix + command} teks_status\n` +
        `› Atau reply gambar/video/audio/stiker dengan caption ${usedPrefix + command}`
      );
    }

    // Simpan payload status di Memory RAM berdasar JID pengirim (Expired 5 menit)
    global.swgcCache.set(m.sender, {
      media,
      mime,
      caption
    });

    setTimeout(() => {
      if (global.swgcCache.has(m.sender)) global.swgcCache.delete(m.sender);
    }, 5 * 60 * 1000);

    // Format List yang Ringkas (rowId pendek)
    let listRows = groups.map((g) => ({
      title: g.subject.slice(0, 24),
      description: `ID: ${g.id}`,
      rowId: `${usedPrefix}swgc_select ${g.id}`,
    }));

    return sock.sendMessage(
      m.chat,
      {
        text: `📌 *PILIH GRUP TARGET STATUS*\n\nPesan status kamu sudah disimpan. Silakan pilih grup tujuan di bawah ini:`,
        footer: `Total ${groups.length} Grup Terdeteksi • © ${global.namaBot || 'Bot'}`,
        buttonText: "Klik Pilih Grup",
        sections: [
          {
            title: "Daftar Grup Terhubung",
            rows: listRows,
          },
        ],
      },
      { quoted: m }
    );
  }

  // B. GROUP CHAT HANDLER (Langsung Upload ke Grup Tersebut)
  let targetGc = m.chat;
  let content = {};

  await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

  try {
    if (isQuoted && media) {
      if (/image/.test(mime)) {
        content = caption ? { image: media, caption } : { image: media };
      } else if (/video/.test(mime)) {
        content = caption ? { video: media, caption } : { video: media };
      } else if (/audio/.test(mime)) {
        const { outPath, waveform } = await processAudioToVN(media);
        content = {
          audio: { url: outPath },
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
          waveform: waveform
        };
        setTimeout(() => { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); }, 10000);
      } else if (/sticker/.test(mime)) {
        content = { sticker: media };
      } else {
        return reply("Media tidak didukung untuk status.");
      }
    } else {
      if (!caption) {
        return reply(
          `*Cara pakai di Grup:*\n` +
          `› ${usedPrefix + command} text\n` +
          `› Atau reply media (foto/video/audio/stiker)`
        );
      }

      content = {
        text: caption,
        backgroundArgb: randomBg(targetGc),
        font: 1,
      };
    }

    const groupMetadata = await sock.groupMetadata(targetGc);
    const uploadResult = await sendGroupStatus(targetGc, content, groupMetadata.subject || targetGc);
    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    const historyNotice = uploadResult.historySaved ? "" : "\n⚠️ Status terkirim, tetapi ID-nya gagal disimpan sehingga tidak muncul di riwayat hapus.";
    return reply(`Status grup berhasil diupload!${historyNotice}`);

  } catch (e) {
    console.error(e);
    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    return reply(`❌ Gagal upload status: ${e.message || e}`);
  }
};

handler.command = ["upswgc", "swgc", "upswgroup", "swgc_select", "delswgc"];
handler.help = ["swgc <teks|reply media>", "delswgc [nomor|ID|all]"];
handler.owner = true;

export default handler;