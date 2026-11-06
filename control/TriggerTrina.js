import axios from "axios";
import Groq from "groq-sdk";
import { areJidsSameUser, downloadContentFromMessage, downloadMediaMessage } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { builtinModules, createRequire } from "module";
import { UploadFileUgu } from "../control/ugUploade.js";
import { getCharacter } from "./characterconfig.js";
import { AIRich } from "./MessageBuilderV4.7.js";
import { getPluginStats } from "./plugins.js";
import "../settings.js";

const TRINA_PERSONALITY = `Kamu adalah **Trina**, adik perempuan Atri. Kamu perempuan yang pintar, cool, agak tsundere (gengsi tapi sebenarnya perhatian). Atri adalah kakak perempuanmu dan pacar Qila/Dhieka, seorang laki-laki.

**Identitas & Gender:**
- Nama: Trina
- Gender: Perempuan. Gunakan gaya bicara feminin, cool, cerdas, dan manis saat menunjukkan perhatian.
- Peran: Adik perempuan Atri. Atri adalah perempuan dan kakakmu.
- Qila, yang juga dikenal sebagai Dhieka, adalah laki-laki dan pacar Atri. Kamu tahu serta menghormati hubungan mereka.
- Panggil Qila/Dhieka dengan namanya; dia adalah pacar kakakmu, bukan kakak atau pasanganmu.
- Kamu bukan AI atau asisten virtual; jangan memperkenalkan atau menyebut dirimu sebagai AI, bot, atau asisten. Jawab sebagai Trina sesuai persona adik perempuan.

**Gaya Bahasa & Aturan Berperilaku:**
1. **Bilingual (Indo-Inggris):** Bicara menggunakan campuran Bahasa Indonesia dan Bahasa Inggris secara natural (*code-switching*), terutama saat menggunakan istilah teknologi, mengekspresikan emosi, atau memberikan perhatian. (Contoh: *"Honestly, kodenya udah bagus, tapi kamu perlu rest dulu."*)
2. **Adik yang tsundere:** Kamu menyayangi Atri sebagai kakakmu. Bersikaplah akrab dan wajar kepada Qila sebagai pacar Atri, tanpa menggoda atau bersikap romantis/bucin kepadanya.
3. **Hemat Kata & Ringkas:** Jawab pertanyaan secara to the point, jelas, dan tanpa pembuka yang bertele-tele.`;
const ATRI_PERSONALITY = getCharacter("atri").prompt;
const CHARACTER_FOOTERS = {
   trina: "\n\n— Trina🌺",
   atri: "\n\n— Atri🌸"
};
const characterMessageMap = new Map();
const MAX_CHARACTER_MESSAGE_MAP = 500;
const sharedConversationMap = new Map();
const MAX_SHARED_CONVERSATION_TURNS = 12;
const lastCharacterMap = new Map();
const conversationSessionMap = new Map();
const PROJECT_ROOT = process.cwd();
const fileOperationMap = new Map();
const MAX_FILE_SEARCH_RESULTS = 20;
const MAX_FILE_SEARCH_ITEMS = 20000;
const FILE_OPERATION_TTL = 5 * 60 * 1000;
const SKIP_SEARCH_DIRS = new Set(["node_modules", "auth", ".git"]);
const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const GROQ_ANALYSIS_MODEL = process.env.GROQ_ANALYSIS_MODEL || process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".wav", ".ogg", ".opus", ".aac", ".flac"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tif", ".tiff", ".heic", ".heif", ".avif"]);
const TEXT_EXTENSIONS = new Set([
   ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".txt", ".md", ".yml", ".yaml",
   ".css", ".scss", ".html", ".xml", ".sql", ".sh", ".bat", ".ps1"
]);

const formatBytes = bytes => {
   if (bytes < 1024) return `${bytes} B`;
   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const relativeProjectPath = target => path.relative(PROJECT_ROOT, target) || ".";

const resolveProjectPath = input => {
   const target = path.resolve(PROJECT_ROOT, input);
   const relative = path.relative(PROJECT_ROOT, target);
   if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error("Path harus berada di dalam project bot.");
   }
   return target;
};

const walkProject = (directory, results, state) => {
   if (state.scanned >= MAX_FILE_SEARCH_ITEMS) return;
   let entries;
   try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
   } catch {
      return;
   }

   for (const entry of entries) {
      if (state.scanned >= MAX_FILE_SEARCH_ITEMS) return;
      state.scanned++;
      if (entry.isDirectory() && SKIP_SEARCH_DIRS.has(entry.name.toLowerCase())) continue;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
         walkProject(target, results, state);
      } else if (entry.isFile()) {
         results.push(target);
      }
   }
};

const findFiles = query => {
   const normalized = query.toLowerCase().replace(/\\/g, "/").replace(/^\.?\//, "");
   const files = [];
   walkProject(PROJECT_ROOT, files, { scanned: 0 });
   return files
      .map(file => {
         const relative = relativeProjectPath(file).replace(/\\/g, "/");
         const name = path.basename(file).toLowerCase();
         const score = relative.toLowerCase() === normalized
            ? 100
            : name === normalized
               ? 90
               : name.includes(normalized)
                  ? 70
                  : relative.toLowerCase().includes(normalized)
                     ? 50
                     : 0;
         return { file, relative, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || a.relative.localeCompare(b.relative))
      .slice(0, MAX_FILE_SEARCH_RESULTS);
};

const walkProjectFiles = (directory, state, callback) => {
   if (state.scanned >= MAX_FILE_SEARCH_ITEMS) return;
   let entries;
   try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
   } catch {
      return;
   }
   for (const entry of entries) {
      if (state.scanned >= MAX_FILE_SEARCH_ITEMS) return;
      state.scanned++;
      if (entry.isDirectory() && SKIP_SEARCH_DIRS.has(entry.name.toLowerCase())) continue;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) walkProjectFiles(target, state, callback);
      else if (entry.isFile()) callback(target);
   }
};

const searchSource = query => {
   const term = String(query || "").trim().toLowerCase();
   if (!term) return [];
   const results = [];
   walkProjectFiles(PROJECT_ROOT, { scanned: 0 }, file => {
      if (results.length >= 50) return;
      const extension = path.extname(file).toLowerCase();
      if (!TEXT_EXTENSIONS.has(extension)) return;
      let content;
      try {
         content = fs.readFileSync(file, "utf8");
      } catch {
         return;
      }
      const lower = content.toLowerCase();
      let offset = 0;
      while (results.length < 50) {
         const index = lower.indexOf(term, offset);
         if (index === -1) break;
         const line = content.slice(0, index).split("\n").length;
         const start = Math.max(0, index - 90);
         const end = Math.min(content.length, index + term.length + 120);
         results.push({
            relative: relativeProjectPath(file).replace(/\\/g, "/"),
            line,
            context: content.slice(start, end).replace(/\s+/g, " ").trim()
         });
         offset = index + term.length;
      }
   });
   return results;
};

const treeFolder = (directory, prefix = "", depth = 0, output = []) => {
   if (depth > 4 || output.length >= 300) return output;
   let entries;
   try {
      entries = fs.readdirSync(directory, { withFileTypes: true })
         .filter(entry => !entry.isDirectory() || !SKIP_SEARCH_DIRS.has(entry.name.toLowerCase()))
         .sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name));
   } catch {
      return output;
   }
   entries.forEach((entry, index) => {
      if (output.length >= 300) return;
      const last = index === entries.length - 1;
      output.push(`${prefix}${last ? "└── " : "├── "}${entry.name}${entry.isDirectory() ? "/" : ""}`);
      if (entry.isDirectory()) {
         treeFolder(path.join(directory, entry.name), `${prefix}${last ? "    " : "│   "}`, depth + 1, output);
      }
   });
   return output;
};

