import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const dbPath  = path.join(dataDir, 'database.json');

// ─── In-memory cache ──────────────────────────────────────────────────────────
let cache = null;
let writeTimer = null;

const read = () => {
    if (cache) return cache;
    cache = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    return cache;
};

const write = (data) => {
    cache = data;
    clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }, 1000);
};

// ─── Graceful shutdown — pastikan data tersimpan sebelum proses berhenti ──────
const flushNow = () => {
    if (writeTimer && cache) {
        clearTimeout(writeTimer);
        fs.writeFileSync(dbPath, JSON.stringify(cache, null, 2));
    }
};
process.on('exit', flushNow);
process.on('SIGINT', () => { flushNow(); process.exit(0); });
process.on('SIGTERM', () => { flushNow(); process.exit(0); });

// ─── Default templates ────────────────────────────────────────────────────────
const defaultUser = (jid, name) => ({
    id: jid, name, banned: 0
});

const defaultGroup = (jid) => ({
    id: jid,
    welcome: 0, 
    goodbye: 0, 
    mute: 0, 
    muted_users: '[]',
    antilinkgc: 0,
    antichannel: 0, 
    antilinkch: 0, 
    antilinkall: 0,
    antipromosi: 0, 
    antisticker: 0, 
    antitoxic: 0, 
    antitagsw: 0,
    autosholat: 0, 
    autoberita: 0,
    antidelete: 0,
    antifoto: 0,
    welcome_text: '', 
    goodbye_text: '',
    afk_users: '{}',
    automotivasi: 0,
    automotivasiLastSent: ''
});

const defaultSettings = () => ({
    prefix: '.', 
    multiprefix: 1, 
    public: 1,
    triggerTrina: 1,
    autotyping: 0,
    autoread: 0, 
    readsw: 0,
    reactsw: 0,
    grupreact: 0,
    grupstickerreact: 0,
    pconly: 0, 
    gconly: 0, 
    anticall: 0,
    menuType: 4
});

// ─── Init ─────────────────────────────────────────────────────────────────────
const initDb = () => {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(dbPath)) {
        const initial = { users: {}, groups: {}, settings: defaultSettings() };
        fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
        cache = initial;
    } else {
        // load ke cache + merge settings yang kurang
        cache = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        if (!cache.settings) cache.settings = defaultSettings();
        else cache.settings = { ...defaultSettings(), ...cache.settings };
        if (!cache.users)  cache.users  = {};
        if (!cache.groups) cache.groups = {};
        fs.writeFileSync(dbPath, JSON.stringify(cache, null, 2));
    }
    return Promise.resolve();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getUser = (jid, name) => {
    const validJid = /^\d+@(s\.whatsapp\.net|lid)$/.test(jid);
    if (!validJid) return Promise.resolve(null);
    const data = read();
    // Tambahin ini biar dia nge-create/return datanya
    if (!data.users[jid]) {
        data.users[jid] = defaultUser(jid, name);
        write(data);
    }
    return Promise.resolve(data.users[jid]);
}

const getGroup = (jid) => {
    const data = read();
    if (!data.groups[jid]) {
        data.groups[jid] = defaultGroup(jid);
        write(data);
    }
    return Promise.resolve(data.groups[jid]);
};

const getGroups = () => Promise.resolve(read().groups);

const getSettings = () => {
    const data = read();
    return Promise.resolve(data.settings);
};

const getDatabaseCounts = () => {
    const data = read();
    return {
        users: Object.keys(data.users || {}).length,
        groups: Object.keys(data.groups || {}).length
    };
};

const clearUserGroupData = () => {
    const data = read();
    const counts = {
        users: Object.keys(data.users || {}).length,
        groups: Object.keys(data.groups || {}).length
    };
    const clearedData = {
        ...data,
        users: {},
        groups: {}
    };

    if (writeTimer) {
        clearTimeout(writeTimer);
        writeTimer = null;
    }

    fs.writeFileSync(dbPath, JSON.stringify(clearedData, null, 2));
    cache = clearedData;
    return counts;
};

const db = (table, id, column, value) => {
    if (!['users', 'groups', 'settings'].includes(table)) return Promise.reject('Invalid table');
    const data = read();
    if (table === 'settings') {
        data.settings[column] = value;
    } else {
        if (!data[table][id]) return Promise.reject(`ID ${id} not found in ${table}`);
        data[table][id][column] = value;
    }
    write(data);
    if (table === 'settings') {
        clearTimeout(writeTimer);
        writeTimer = null;
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return Promise.resolve(1);
};

const incrementData = (table, id, column, value) => {
    if (!['users', 'groups'].includes(table)) return Promise.reject('Invalid table');
    const data = read();
    if (!data[table][id]) return Promise.reject(`ID ${id} not found in ${table}`);
    data[table][id][column] = (data[table][id][column] || 0) + value;
    write(data);
    return Promise.resolve(1);
};

export { initDb, getUser, getGroup, getGroups, getSettings, getDatabaseCounts, clearUserGroupData, db, incrementData };
