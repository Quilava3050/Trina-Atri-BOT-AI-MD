import "../settings.js"
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Plugin Cache ─────────────────────────────────────────────────────────────
let _pluginCache = null;
let _pluginMap = new Map();
let _pluginMenuEntries = [];

export const loadPlugins = async (dir = path.join(process.cwd(), "plugins"), forceReload = false) => {
    if (_pluginCache && !forceReload) return _pluginCache;

    const plugins = [];

    if (!fs.existsSync(dir)) {
        console.warn(`[PLUGIN] Folder '${dir}' tidak ditemukan.`);
        _pluginCache = plugins;
        _pluginMap.clear();
        _pluginMenuEntries = [];
        return plugins;
    }

    const rootDir = path.resolve(dir);
    const menuEntries = [];
    _pluginMap.clear();

    const loadDirectory = async (currentDir) => {
        const files = fs.readdirSync(currentDir).sort((a, b) => a.localeCompare(b));
        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                await loadDirectory(filePath);
                continue;
            }
            if (!filePath.endsWith(".js")) continue;

            try {
                const pluginUrl = `${pathToFileURL(filePath).href}?update=${Date.now()}`;
                const pluginModule = await import(pluginUrl);
                const plugin = pluginModule.default || pluginModule;

                if (typeof plugin === "function" && Array.isArray(plugin.command)) {
                    const commands = [...new Set(plugin.command
                        .filter(cmd => typeof cmd === "string")
                        .map(cmd => cmd.trim().toLowerCase())
                        .filter(Boolean))];
                    if (!commands.length) {
                        console.warn(`[PLUGIN] '${filePath}' tidak memiliki command yang valid.`);
                        continue;
                    }

                    plugins.push(plugin);
                    for (const cmd of commands) {
                        _pluginMap.set(cmd, plugin);
                    }

                    const relativeDir = path.relative(rootDir, path.dirname(filePath));
                    const category = relativeDir.split(path.sep)[0] || "other";
                    menuEntries.push({ category, commands });
                } else {
                    console.warn(`[PLUGIN] '${filePath}' tidak valid\n\nPastikan format plugins sesuai/valid!`);
                }
            } catch (err) {
                console.error(`[PLUGIN] Gagal memuat '${filePath}':`, err.message);
            }
        }
    };

    await loadDirectory(rootDir);
    _pluginMenuEntries = menuEntries;
    _pluginCache = plugins;
    return plugins;
};

export const reloadPlugins = async () => {
    _pluginCache = null;
    _pluginMap.clear();
    return await loadPlugins(path.join(process.cwd(), "plugins"), true);
};

export const hasPluginCommand = async (command) => {
    if (typeof command !== "string" || command.length === 0) return false;
    if (!_pluginCache) await loadPlugins();
    return _pluginMap.has(command.toLowerCase());
};

export const getPluginMenuEntries = (category) => {
    const normalizedCategory = typeof category === "string" ? category.toLowerCase() : null;
    return _pluginMenuEntries
        .filter(entry => !normalizedCategory || entry.category.toLowerCase() === normalizedCategory)
        .map(entry => ({ category: entry.category, commands: [...entry.commands] }));
};

// ─── Auto Watcher ─────────────────────────────────────────────────────────────
// Monitor semua subfolder di /plugins, auto reload kalau ada file berubah/ditambah
const watchedDirs = new Set();

const watchDir = (dir) => {
    if (watchedDirs.has(dir)) return;
    if (!fs.existsSync(dir)) return;

    watchedDirs.add(dir);

    fs.watch(dir, { persistent: true }, async (eventType, filename) => {
        if (!filename || !filename.endsWith(".js")) return;
        clearTimeout(watchDir._debounce);
        watchDir._debounce = setTimeout(async () => {
            console.log(`[PLUGIN] 🔄 ${filename} changed, reloading...`);
            try {
                await reloadPlugins();
                watchAllDirs(path.join(process.cwd(), "plugins"));
                console.log(`[PLUGIN] ✅ Reload selesai.`);
            } catch (err) {
                console.error(`[PLUGIN] ❌ Gagal reload:`, err.message);
            }
        }, 500);
    });
    // ← hapus console.log watching di sini
};

const watchAllDirs = (baseDir) => {
    if (!fs.existsSync(baseDir)) return;

    // Watch root plugins folder
    watchDir(baseDir);

    // Watch semua subfolder
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            watchDir(path.join(baseDir, entry.name));
        }
    }
};

// Mulai watching saat module di-import
export const startWatcher = () => {
    watchAllDirs(path.join(process.cwd(), "plugins"));
};

// ─── Permission Guard ─────────────────────────────────────────────────────────
const react = (sock, m, emoji) => {
    return sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
};

const checkPermission = (plugin, m, Obj) => {
    const {
        isOwner, isAdmin, isBotAdmin,
        isBan
    } = Obj;

    if (plugin.isBan !== false && isBan) {
        react(Obj.sock, m, "⚠️");
        return false;
    }

    if (plugin.owner && !isOwner) {
        m.reply(mess.owner);
        return false;
    }

    if (plugin.group && !m.isGroup) {
        m.reply(mess.group);
        return false;
    }

    if (plugin.private && m.isGroup) {
        m.reply(mess.private);
        return false;
    }

    if (plugin.admin && m.isGroup && !isAdmin && !isOwner) {
        m.reply(mess.admin);
        return false;
    }

    if (plugin.botadmin && !isBotAdmin) {
        m.reply(mess.botAdmin);
        return false;
    }

    return true;
};

// ─── Handle Message ───────────────────────────────────────────────────────────
export const handleMessage = async (m, sock, commandText, Obj) => {
    if (typeof commandText !== 'string' || commandText.length === 0) return;

    if (!_pluginCache) await loadPlugins();

    const plugin = _pluginMap.get(commandText.toLowerCase());

    if (plugin) {
        try {
            const { usedPrefix: contextPrefix, prefix: legacyPrefix, ...restOfObj } = Obj;
            const usedPrefix = contextPrefix ?? legacyPrefix ?? global.prefix ?? '';
            const pluginData = { ...restOfObj, sock, conn: sock, usedPrefix, prefix: usedPrefix };

            const allowed = checkPermission(plugin, m, pluginData);
            if (!allowed) return;

            await plugin(m, pluginData);
        } catch (err) {
            console.error(`[PLUGIN] Error saat menjalankan '${commandText}':`, err);
        }
    }
};

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getPluginStats = () => {
    const baseDir = path.join(process.cwd(), "plugins");
    if (!fs.existsSync(baseDir)) return { totalCategory: 0, totalFiles: 0, data: [] };

    const folders = fs.readdirSync(baseDir).filter(f => {
        const fullPath = path.join(baseDir, f);
        return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
    });

    const result = [];
    let totalFiles = 0;

    for (const folder of folders) {
        try {
            const folderPath = path.join(baseDir, folder);
            const files = fs.readdirSync(folderPath).filter(f => f.match(/\.(js|mjs|cjs)$/));
            totalFiles += files.length;
            result.push({ category: folder, count: files.length });
        } catch (e) {
            console.error(`[PLUGIN] Gagal membaca folder ${folder}:`, e.message);
        }
    }

    result.sort((a, b) => a.category.localeCompare(b.category));
    return { totalCategory: folders.length, totalFiles, data: result };
};