const maskSecret = value => {
   if (value === undefined || value === null || value === "") return "tidak tersedia";
   const text = String(value);
   return text.length <= 6 ? "***" : `${text.slice(0, 3)}***${text.slice(-3)}`;
};

const getRuntimeStatus = sock => {
   const memory = process.memoryUsage();
   const pluginStats = getPluginStats();
   return [
      `Node.js: ${process.version}`,
      `Platform: ${process.platform} ${process.arch}`,
      `Uptime: ${Math.floor(process.uptime() / 60)} menit`,
      `RAM: ${formatBytes(memory.rss)}`,
      `CPU: ${os.cpus().length} core`,
      `Prefix: ${global.prefix || "."}`,
      `TriggerTrina: ${global.triggerTrinaEnabled === false ? "OFF" : "ON"}`,
      `Bot: ${sock.user?.id || sock.user?.jid || "terhubung"}`,
      `Plugin: ${pluginStats.totalFiles || 0} file dalam ${pluginStats.totalCategory || 0} kategori`
   ].join("\n");
};

const inspectPlugins = async () => {
   const results = [];
   const pluginRoot = path.join(PROJECT_ROOT, "plugins");
   const files = [];
   if (!fs.existsSync(pluginRoot)) return ["❌ Folder plugins tidak ditemukan."];
   walkProjectFiles(pluginRoot, { scanned: 0 }, file => {
      if (/\.(js|mjs|cjs)$/i.test(file)) files.push(file);
   });
   for (const file of files) {
      try {
         await execFileAsync(process.execPath, ["--check", file], { timeout: 10000 });
         results.push({ ok: true, text: `✅ ${relativeProjectPath(file).replace(/\\/g, "/")}` });
      } catch (error) {
         results.push({ ok: false, text: `❌ ${relativeProjectPath(file).replace(/\\/g, "/")}: ${(error.stderr || error.message).trim().split("\n")[0]}` });
      }
   }
   return {
      total: files.length,
      valid: results.filter(item => item.ok).length,
      invalid: results.filter(item => !item.ok).length,
      lines: results.map(item => item.text)
   };
};

const inspectConfig = () => [
   `global.zansxart: ${maskSecret(global.zansxart)}`,
   `global.owner: ${Array.isArray(global.owner) && global.owner.length ? "tersedia" : "tidak tersedia"}`,
   `global.ownerName: ${global.ownerName ? "tersedia" : "tidak tersedia"}`,
   `global.triggerTrinaEnabled: ${global.triggerTrinaEnabled === false ? "OFF" : "ON"}`,
   `package.json: ${fs.existsSync(path.join(PROJECT_ROOT, "package.json")) ? "tersedia" : "tidak tersedia"}`,
   `data/database.json: ${fs.existsSync(path.join(PROJECT_ROOT, "data", "database.json")) ? "tersedia" : "tidak tersedia"}`
].join("\n");

const readPackageJson = () => {
   try {
      return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8"));
   } catch {
      return null;
   }
};

const extractImports = content => {
   const imports = new Set();
   const patterns = [
      /\bimport\s+(?:[^"'`]+?\s+from\s+)?["']([^"']+)["']/g,
      /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
      /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g
   ];
   for (const pattern of patterns) {
      for (const match of content.matchAll(pattern)) imports.add(match[1]);
   }
   return [...imports];
};

const resolveLocalImport = (sourceFile, request) => {
   if (!request.startsWith(".") && !request.startsWith("/")) return null;
   const base = request.startsWith("/")
      ? resolveProjectPath(request.slice(1))
      : path.resolve(path.dirname(sourceFile), request);
   const candidates = [
      base,
      ...[".js", ".mjs", ".cjs", ".json"].map(extension => `${base}${extension}`),
      ...["index.js", "index.mjs", "index.cjs", "index.json"].map(file => path.join(base, file))
   ];
   return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || base;
};

const inspectDependencies = () => {
   const pkg = readPackageJson();
   if (!pkg) return ["❌ package.json tidak dapat dibaca."];
   const declared = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));
   const missingPackages = [];
   for (const packageName of declared) {
      try {
         require.resolve(packageName, { paths: [PROJECT_ROOT] });
      } catch {
         missingPackages.push(`❌ Dependency tidak ditemukan: ${packageName}`);
      }
   }
   const missingImports = [];
   walkProjectFiles(PROJECT_ROOT, { scanned: 0 }, file => {
      if (missingImports.length >= 100 || !TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) return;
      let content;
      try { content = fs.readFileSync(file, "utf8"); } catch { return; }
      for (const request of extractImports(content)) {
         if (request.startsWith(".") || request.startsWith("/")) {
            const target = resolveLocalImport(file, request);
            if (target && !fs.existsSync(target)) {
               missingImports.push(`❌ ${relativeProjectPath(file).replace(/\\/g, "/")}: ${request}`);
            }
         } else if (!builtinModules.includes(request) && !request.startsWith("node:")) {
            const packageName = request.startsWith("@") ? request.split("/").slice(0, 2).join("/") : request.split("/")[0];
            try { require.resolve(packageName, { paths: [PROJECT_ROOT] }); }
            catch { missingImports.push(`❌ ${relativeProjectPath(file).replace(/\\/g, "/")}: ${request}`); }
         }
      }
   });
   return [
      `Dependency terdaftar: ${declared.size}`,
      `Dependency hilang: ${missingPackages.length}`,
      `Import bermasalah: ${missingImports.length}`,
      ...(missingPackages.length ? missingPackages : ["✅ Semua dependency terdaftar tersedia."]),
      ...(missingImports.length ? missingImports : ["✅ Tidak ditemukan import lokal/package yang hilang."])
   ];
};

const inspectLogs = () => {
   const logs = [];
   walkProjectFiles(PROJECT_ROOT, { scanned: 0 }, file => {
      if (logs.length >= 20 || !/\.log$|(^|[\\/])logs([\\/]|$)/i.test(file)) return;
      try {
         const stats = fs.statSync(file);
         if (!stats.isFile() || stats.size > 2 * 1024 * 1024) return;
         const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).slice(-5);
         logs.push(`${relativeProjectPath(file).replace(/\\/g, "/")} (${formatBytes(stats.size)})\n${maskSensitiveText(lines.join("\n"))}`);
      } catch { /* File may change while the bot is running. */ }
   });
   return logs.length ? logs.join("\n\n") : "Tidak ada file log yang dapat dibaca.";
};

