import { readFile } from "node:fs/promises";
import { db, getGroups } from "./database.js";

const MOTIVATION_QUOTES_FILE = new URL("../data/motivasi.json", import.meta.url);

const POLL_INTERVAL_MS = 30_000;
const SLOT_GRACE_MINUTES = 5;

let activeSocket = null;
let schedulerTimer = null;
let running = false;
let quotesPromise = null;

const getMotivationalQuotes = async () => {
  if (!quotesPromise) {
    quotesPromise = readFile(MOTIVATION_QUOTES_FILE, "utf8")
      .then(contents => {
        const quotes = JSON.parse(contents);
        if (!Array.isArray(quotes) || !quotes.length || quotes.some(quote => typeof quote !== "string" || !quote.trim())) {
          throw new Error("Daftar motivasi harus berupa array berisi teks.");
        }
        return quotes;
      })
      .catch(error => {
        quotesPromise = null;
        throw error;
      });
  }
  return quotesPromise;
};

const getJakartaTime = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const hour = Number(values.hour);

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour,
    minute: Number(values.minute),
    slot: `${values.year}-${values.month}-${values.day}T${String(Math.floor(hour / 3) * 3).padStart(2, "0")}`
  };
};

const pickRandom = list => list[Math.floor(Math.random() * list.length)];

const tick = async () => {
  if (running || !activeSocket?.user || typeof activeSocket.sendMessage !== "function") return;

  const { minute, slot } = getJakartaTime();
  if (minute >= SLOT_GRACE_MINUTES) return;

  running = true;
  try {
    const quotes = await getMotivationalQuotes();
    const groups = await getGroups();
    const activeGroups = Object.values(groups).filter(group =>
      group?.automotivasi === 1 &&
      typeof group.id === "string" &&
      group.id.endsWith("@g.us") &&
      group.automotivasiLastSent !== slot
    );

    for (const group of activeGroups) {
      try {
        await activeSocket.sendMessage(group.id, {
          text: `🌱 *Motivasi*\n\n${pickRandom(quotes)}`
        });
        await db("groups", group.id, "automotivasiLastSent", slot);
        console.log(`[AUTO MOTIVASI] Motivasi terkirim ke ${group.id} untuk slot ${slot}.`);
      } catch (error) {
        console.error(`[AUTO MOTIVASI] Gagal mengirim ke ${group.id}:`, error?.message || error);
      }
    }
  } catch (error) {
    console.error("[AUTO MOTIVASI] Gagal memeriksa jadwal:", error?.message || error);
  } finally {
    running = false;
  }
};

export const startAutoMotivasi = sock => {
  activeSocket = sock;
  if (schedulerTimer) return;
  void tick();
  schedulerTimer = setInterval(() => void tick(), POLL_INTERVAL_MS);
};
