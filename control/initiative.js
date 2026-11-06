import { readFile } from "fs/promises";
import { db, getSettings } from "./database.js";
import { runInitiativeConversation } from "./TriggerTrina.js";

const TIME_ZONE = "Asia/Jakarta";
const TOPICS_FILE = new URL("./data/initiative-topics.json", import.meta.url);
const SCHEDULE_WINDOWS = [
   [10 * 60, 13 * 60],
   [14 * 60, 17 * 60],
   [18 * 60, 21 * 60]
];

let activeSocket = null;
let schedulerTimer = null;
let sessionInProgress = false;
let initiativeTopicsPromise = null;

const getInitiativeTopics = async () => {
   if (!initiativeTopicsPromise) {
      initiativeTopicsPromise = readFile(TOPICS_FILE, "utf8")
         .then(contents => {
            const categories = JSON.parse(contents);
            if (!categories || typeof categories !== "object" || Array.isArray(categories)) {
               throw new Error("Format bank topik harus berupa object kategori.");
            }
            const topics = Object.values(categories).flat();
            if (topics.length < 300 || topics.some(topic => typeof topic !== "string" || !topic.trim())) {
               throw new Error(`Bank topik tidak valid: ditemukan ${topics.length} topik; minimal 300 topik teks diperlukan.`);
            }
            return topics;
         })
         .catch(error => {
            initiativeTopicsPromise = null;
            throw error;
         });
   }
   return initiativeTopicsPromise;
};

const getWibTime = (date = new Date()) => {
   const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
   }).formatToParts(date);
   const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
   return {
      date: `${values.year}-${values.month}-${values.day}`,
      minute: Number(values.hour) * 60 + Number(values.minute)
   };
};

const getConfig = async () => {
   const settings = await getSettings();
   const saved = settings.initiative;
   if (saved && typeof saved !== "object") {
      console.error("[INITIATIVE] Pengaturan tersimpan tidak valid; memakai nilai default.");
   }
   return {
      privateEnabled: false,
      privateJid: "",
      groupsEnabled: false,
      groups: [],
      opener: "random",
      targetCursor: 0,
      schedule: { date: "", slots: [], handled: [] },
      ...(saved && typeof saved === "object" ? saved : {}),
      groups: Array.isArray(saved?.groups) ? saved.groups : [],
      schedule: saved?.schedule && typeof saved.schedule === "object"
         ? {
            date: String(saved.schedule.date || ""),
            slots: Array.isArray(saved.schedule.slots)
               ? saved.schedule.slots.filter(value => Number.isInteger(value) && value >= 0 && value < 24 * 60)
               : [],
            handled: Array.isArray(saved.schedule.handled)
               ? saved.schedule.handled.filter(Number.isInteger)
               : []
         }
         : { date: "", slots: [], handled: [] }
   };
};

const saveConfig = async config => {
   await db("settings", "bot", "initiative", config);
};

const createDailySchedule = date => ({
   date,
   slots: SCHEDULE_WINDOWS.map(([start, end]) =>
      Math.floor(Math.random() * (end - start + 1)) + start
   ).sort((a, b) => a - b),
   handled: []
});

const getActiveChats = config => [
   ...(config.privateEnabled && config.privateJid ? [config.privateJid] : []),
   ...(config.groupsEnabled ? config.groups : [])
];

const runScheduledSession = async (sock, chat, opener, topic) => {
   try {
      await runInitiativeConversation(sock, chat, opener, topic);
   } catch (error) {
      console.error(`[INITIATIVE] Gagal memulai obrolan di ${chat}:`, error);
   } finally {
      sessionInProgress = false;
   }
};

const tick = async () => {
   if (!activeSocket || sessionInProgress || !global.triggerTrinaEnabled) return;

   try {
      const config = await getConfig();
      const activeChats = getActiveChats(config);
      if (!activeChats.length) return;

      const { date, minute } = getWibTime();
      if (config.schedule.date !== date) {
         config.schedule = createDailySchedule(date);
         await saveConfig(config);
      }

      for (let index = 0; index < config.schedule.slots.length; index++) {
         if (config.schedule.handled.includes(index)) continue;
         const scheduledMinute = config.schedule.slots[index];

         if (minute > scheduledMinute) {
            config.schedule.handled.push(index);
            await saveConfig(config);
            continue;
         }
         if (minute !== scheduledMinute) continue;

         const topics = await getInitiativeTopics();
         const topic = topics[Math.floor(Math.random() * topics.length)];
         config.schedule.handled.push(index);
         const targetIndex = config.targetCursor % activeChats.length;
         const chat = activeChats[targetIndex];
         config.targetCursor = (targetIndex + 1) % activeChats.length;
         await saveConfig(config);

         const opener = ["trina", "atri"].includes(config.opener)
            ? config.opener
            : Math.random() < 0.5 ? "trina" : "atri";
         sessionInProgress = true;
         void runScheduledSession(activeSocket, chat, opener, topic);
         return;
      }
   } catch (error) {
      console.error("[INITIATIVE] Gagal memeriksa jadwal:", error);
   }
};

export const startInitiativeScheduler = sock => {
   activeSocket = sock;
   if (schedulerTimer) return;
   void tick();
   schedulerTimer = setInterval(() => void tick(), 15_000);
};

export {
   getConfig as getInitiativeConfig,
   saveConfig as saveInitiativeConfig,
   getInitiativeTopics
};