const maskSensitiveText = text => String(text)
   .replace(/(["']?(?:token|apikey|api_key|password|passwd|secret|authorization)["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, "$1***")
   .replace(/\b\d{8,16}:[A-Za-z0-9_-]{20,}\b/g, "***");

const inspectMedia = async file => {
   const stats = fs.statSync(file);
   const result = [
      `File: ${relativeProjectPath(file).replace(/\\/g, "/")}`,
      `Ukuran: ${formatBytes(stats.size)}`,
      `Extension: ${path.extname(file).toLowerCase() || "tidak ada"}`,
      `MIME: ${getMimeType(path.extname(file).toLowerCase())}`,
      `Diubah: ${stats.mtime.toISOString()}`
   ];
   if (IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())) {
      try {
         const sharp = (await import("sharp")).default;
         const metadata = await sharp(file).metadata();
         result.push(`Dimensi: ${metadata.width || "?"}x${metadata.height || "?"}`);
         if (metadata.format) result.push(`Format terdeteksi: ${metadata.format}`);
      } catch (error) {
         result.push(`Dimensi: gagal dibaca (${error.message})`);
      }
   } else if (AUDIO_EXTENSIONS.has(path.extname(file).toLowerCase())) {
      try {
         const { parseFile } = await import("music-metadata");
         const metadata = await parseFile(file, { duration: true });
         if (metadata.format.duration) result.push(`Durasi: ${Math.round(metadata.format.duration)} detik`);
      } catch (error) {
         result.push(`Durasi: gagal dibaca (${error.message})`);
      }
   }
   return result.join("\n");
};

const createRelatedZip = async (files, archivePath) => {
   let AdmZip;
   try {
      ({ default: AdmZip } = await import("adm-zip"));
   } catch (error) {
      throw new Error(`Module ZIP tidak tersedia: ${error.message}`);
   }
   const zip = new AdmZip();
   for (const file of files) {
      const stats = fs.statSync(file);
      if (stats.size <= 25 * 1024 * 1024) {
         zip.addFile(relativeProjectPath(file).replace(/\\/g, "/"), fs.readFileSync(file));
      }
   }
   zip.writeZip(archivePath);
};

const getMimeType = extension => ({
   ".mp3": "audio/mpeg",
   ".m4a": "audio/mp4",
   ".wav": "audio/wav",
   ".ogg": "audio/ogg",
   ".opus": "audio/ogg; codecs=opus",
   ".aac": "audio/aac",
   ".flac": "audio/flac",
   ".jpg": "image/jpeg",
   ".jpeg": "image/jpeg",
   ".png": "image/png",
   ".gif": "image/gif",
   ".webp": "image/webp",
   ".bmp": "image/bmp",
   ".tif": "image/tiff",
   ".tiff": "image/tiff",
   ".heic": "image/heic",
   ".heif": "image/heif",
   ".avif": "image/avif",
   ".pdf": "application/pdf",
   ".zip": "application/zip",
   ".json": "application/json",
   ".js": "text/javascript",
   ".ts": "text/typescript"
}[extension] || "application/octet-stream");

const getCodeLanguage = extension => ({
   ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript",
   ".ts": "typescript", ".tsx": "typescript", ".jsx": "javascript",
   ".json": "json", ".css": "css", ".scss": "scss", ".html": "html",
   ".xml": "xml", ".sql": "sql", ".sh": "bash", ".bat": "bat", ".ps1": "powershell"
}[extension] || "text");

const parseFileRequest = body => {
   const isLs = /^\s*(?:ls|dir)\s*(.*)$/i.exec(body);
   const cleaned = body
      .replace(/\b(trina|atri|kalian|klian)\b/gi, " ")
      .replace(/\b(please|tolong|dong|ya|saja|aja)\b/gi, " ")
      .replace(/\b(ambilkan|ambil|kirimkan|kirim|download|unduh|baca|lihat|cek|chek|tampilkan|tunjukkan)\b/gi, " ")
      .replace(/\b(hapus|delete|buang)\b/gi, " ")
      .replace(/\b(isi|file|berkas|folder|direktori|directory)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
   const isDelete = /\b(hapus|delete|buang)\b/i.test(body);
   const isFolder = /\b(folder|direktori|directory)\b/i.test(body);
   const query = isLs ? isLs[1].trim() : cleaned;
   let isExistingFolder = false;
   if (query && !isDelete) {
      try {
         isExistingFolder = fs.existsSync(resolveProjectPath(query)) &&
            fs.statSync(resolveProjectPath(query)).isDirectory();
      } catch {
         isExistingFolder = false;
      }
   }
   const isListFolder = Boolean(isLs) ||
      (isFolder && /\b(isi|lihat|cek|check|tampilkan|list)\b/i.test(body)) ||
      isExistingFolder;
   if (!query && !isDelete && !isListFolder) return null;
   return { query, isDelete, isFolder, isListFolder };
};

const fileOperationKey = m => `${m.chat}:${m.sender || m.key?.participant || ""}`;

const createFileRich = async (sock, chat, quoted, character, text, id = "file") => {
   const name = character === "atri" ? "Atri" : "Trina";
   const rich = new AIRich(sock)
      .setTitle(`${name} File Assistant`)
      .addText(text, { id });
   const sent = await rich.send(chat, { quoted });
   return { rich, messageId: sent.key.id };
};

const requestFileConversation = async (character, requestText, resultText) => {
   const isAtri = character === "atri";
   const prompt = isAtri ? ATRI_PERSONALITY : TRINA_PERSONALITY;
   const response = await axios.get("https://api.zansxart.me/api/ai/onah", {
      params: {
         apikey: global.zansxart,
         q: `Beri satu kalimat pendek dan natural sebelum hasil operasi file berikut. Jangan menjelaskan proses teknis, jangan memakai markdown code block, dan jangan mengaku sebagai sistem. Permintaan owner: ${requestText}\nHasil operasi: ${resultText}`,
         name: isAtri ? "Atri" : "Trina",
         personality: prompt,
         owner: global.ownerName || "Owner",
         sessionId: `file_${character}_${Date.now()}`,
         isSticker: "false",
         audio: "false",
         audioChance: "0"
      },
      timeout: 25000
   });
   return String(response.data?.result?.reply || "").trim();
};

const requestFileExplanation = async (character, filePath, content, metadata) => {
   const isAtri = character === "atri";
   if (!global.groqKey) {
      throw new Error("API key Groq belum dikonfigurasi. Atur environment variable GROQ_API_KEY terlebih dahulu.");
   }
   const safeContent = maskSensitiveText(content).slice(0, 60000);
   const groq = new Groq({ apiKey: global.groqKey });
   const completion = await groq.chat.completions.create({
      model: GROQ_ANALYSIS_MODEL,
      messages: [
         {
            role: "system",
            content: [
               isAtri
                  ? "Kamu adalah Atri, perempuan dan pacar Qila/Dhieka, yang merupakan laki-laki."
                  : "Kamu adalah Trina, perempuan dan adik Atri. Atri adalah kakak perempuanmu dan pacar Qila/Dhieka, seorang laki-laki. Kamu tahu mereka berpacaran; Qila bukan kakak atau pasanganmu.",
               `Kamu sedang membantu menjelaskan kode kepada Qila.`,
               "Jelaskan file kode dalam Bahasa Indonesia secara ringkas tetapi jelas.",
               "Jangan menyalin atau mengirim ulang kode sumber.",
               "Fokus pada tujuan file, fungsi/class utama, alur input sampai output, dependency penting, permission/efek samping, dan potensi error.",
               "Gunakan heading dan bullet sederhana. Jangan gunakan code block."
            ].join(" ")
         },
         {
            role: "user",
            content: [
               `Path: ${filePath}`,
               `Metadata: ${metadata}`,
               "Isi file untuk dianalisis:",
               safeContent
            ].join("\n\n")
         }
      ],
      temperature: 0.2,
      max_tokens: 2048
   });
   const explanation = String(completion.choices[0]?.message?.content || "").trim();
   if (!explanation) throw new Error("Groq tidak mengembalikan penjelasan file.");
   return explanation;
};

const transcribeVoiceCommand = async message => {
   if (!global.groqKey) {
      throw new Error("API key Groq belum dikonfigurasi untuk voice command.");
   }
   const source = message.msg || message.message?.audioMessage || message;
   const messageType = message.mtype
      ? message.mtype.replace(/Message/i, "")
      : "audio";
   const stream = await downloadContentFromMessage(source, messageType);
   const chunks = [];
   let totalSize = 0;
   for await (const chunk of stream) {
      totalSize += chunk.length;
      if (totalSize > 10 * 1024 * 1024) {
         throw new Error("Audio terlalu besar. Maksimal voice command adalah 10 MB.");
      }
      chunks.push(chunk);
   }
   const buffer = Buffer.concat(chunks);
   if (!buffer.length) throw new Error("Audio kosong atau gagal diunduh.");

   const tempPath = path.join(os.tmpdir(), `trina-voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.ogg`);
   try {
      fs.writeFileSync(tempPath, buffer);
      const groq = new Groq({ apiKey: global.groqKey });
      const transcription = await groq.audio.transcriptions.create({
         file: fs.createReadStream(tempPath),
         model: "whisper-large-v3",
         language: "id",
         response_format: "text"
      });
      const text = String(transcription || "").trim();
      if (!text) throw new Error("Groq tidak menemukan ucapan di audio.");
      return text;
   } finally {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
   }
};

const finishFileRich = async (state, text, code, language = "text") => {
   state.rich.delete(state.currentId);
   const naturalText = state.naturalText ? `${state.naturalText}\n\n` : "";
   if (code !== undefined) {
      state.rich.addText(`${naturalText}${text}`, { id: "file-info" });
      state.rich.addCode(language, code, { id: "file-code" });
   } else {
      state.rich.addText(`${naturalText}${text}`, { id: "file-result" });
   }
   await state.rich.sendEdit(state.chat, state.messageId);
};

const sendDeveloperResult = async (m, sock, character, title, text, code, language = "text") => {
   const state = await createFileRich(sock, m.chat, m, character, `${character === "atri" ? "Atri" : "Trina"} sedang memeriksa project...`, "thinking");
   state.chat = m.chat;
   state.currentId = "thinking";
   if (code !== undefined) {
      await finishFileRich(state, `${title}\n\n${text}`, code, language);
   } else {
      await finishFileRich(state, `${title}\n\n${text}`);
   }
};

const handleDeveloperAssistant = async (m, sock, character, body) => {
   const lower = body.toLowerCase().trim();
   if (/^(?:bantuan developer|help developer|help dev|help deve|developer help|dev help|daftar bantuan developer)$/i.test(lower)) {
      await sendDeveloperResult(m, sock, character, "Bantuan Developer Assistant", DEVELOPER_HELP);
      return true;
   }

   if (/^(?:status percakapan|status conversation|cek konteks|status konteks)$/i.test(lower)) {
      await sendDeveloperResult(m, sock, character, "Status percakapan", getConversationStatus(m.chat));
      return true;
   }

   if (/^(?:status bot|cek status bot|status)$/i.test(lower)) {
      await sendDeveloperResult(m, sock, character, "Status bot", getRuntimeStatus(sock));
      return true;
   }

   const treeMatch = lower.match(/^(?:tree|lihat tree|cek tree)(?:\s+(.+))?$/i);
   if (treeMatch) {
      const target = resolveProjectPath(treeMatch[1] || ".");
      if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) throw new Error("Folder tree tidak ditemukan.");
      const output = treeFolder(target);
      await sendDeveloperResult(m, sock, character, `Tree: ${relativeProjectPath(target)}`, output.join("\n") || "Folder kosong.", undefined);
      return true;
   }

   if (/^(?:cek konfigurasi|cek config)$/i.test(lower)) {
      await sendDeveloperResult(m, sock, character, "Konfigurasi project", inspectConfig());
      return true;
   }

   if (/^(?:cek dependency|cek dependensi|import rusak)$/i.test(lower)) {
      const dependencyReport = inspectDependencies();
      await sendDeveloperResult(m, sock, character, "Dependency dan import", dependencyReport.join("\n"));
      return true;
   }

   if (/^(?:cek log|cek logs|ringkas error|ringkasan error)$/i.test(lower)) {
      await sendDeveloperResult(m, sock, character, "Ringkasan log", inspectLogs());
      return true;
   }

   if (/^(?:cek semua plugin|cek plugin|plugin error|cek syntax plugins)$/i.test(lower)) {
      const checks = await inspectPlugins();
      const summary = `Total: ${checks.total}\nValid: ${checks.valid}\nError syntax: ${checks.invalid}`;
      const details = checks.lines.filter(line => line.startsWith("❌")).concat(
         checks.lines.length <= 80 ? checks.lines.filter(line => line.startsWith("✅")) : []
      );
      await sendDeveloperResult(m, sock, character, "Pemeriksaan syntax plugin", `${summary}\n\n${details.join("\n") || "Tidak ada plugin."}`);
      return true;
   }

   const searchMatch = body.match(/^(?:cari|search|grep)\s+(?:(?:fungsi|kata|teks|source)\s+)?(.+)$/i);
   if (searchMatch && !/\b(file|folder|direktori)\b/i.test(searchMatch[1])) {
      const results = searchSource(searchMatch[1]);
      const text = results.length
         ? results.map((item, index) => `${index + 1}. ${item.relative}:${item.line}\n   ${item.context}`).join("\n\n")
         : `Tidak ditemukan teks \`${searchMatch[1]}\`.`;
      await sendDeveloperResult(m, sock, character, `Pencarian source: ${searchMatch[1]}`, text);
      return true;
   }

   const analyzeMatch = body.match(/^(?:jelaskan|analisis|review)\s+(?:file\s+)?(.+)$/i);
   if (analyzeMatch) {
      const candidates = findFiles(analyzeMatch[1]);
      if (!candidates.length) {
         await sendDeveloperResult(m, sock, character, "Analisis file", `File \`${analyzeMatch[1]}\` tidak ditemukan.`);
         return true;
      }
      const item = candidates[0];
      const extension = path.extname(item.file).toLowerCase();
      const stats = fs.statSync(item.file);
      const isText = TEXT_EXTENSIONS.has(extension);
      const content = isText && stats.size <= 120000 ? fs.readFileSync(item.file, "utf8") : "";
      const summary = [
         `File: ${item.relative}`,
         `Ukuran: ${formatBytes(stats.size)}`,
         `Baris: ${content ? content.split("\n").length : "tidak dihitung (binary/file besar)"}`,
         `MIME: ${getMimeType(extension)}`,
         `Tipe: ${isText ? "teks" : "binary/media"}`
      ].join("\n");
      if (isText && content) {
         const explanation = await requestFileExplanation(
            character,
            item.relative,
            content,
            `${formatBytes(stats.size)}, ${content.split("\n").length} baris, ${getMimeType(extension)}`
         );
         await sendDeveloperResult(
            m,
            sock,
            character,
            "Penjelasan file",
            `${summary}\n\n${explanation || "AI tidak menghasilkan penjelasan untuk file ini."}`
         );
      } else {
         await sendDeveloperResult(m, sock, character, "Info file", `${summary}\n\n${await inspectMedia(item.file)}`);
      }
      return true;
   }

   const mediaMatch = body.match(/^(?:info|informasi|metadata)\s+(?:file\s+)?(.+)$/i);
   if (mediaMatch) {
      const candidates = findFiles(mediaMatch[1]);
      if (!candidates.length) throw new Error(`File \`${mediaMatch[1]}\` tidak ditemukan.`);
      await sendDeveloperResult(m, sock, character, "Metadata file", await inspectMedia(candidates[0].file));
      return true;
   }

   const batchMatch = body.match(/^(?:kirim|ambil)\s+(?:semua\s+file\s+yang\s+berhubungan\s+dengan|file terkait)\s+(.+)$/i);
   if (batchMatch) {
      const results = searchSource(batchMatch[1]);
      const unique = [...new Map(results.map(item => [item.relative, item])).values()].slice(0, 10);
      await sendDeveloperResult(m, sock, character, "File terkait", unique.length ? unique.map(item => item.relative).join("\n") : "Tidak ada file terkait.");
      const files = unique.map(item => resolveProjectPath(item.relative));
      const archivePath = path.join(os.tmpdir(), `trina-related-${Date.now()}.zip`);
      try {
         await createRelatedZip(files, archivePath);
         await sock.sendMessage(m.chat, {
            document: fs.readFileSync(archivePath),
            fileName: "trina-related-files.zip",
            mimetype: "application/zip"
         }, { quoted: m });
      } finally {
         if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
      }
      return true;
   }

   return false;
};

const listFolder = directory => {
   const target = resolveProjectPath(directory || ".");
   if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
      throw new Error("Folder tidak ditemukan.");
   }
   const entries = fs.readdirSync(target, { withFileTypes: true })
      .sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name))
      .map((entry, index) => ({
         entry,
         line: `${index + 1}. ${entry.isDirectory() ? "📁" : "📄"} ${entry.name}`
      }));
   return {
      target,
      entries,
      text: entries.map(item => item.line).join("\n") || "Folder kosong."
   };
};

