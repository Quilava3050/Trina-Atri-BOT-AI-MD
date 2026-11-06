import { getPluginMenuEntries } from "../control/plugins.js";

const getPrefix = () => global.multiprefix ? `${global.prefix || "."}` : "";

const buildMenuForCategory = (category, prefix = getPrefix()) => {
  const entries = getPluginMenuEntries(category);
  if (!entries.length) return "";

  const displayedCommands = new Set();
  const lines = [];
  for (const entry of entries) {
    const commands = entry.commands.filter(command => {
      if (displayedCommands.has(command)) return false;
      displayedCommands.add(command);
      return true;
    });
    if (commands.length) {
      lines.push(`│ ° ${commands.map(command => `${prefix}${command}`).join(" / ")}`);
    }
  }

  if (!lines.length) return "";
  return `\`\`\`─── ${entries[0].category.toUpperCase()} MENU \`\`\`\n${lines.join("\n")}\n│\n`;
};

global.allmenu = () => {
  const entries = getPluginMenuEntries();
  const categories = [...new Set(entries.map(entry => entry.category))]
    .sort((a, b) => a.localeCompare(b));
  return categories
    .map(category => buildMenuForCategory(category))
    .filter(Boolean)
    .join("")
    .trim();
};

global.aimenu = () => buildMenuForCategory("aimenu");
global.download = () => buildMenuForCategory("downloader");
global.group = () => buildMenuForCategory("groups");
global.grup = global.group;
global.ownmenu = () => buildMenuForCategory("owner");
global.maker = () => buildMenuForCategory("maker");
global.asupan = () => buildMenuForCategory("asupan");
global.stalk = () => buildMenuForCategory("stalker");
global.search = () => buildMenuForCategory("search");
global.info = () => buildMenuForCategory("info");
global.islam = () => buildMenuForCategory("Islamic");
global.rpg = () => buildMenuForCategory("rpg");
global.fun = () => buildMenuForCategory("fun");
global.tools = () => buildMenuForCategory("tools");
global.setbot = () => buildMenuForCategory("setbot");
global.random = () => buildMenuForCategory("random");
