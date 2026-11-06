import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "banned-chats.json");

const readBannedChats = () => {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const writeBannedChats = chats => {
  fs.writeFileSync(filePath, JSON.stringify([...new Set(chats)], null, 2));
};

export const isChatBanned = chatId => readBannedChats().includes(chatId);

export const banChat = chatId => {
  const chats = readBannedChats();
  if (!chats.includes(chatId)) chats.push(chatId);
  writeBannedChats(chats);
};

export const unbanChat = chatId => {
  writeBannedChats(readBannedChats().filter(id => id !== chatId));
};