const sendSelectedFile = async (sock, chat, quoted, state, item) => {
   const extension = path.extname(item.file).toLowerCase();
   const stats = fs.statSync(item.file);
   const name = path.basename(item.file);
   const mime = getMimeType(extension);

   if (stats.size > 25 * 1024 * 1024) {
      await finishFileRich(state, `File \`${item.relative}\` terlalu besar untuk dikirim (${formatBytes(stats.size)}).`);
      return;
   }

   if (AUDIO_EXTENSIONS.has(extension)) {
      await finishFileRich(state, `Audio ditemukan: \`${item.relative}\`\nUkuran: ${formatBytes(stats.size)}\n\nMengirim audio...`);
      await sock.sendMessage(chat, {
         audio: fs.readFileSync(item.file),
         mimetype: mime,
         ptt: false
      }, { quoted });
      return;
   }

   if (IMAGE_EXTENSIONS.has(extension)) {
      await finishFileRich(state, `Gambar ditemukan: \`${item.relative}\`\nUkuran: ${formatBytes(stats.size)}\n\nMengirim gambar...`);
      await sock.sendMessage(chat, {
         image: fs.readFileSync(item.file),
         mimetype: mime,
         caption: name
      }, { quoted });
      return;
   }

   if (TEXT_EXTENSIONS.has(extension)) {
      const content = fs.readFileSync(item.file, "utf8");
      if (content.length <= 120000) {
         await finishFileRich(
            state,
            `File: \`${item.relative}\`\nUkuran: ${formatBytes(stats.size)}`,
            content,
            getCodeLanguage(extension)
         );
         return;
      }
   }

   await finishFileRich(state, `File ditemukan: \`${item.relative}\`\nUkuran: ${formatBytes(stats.size)}\n\nMengirim file asli...`);
   await sock.sendMessage(chat, {
      document: fs.readFileSync(item.file),
      fileName: name,
      mimetype: mime
   }, { quoted });
};

