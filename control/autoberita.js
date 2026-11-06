import { db, getGroups, getSettings } from "./database.js";

const NEWS_API_URL = "https://api.botcahx.eu.org/api/news/detik";
const POLL_INTERVAL_MS = 15_000;
const SLOT_GRACE_MINUTES = 5;
const RECENT_ARTICLE_LIMIT = 24;

let running = false;
const recentSlots = new Set();
const articleCache = new Map();
const retryAfter = new Map();

function getJakartaTime() {
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

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: values.hour,
    minute: Number(values.minute),
    time: `${values.hour}:00`
  };
}

async function fetchNews() {
  if (!global.btc) throw new Error("API key global.btc belum dikonfigurasi.");
  const url = new URL(NEWS_API_URL);
  url.searchParams.set("apikey", global.btc);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000)
  });

  if (!response.ok) {
    throw new Error(`API berita merespons HTTP ${response.status}.`);
  }

  const result = await response.json();
  if (result?.status !== true || !Array.isArray(result.result)) {
    throw new Error("Format respons API berita Botcahx tidak sesuai atau daftar berita kosong.");
  }

  const validArticles = result.result.filter(article =>
    (article?.status === undefined || article.status === 200) &&
    typeof article?.berita === "string" &&
    typeof article?.berita_url === "string" &&
    /^https?:\/\//i.test(article.berita_url)
  );

  if (!validArticles.length) throw new Error("API tidak mengembalikan berita yang valid.");
  return validArticles;
}

function formatNews(article, date, time) {
  const published = article.berita_diupload?.trim();
  const publishedLine = published ? `\n🕒 ${published}` : "";
  return `📰 *BERITA HANGAT*\n📅 ${date} • ${time} WIB\n\n*${article.berita.trim()}*${publishedLine}\n${article.berita_url}\n\n_Sumber: detikcom_`;
}

async function getSentGroups(slotKey) {
  const settings = await getSettings();
  const sent = settings.autoNewsSentSlots?.[slotKey];
  return new Set(Array.isArray(sent) ? sent : []);
}

async function saveSentGroups(slotKey, sentGroups) {
  const settings = await getSettings();
  const sentSlots = { ...(settings.autoNewsSentSlots || {}) };
  sentSlots[slotKey] = [...sentGroups];

  const cutoffDate = new Date(`${slotKey.slice(0, 10)}T00:00:00Z`);
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 7);
  const oldestDate = cutoffDate.toISOString().slice(0, 10);
  for (const key of Object.keys(sentSlots)) {
    if (key.slice(0, 10) < oldestDate) delete sentSlots[key];
  }

  await db("settings", null, "autoNewsSentSlots", sentSlots);
}

async function getSelectedArticle(slotKey) {
  if (articleCache.has(slotKey)) return articleCache.get(slotKey);

  const settings = await getSettings();
  const savedArticle = settings.autoNewsArticles?.[slotKey];
  if (savedArticle?.berita_url) {
    articleCache.set(slotKey, savedArticle);
    return savedArticle;
  }

  const retryTime = retryAfter.get(slotKey) || 0;
  if (Date.now() < retryTime) return null;

  try {
    const articles = await fetchNews();
    const recentUrls = new Set(
      Array.isArray(settings.autoNewsRecentUrls) ? settings.autoNewsRecentUrls : []
    );
    const freshArticles = articles.filter(article => !recentUrls.has(article.berita_url));
    const candidates = freshArticles.length ? freshArticles : articles;
    const article = candidates[Math.floor(Math.random() * candidates.length)];

    articleCache.set(slotKey, article);
    retryAfter.delete(slotKey);

    const articleSlots = { ...(settings.autoNewsArticles || {}), [slotKey]: article };
    const cutoffDate = new Date(`${slotKey.slice(0, 10)}T00:00:00Z`);
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 7);
    const oldestDate = cutoffDate.toISOString().slice(0, 10);
    const oldSlots = Object.keys(articleSlots).filter(key => key.slice(0, 10) < oldestDate);
    for (const oldSlot of oldSlots) {
      delete articleSlots[oldSlot];
    }

    await db("settings", null, "autoNewsArticles", articleSlots);
    const updatedRecentUrls = [...new Set([...recentUrls, article.berita_url])].slice(-RECENT_ARTICLE_LIMIT);
    await db("settings", null, "autoNewsRecentUrls", updatedRecentUrls);
    return article;
  } catch (error) {
    retryAfter.set(slotKey, Date.now() + 30_000);
    throw error;
  }
}

async function markGroupSent(slotKey, groupId, sentGroups) {
  sentGroups.add(groupId);
  await saveSentGroups(slotKey, sentGroups);
}

async function sendForSlot(sock, slotKey, date, time, activeGroups) {
  const article = await getSelectedArticle(slotKey);
  if (!article) return false;

  const sentGroups = await getSentGroups(slotKey);
  const message = formatNews(article, date, time);

  for (const groupId of activeGroups) {
    if (sentGroups.has(groupId)) continue;
    try {
      await sock.sendMessage(groupId, { text: message });
      await markGroupSent(slotKey, groupId, sentGroups);
      console.log(`[AUTO BERITA] Berita ${slotKey} terkirim ke ${groupId}.`);
    } catch (error) {
      console.error(`[AUTO BERITA] Gagal mengirim ke ${groupId}:`, error?.message || error);
    }
  }

  return activeGroups.every(groupId => sentGroups.has(groupId));
}

export function startAutoBerita() {
  if (global.autoBeritaInterval) return;

  global.autoBeritaInterval = setInterval(async () => {
    if (running) return;
    const { date, hour, minute, time } = getJakartaTime();
    if (minute > SLOT_GRACE_MINUTES) return;

    const slotKey = `${date} ${hour}:00`;
    if (recentSlots.has(slotKey)) return;

    running = true;
    try {
      const groups = await getGroups();
      const activeGroups = Object.values(groups).filter(group =>
        group?.autoberita === 1 && typeof group.id === "string"
      ).map(group => group.id);

      if (!activeGroups.length) return;
      const sock = global.sock;
      if (!sock?.sendMessage) throw new Error("Koneksi WhatsApp belum siap.");
      const complete = await sendForSlot(sock, slotKey, date, time, activeGroups);
      if (complete) {
        recentSlots.add(slotKey);
        if (recentSlots.size > 16) recentSlots.delete(recentSlots.values().next().value);
      }
    } catch (error) {
      console.error("[AUTO BERITA] Gagal menjalankan jadwal:", error?.message || error);
    } finally {
      running = false;
    }
  }, POLL_INTERVAL_MS);
}