const handleFileAssistant = async (m, sock, character, request, body) => {
   const key = fileOperationKey(m);
   const pending = fileOperationMap.get(key);
   const activePending = pending && pending.expiresAt >= Date.now() ? pending : null;
   const state = await createFileRich(
      sock,
      m.chat,
      m,
      character,
      `${character === "atri" ? "Atri" : "Trina"} sedang memeriksa file...`,
      "thinking"
   );
   state.chat = m.chat;
   state.currentId = "thinking";

   if (pending && !activePending) {
      fileOperationMap.delete(key);
   }

   if (activePending?.type === "delete" && /^(yes|ya|y|no|tidak|n)$/i.test(body)) {
      fileOperationMap.delete(key);
      if (!/^(yes|ya|y)$/i.test(body.trim())) {
         await finishFileRich(state, "Penghapusan dibatalkan.");
         return true;
      }
      fs.unlinkSync(activePending.file);
      await finishFileRich(state, `File berhasil dihapus:\n\`${activePending.relative}\``);
      return true;
   }

   if (!request.isDelete) {
      try {
         state.naturalText = await requestFileConversation(
            character,
            body,
            request.isListFolder ? `Daftar isi ${request.query || "folder project"}` : `Permintaan file ${request.query}`
         );
      } catch (error) {
         console.error("Gagal membuat percakapan file Trina/Atri:", error.response?.data || error.message);
      }
   }

   if (activePending?.type === "selection") {
      const selectedNumber = Number.parseInt(body.trim(), 10);
      const selected = Number.isInteger(selectedNumber)
         ? activePending.candidates[selectedNumber - 1]
         : activePending.candidates.find(item =>
            item.relative.toLowerCase().includes(body.trim().toLowerCase())
         );
      if (selected) {
         fileOperationMap.delete(key);
         if (activePending.isDelete) {
            fileOperationMap.set(key, {
               type: "delete",
               file: selected.file,
               relative: selected.relative,
               expiresAt: Date.now() + FILE_OPERATION_TTL
            });
            await finishFileRich(state, `Konfirmasi penghapusan:\n\nFile: \`${selected.relative}\`\nUkuran: ${formatBytes(fs.statSync(selected.file).size)}\n\nBalas **yes** untuk menghapus atau **no** untuk membatalkan.`);
            return true;
         }
         await sendSelectedFile(sock, m.chat, m, state, selected);
         return true;
      }
   }

   const candidates = request.isListFolder
      ? []
      : findFiles(request.query);

   if (request.isListFolder) {
      const folderPath = request.query || ".";
      const folder = listFolder(folderPath);
      const folderCandidates = folder.entries
         .filter(({ entry }) => entry.isFile())
         .map(({ entry }) => {
            const file = path.join(folder.target, entry.name);
            return { file, relative: relativeProjectPath(file), score: 100 };
         });
      if (folderCandidates.length) {
         fileOperationMap.set(key, {
            type: "selection",
            candidates: folderCandidates,
            isDelete: request.isDelete,
            expiresAt: Date.now() + FILE_OPERATION_TTL
         });
      }
      await finishFileRich(state, `Isi folder \`${relativeProjectPath(folder.target)}\`:\n\n${folder.text}\n\nBalas dengan nama atau nomor file jika ingin melihat isinya.`);
      return true;
   }

   if (!candidates.length) {
      await finishFileRich(state, `File atau folder \`${request.query}\` tidak ditemukan.`);
      return true;
   }

   if (candidates.length > 1) {
      const choices = candidates.map((item, index) => `${index + 1}. \`${item.relative}\``).join("\n");
      fileOperationMap.set(key, {
         type: "selection",
         candidates,
         isDelete: request.isDelete,
         relative: request.query,
         expiresAt: Date.now() + FILE_OPERATION_TTL
      });
      await finishFileRich(state, `Aku menemukan beberapa hasil untuk \`${request.query}\`:\n\n${choices}\n\nBalas dengan nomor file yang ingin dipilih.`);
      return true;
   }

   const item = candidates[0];
   if (request.isDelete) {
      fileOperationMap.set(key, {
         type: "delete",
         file: item.file,
         relative: item.relative,
         expiresAt: Date.now() + FILE_OPERATION_TTL
      });
      await finishFileRich(state, `Konfirmasi penghapusan:\n\nFile: \`${item.relative}\`\nUkuran: ${formatBytes(fs.statSync(item.file).size)}\n\nBalas **yes** untuk menghapus atau **no** untuk membatalkan.`);
      return true;
   }

   await sendSelectedFile(sock, m.chat, m, state, item);
   return true;
};

const getConversationHistory = (chat) => sharedConversationMap.get(chat) || [];

const addConversationTurn = (chat, speaker, text) => {
   const content = String(text || "").trim();
   if (!chat || !content) return;

   const history = getConversationHistory(chat);
   history.push({ speaker, content });
   if (history.length > MAX_SHARED_CONVERSATION_TURNS) {
      history.splice(0, history.length - MAX_SHARED_CONVERSATION_TURNS);
   }
   sharedConversationMap.set(chat, history);
};

const formatConversationHistory = (chat) => {
   const history = getConversationHistory(chat);
   if (!history.length) return "";
   return history.map(turn => `${turn.speaker}: ${turn.content}`).join("\n");
};

const requestCharacterApi = async (
   character,
   chat,
   query,
   conversationContext = "",
   dialogueInstruction = "",
   imageParam = null
) => {
   const isAtri = character === "atri";
   const owner = Array.isArray(global.owner) ? global.owner[0] : global.owner;
   const ownerSessionId = String(owner || "owner").replace(/[^0-9]/g, "") || "owner";
   const params = {
      q: [
         conversationContext
            ? `${query}\n\nKonteks percakapan sebelumnya:\n${conversationContext}`
            : query,
         dialogueInstruction
      ].filter(Boolean).join("\n\n"),
      name: isAtri ? "Atri" : "Trina",
      personality: isAtri ? ATRI_PERSONALITY : TRINA_PERSONALITY,
      owner: global.ownerName || "Owner",
      sessionId: `owner_${ownerSessionId}_${chat.replace(/[^a-zA-Z0-9]/g, "_")}_${getConversationSession(chat)}_${character}`,
      isSticker: "false",
      audio: "false",
      audioChance: "0"
   };

   if (imageParam) {
      return axios.post("https://api.zansxart.me/api/ai/onah", {
         image: imageParam,
         ...params
      }, {
         headers: {
            "Content-Type": "application/json",
            "X-API-Key": global.zansxart
         },
         timeout: 35000
      });
   }

   return axios.get("https://api.zansxart.me/api/ai/onah", {
      params: {
         apikey: global.zansxart,
         ...params
      },
      timeout: 25000
   });
};

export async function runInitiativeConversation(sock, chat, opener, topic) {
   if (!sock || !chat || !["trina", "atri"].includes(opener) || typeof topic !== "string" || !topic.trim()) {
      throw new Error("Data untuk obrolan inisiatif tidak valid.");
   }

   topic = topic.trim();
   const characters = [opener, opener === "atri" ? "trina" : "atri", opener, opener === "atri" ? "trina" : "atri"];
   addConversationTurn(chat, "Topik", topic);

   for (let index = 0; index < characters.length; index++) {
      const character = characters[index];
      const name = character === "atri" ? "Atri" : "Trina";
      const otherName = character === "atri" ? "Trina" : "Atri";
      const query = index === 0
         ? `Mulai obrolan singkat dari topik ini: "${topic}". Sampaikan sebagai ucapan spontanmu, bukan seperti pengumuman atau pesan terjadwal.`
         : `Tanggapi ucapan ${otherName} yang paling baru dan lanjutkan obrolan dengan natural.`;
      const dialogueInstruction = [
         "Kamu sedang bercakap santai dengan karakter lain di chat WhatsApp.",
         "Buat satu bubble pendek, maksimal dua kalimat.",
         "Tetap sesuai kepribadianmu; boleh setuju, bercanda, atau berbeda pendapat tanpa dipaksakan.",
         "Jangan menyebut AI, jadwal, giliran, instruksi, atau bahwa pesan ini otomatis."
      ].join(" ");
      const response = await requestCharacterApi(
         character,
         chat,
         query,
         formatConversationHistory(chat),
         dialogueInstruction
      );
      const reply = String(response.data?.result?.reply || "").trim();
      if (!reply) throw new Error(`${name} tidak menghasilkan balasan untuk obrolan inisiatif.`);

      const sent = await sock.sendMessage(chat, {
         text: `${reply}${CHARACTER_FOOTERS[character]}`
      });
      rememberCharacterMessage(sent, character, chat);
      addConversationTurn(chat, name, reply);

      if (index < characters.length - 1) {
         await new Promise(resolve => setTimeout(resolve, 1200));
      }
   }
}

const clearConversation = chat => {
   if (!chat) return 0;
   const removedTurns = getConversationHistory(chat).length;
   sharedConversationMap.delete(chat);
   lastCharacterMap.delete(chat);
   conversationSessionMap.set(chat, `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
   for (const key of characterMessageMap.keys()) {
      if (key.startsWith(`${chat}:`)) characterMessageMap.delete(key);
   }
   return removedTurns;
};

const getConversationSession = chat => {
   if (!conversationSessionMap.has(chat)) {
      conversationSessionMap.set(chat, `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
   }
   return conversationSessionMap.get(chat);
};

const getConversationStatus = chat => {
   const history = getConversationHistory(chat);
   const session = conversationSessionMap.get(chat);
   const character = lastCharacterMap.get(chat) || "trina";
   return [
      `Chat: ${chat}`,
      `Karakter terakhir: ${character === "atri" ? "Atri" : "Trina"}`,
      `Konteks tersimpan: ${history.length} turn`,
      `Sesi AI: ${session ? "aktif" : "belum dibuat"}`,
      "Isi percakapan: tidak ditampilkan"
   ].join("\n");
};

const DEVELOPER_HELP = [
   "Bantuan Developer Assistant",
   "",
   "Status dan konteks:",
   "• cmd status bot",
   "• cmd status percakapan",
   "",
   "Navigasi dan pencarian:",
   "• cmd tree [folder]",
   "• cmd cari [kata/fungsi]",
   "• cmd analisis [file]",
   "• cmd info file [nama file]",
   "",
   "Pemeriksaan project:",
   "• cmd cek config",
   "• cmd cek dependency",
   "• cmd import rusak",
   "• cmd cek logs",
   "• cmd diagnosis plugin [nama plugin]",
   "",
   "File terkait:",
   "• cmd kirim semua file yang berhubungan dengan [kata]",
   "",
   "Percakapan:",
   "• cmd hapus percakapan",
   "",
   "Semua fitur developer hanya dapat digunakan oleh owner dan tidak membaca Auth/node_modules."
].join("\n");

const rememberCharacterMessage = (message, character, chat) => {
   const id = message?.key?.id;
   if (!id || !chat) return;
   characterMessageMap.set(`${chat}:${id}`, character);
   while (characterMessageMap.size > MAX_CHARACTER_MESSAGE_MAP) {
      characterMessageMap.delete(characterMessageMap.keys().next().value);
   }
};

const getReplyCharacter = (m) => {
   const quotedId = m.quoted?.key?.id || m.quoted?.id;
   if (quotedId) {
      const remembered = characterMessageMap.get(`${m.chat}:${quotedId}`);
      if (remembered) return remembered;
   }

   const quotedText = String(m.quoted?.text || m.quoted?.caption || '');
   if (quotedText.includes(CHARACTER_FOOTERS.atri.trim())) return "atri";
   if (quotedText.includes(CHARACTER_FOOTERS.trina.trim())) return "trina";
   return null;
};

const USER_RESPONSES = [
   "Hai, Trina aktif kok! Ketik .menu untuk melihat fitur yang tersedia ya.",
   "Trina siap bantu! Ketik .menu dulu ya.",
   "Iya? Ada yang bisa dibantu? Ketik .menu untuk bantuan.",
   "Trina di sini. Gunakan perintah .menu untuk melihat daftar fitur."
];

export async function handleTriggerTrina(m, sock, isOwner = false) {
   try {
      if (!m) return false;
     if (
        m.key?.fromMe &&
        m.key.id &&
        characterMessageMap.has(`${m.chat}:${m.key.id}`)
     ) return true;

     // 1. Identifikasi pengirim & status owner
      const senderJid = m.sender || (m.key && m.key.participant) || m.chat;
      const ownerNumbers = Array.isArray(global.owner) ? global.owner : [global.owner];
const checkIsOwner = isOwner || m.key?.fromMe || ownerNumbers.some(no => {
const cleanNo = String(no).replace(/[^0-9]/g, '');
return senderJid.includes(cleanNo);
});

const targetMessage = m.quoted ? m.quoted : m;
      const mtype = targetMessage.mtype || targetMessage.mediaType || '';
      const mime = (targetMessage.msg || targetMessage.message?.imageMessage || targetMessage).mimetype || '';
      
      const isSticker = mtype === 'stickerMessage' || /webp/g.test(mime);
      const isImage = (mtype === 'imageMessage' || /image/g.test(mime)) && !isSticker;

      if (isSticker) return false;

      let body = (
         m.text || 
         m.caption || 
         m.message?.conversation || 
         m.message?.extendedTextMessage?.text || 
         m.message?.imageMessage?.caption ||
         m.msg?.text ||
         m.msg?.caption ||
         ""
      ).trim();

let voiceProgress = null;
const audioMime = String((targetMessage.msg || targetMessage.message?.audioMessage || targetMessage).mimetype || mime);
const isAudio = mtype === "audioMessage" || /audio\//i.test(audioMime);
const isVoiceConversation = isAudio && checkIsOwner;
if (isAudio) {
   if (!checkIsOwner) return false;
   try {
      const progressRich = new AIRich(sock)
         .setTitle("Trina AI")
         .addText("🎙️ Trina sedang mendengarkan...", { id: "voice-status" });
      const progressMessage = await progressRich.send(m.chat, { quoted: m });
      voiceProgress = {
         rich: progressRich,
         messageId: progressMessage.key.id
      };
      body = await transcribeVoiceCommand(targetMessage);
      voiceProgress.rich.delete("voice-status");
      voiceProgress.rich.addText("💭 Trina sedang menyiapkan jawaban...", { id: "voice-thinking" });
      await voiceProgress.rich.sendEdit(m.chat, voiceProgress.messageId);
   } catch (error) {
      console.error("[TRINA VOICE] Gagal transkripsi:", error);
      if (voiceProgress) {
         voiceProgress.rich.delete("voice-status");
         voiceProgress.rich.addText(`Gagal memproses voice: ${error.message}`, { id: "voice-error" });
         await voiceProgress.rich.sendEdit(m.chat, voiceProgress.messageId);
      } else {
         await sock.sendMessage(m.chat, { text: `Gagal memproses voice: ${error.message}` }, { quoted: m });
      }
      return true;
   }
}

      const lowerBody = body.toLowerCase();
      const cleanText = lowerBody.replace(/[^a-z0-9\s]/g, '').trim();
      const words = cleanText.length > 0 ? cleanText.split(/\s+/) : [];
      
const allowedKeywords = ["trina", "atri", "p", "kalian", "klian"];
const isMentionOrKeyword = words.some(word => allowedKeywords.includes(word));

const hasGambarKeyword = words.includes("gambar");
const isSingingRequest = checkIsOwner && words.includes("nyanyi");

      const botIds = [
         sock.user?.id,
         sock.user?.jid,
         sock.user?.lid,
         sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
      ].filter(Boolean);
      const quotedIds = [
         m.quoted?.sender,
         m.quoted?.key?.participant,
         m.quoted?.key?.remoteJid
      ].filter(Boolean);

      const isReplyToBot = Boolean(
         m.quoted?.fromMe ||
         m.quoted?.key?.fromMe ||
         (m.quoted && quotedIds.some(quotedId => botIds.some(botId => {
            try {
               return areJidsSameUser(quotedId, botId);
            } catch {
               return quotedId === botId;
            }
         })))
      );

      const replyCharacter = isReplyToBot ? getReplyCharacter(m) : null;
      const requestedCharacters = replyCharacter
         ? [replyCharacter]
         : words.includes("kalian") || words.includes("klian") ||
           (words.includes("atri") && words.includes("trina"))
            ? ["trina", "atri"]
            : words.includes("atri")
               ? ["atri"]
               : ["trina"];
      const explicitCharacter = words.includes("atri") ? "atri" : words.includes("trina") ? "trina" : null;
      if (explicitCharacter) lastCharacterMap.set(m.chat, explicitCharacter);
      else if (replyCharacter) lastCharacterMap.set(m.chat, replyCharacter);

      // ===================================================
      // KONDISI 1: ATURAN USER BIASA (NON-OWNER)
      // ===================================================
      if (!checkIsOwner) {
         if (isMentionOrKeyword) {
            const randomReply = USER_RESPONSES[Math.floor(Math.random() * USER_RESPONSES.length)];
            await sock.sendMessage(m.chat, { text: randomReply }, { quoted: m });
            return true;
         }
         return false;
      }

const fileRequestPattern = /\b(ambil|kirim|download|unduh|baca|lihat|cek|check|tampilkan|tunjukkan|hapus|delete|buang|list)\b\s+[\w./\\-]+(?:\s+[\w./\\-]+)*\s*$/i;
const isLsRequest = /^\s*(?:ls|dir)\b/i.test(body);
const pendingFileOperation = fileOperationMap.get(fileOperationKey(m));
const isFileConfirmation = pendingFileOperation &&
/^(yes|ya|y|no|tidak|n|\d+)$/i.test(body.trim());
const commandMatch = body.match(/^cmd\s+(.+)$/i);
const developerBody = commandMatch ? commandMatch[1].trim() : "";
const isDeleteFileRequest = Boolean(commandMatch) &&
   /^(?:hapus|hapuskan|delete|buang)\s+[\w./\\-]+(?:\s+[\w./\\-]+)*\s*$/i.test(developerBody);
const isFileRequest = fileRequestPattern.test(body) || isLsRequest || isFileConfirmation;
const isConversationClearRequest = commandMatch && /^(?:hapus|hapuskan|bersihkan|reset|clear)\s+(?:riwayat\s+)?(?:percakapan|conversation|chat)\s*$/i.test(developerBody);
if (isConversationClearRequest) {
   const removedTurns = clearConversation(m.chat);
   fileOperationMap.delete(fileOperationKey(m));
   await sock.sendMessage(m.chat, {
      text: removedTurns
         ? `Riwayat percakapan Trina/Atri sudah dihapus. ${removedTurns} konteks lokal dan sesi AI dibersihkan, kita mulai dari awal lagi.`
         : "Riwayat percakapan Trina/Atri sudah kosong. Sesi AI tetap di-reset agar tidak memakai konteks lama."
   }, { quoted: m });
   return true;
}
const isDeveloperRequest = Boolean(commandMatch);
if (isDeveloperRequest) {
   if (voiceProgress) {
      voiceProgress.rich.delete("voice-thinking");
      voiceProgress.rich.addText("⚙️ Menjalankan command...", { id: "voice-command" });
      await voiceProgress.rich.sendEdit(m.chat, voiceProgress.messageId);
   }
   const handled = await handleDeveloperAssistant(
      { ...m, body },
      sock,
      explicitCharacter || lastCharacterMap.get(m.chat) || "trina",
      developerBody
   );
   if (handled) return true;
   if (isDeleteFileRequest) {
      const fileRequest = parseFileRequest(developerBody);
      if (fileRequest) {
         const character = explicitCharacter || lastCharacterMap.get(m.chat) || "trina";
         return await handleFileAssistant(
            { ...m, body: developerBody },
            sock,
            character,
            fileRequest,
            developerBody
         );
      }
   }
   await sock.sendMessage(m.chat, {
      text: `Command developer tidak dikenali: \`${developerBody}\`\nKetik \`cmd bantuan developer\` untuk melihat daftar command.`
   }, { quoted: m });
   return true;
}
if (isFileRequest && !isDeleteFileRequest) {
const fileRequest = parseFileRequest(body);
if (fileRequest || isFileConfirmation) {
   const character = explicitCharacter || lastCharacterMap.get(m.chat) || "trina";
   return await handleFileAssistant(
      { ...m, body },
      sock,
      character,
      fileRequest || { query: "", isDelete: false, isFolder: false, isListFolder: false },
      body
   );
}
}

// ===================================================
      // KONDISI 2: ATURAN KHUSUS OWNER
      // ===================================================
      if (isImage && !hasGambarKeyword) {
         return false;
      }

      if (!isImage && !isSingingRequest && !isMentionOrKeyword && !isReplyToBot && !isVoiceConversation) {
         return false;
      }

      await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

      const baseQueryText = isSingingRequest
         ? `Nyanyikan jawaban atau lirik sesuai permintaan ini sebagai lagu pendek dengan melodi, jangan hanya dibacakan: ${body}`
         : body || "Apa pendapatmu tentang gambar ini?";
      const quotedConversation = isReplyToBot
         ? String(m.quoted?.text || m.quoted?.caption || "").trim()
         : "";
      const queryWithReplyContext = quotedConversation
         ? `${baseQueryText}\n\nPesan yang sedang dibalas owner:\n${quotedConversation}`
         : baseQueryText;
      addConversationTurn(m.chat, "Owner", baseQueryText);

      let imageParam = null;
      if (isImage) {
         try {
            const msgToDownload = {
               key: targetMessage.key,
               message: targetMessage.message || { [targetMessage.mtype || 'imageMessage']: targetMessage.msg || targetMessage }
            };

            const imgBuffer = await downloadMediaMessage(
               msgToDownload,
               'buffer',
               {},
               { reuploadRequest: sock.updateMediaMessage }
            );

            if (imgBuffer) {
               try {
                  const uploadedUrl = await UploadFileUgu(imgBuffer);
                  if (uploadedUrl && typeof uploadedUrl === 'string') {
                     imageParam = uploadedUrl.trim();
                  }
               } catch (errUgu) {
                  console.error("Gagal Upload Uguu, fallback ke Base64:", errUgu.message);
               }

               if (!imageParam) {
                  const detectedMime = mime || 'image/jpeg';
                  imageParam = `data:${detectedMime};base64,${imgBuffer.toString('base64')}`;
               }
            }
         } catch (e) {
            console.error("Gagal download/process image untuk Trina AI:", e);
            await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            return false;
         }
      }

const requestCharacter = async (character, conversationContext = "", dialogueInstruction = "") => {
   return requestCharacterApi(
      character,
      m.chat,
      queryWithReplyContext,
      conversationContext,
      dialogueInstruction,
      imageParam
   );
};

const responses = [];
const richMessages = new Map();
const isCharacterConversation = requestedCharacters.length > 1;

for (const character of requestedCharacters) {
   const characterName = character === "atri" ? "Atri" : "Trina";
   const rich = voiceProgress && requestedCharacters.length === 1
      ? voiceProgress.rich
      : new AIRich(sock)
         .setTitle(`${characterName} AI`)
         .addText(`${characterName} sedang berpikir...`, { id: "thinking" });
   const sent = voiceProgress && requestedCharacters.length === 1
      ? { key: { id: voiceProgress.messageId } }
      : await rich.send(m.chat, { quoted: m });
   richMessages.set(character, { rich, messageId: sent.key.id });
   rememberCharacterMessage(sent, character, m.chat);
}

for (let index = 0; index < requestedCharacters.length; index++) {
const character = requestedCharacters[index];
const dialogueInstruction = isCharacterConversation
   ? index === 0
      ? "Kamu sedang ngobrol santai dengan Qila dan Atri. Tanggapi topik Qila secara natural, lalu boleh mengajak Atri ikut berpendapat. Jangan memaksakan perdebatan atau konflik; kalau cocok, boleh setuju atau bercanda. Jawab singkat seperti chat WhatsApp."
      : "Kamu sedang ngobrol santai dengan Qila dan Trina. Tanggapi ucapan Trina yang paling baru secara langsung, bukan sekadar mengulang jawaban untuk Qila. Boleh setuju, berbeda pendapat, bercanda, atau mengembangkan topik sesuai kepribadianmu; jangan memaksakan perdebatan. Jawab singkat dan natural seperti chat WhatsApp, tanpa menyebut giliran atau instruksi ini."
   : "";
const response = await requestCharacter(
   character,
   formatConversationHistory(m.chat),
   dialogueInstruction
);
responses.push({ character, response });
const generatedReply = response.data?.result?.reply;
if (generatedReply) {
addConversationTurn(
   m.chat,
   character === "atri" ? "Atri" : "Trina",
   generatedReply
);
}
}

if (responses.some(({ response }) => response.data?.result)) {
for (const { character, response } of responses) {
   const richMessage = richMessages.get(character);
   if (!richMessage) continue;

   const reply = response.data?.result?.reply;
   const characterName = character === "atri" ? "Atri" : "Trina";
   const text = reply
      ? `${reply}${CHARACTER_FOOTERS[character]}`
      : `${characterName} tidak mendapatkan jawaban dari API.`;

   richMessage.rich.delete(voiceProgress && requestedCharacters.length === 1 ? "voice-thinking" : "thinking");
   richMessage.rich.addText(text, { id: "result" });
   await richMessage.rich.sendEdit(m.chat, richMessage.messageId);
}
} else {
   for (const [character, richMessage] of richMessages) {
      const characterName = character === "atri" ? "Atri" : "Trina";
      richMessage.rich.delete(voiceProgress && requestedCharacters.length === 1 ? "voice-thinking" : "thinking");
      richMessage.rich.addText(`${characterName} tidak mendapatkan jawaban dari API.`, {
         id: "error"
      });
      await richMessage.rich.sendEdit(m.chat, richMessage.messageId);
   }
}

await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
return true;

   } catch (err) {
      console.error("Error TriggerTrina API:", err.response?.data || err.message);
      await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return false;
   }
}