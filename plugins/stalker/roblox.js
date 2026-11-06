import axios from "axios";

const handler = async (m, { sock, text, reply, example }) => {

  if (!text) return reply(example("username nya mana??"));
  m.reply("Sabar . . .");

  try {
    // API BARU
    const apiUrl = `${global.api.free3}/stalker/roblox?username=${encodeURIComponent(text)}`;
    const res = await axios.get(apiUrl);

    if (!res.data?.status || !res.data?.result) {
      return reply(`Username *${text}* tidak ditemukan di Roblox.`);
    }

    const data = res.data.result;
    const basic = data.basic || {};
    const social = data.social || {};
    const presence = data.presence?.userPresences?.[0] || {};

    const headshot =
      data.avatar?.headshot?.data?.[0]?.imageUrl || null;
    const fullBody =
      data.avatar?.fullBody?.data?.[0]?.imageUrl || null;

    const created = basic.created
      ? new Date(basic.created).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })
      : "-";

    let teks = `*Roblox Profile Stalker 🎮*\n\n`;
    teks += `- 👤 *Username:* ${basic.name || "-"}\n`;
    teks += `- 🪪 *Display Name:* ${basic.displayName || "-"}\n`;
    teks += `- 🆔 *User ID:* ${data.userId || "-"}\n`;
    teks += `- 📝 *Description:* ${basic.description || "-"}\n`;
    teks += `- 📅 *Created:* ${created}\n`;
    teks += `- 🚫 *Banned:* ${basic.isBanned ? "Yes" : "No"}\n`;
    teks += `- ✅ *Verified:* ${basic.hasVerifiedBadge ? "Yes" : "No"}\n`;
    teks += `- 🌐 *Last Seen:* ${presence.lastLocation || "Unknown"}\n\n`;

    teks += `*Social Stats 👥*\n`;
    teks += `- Friends: ${social.friends?.count || 0}\n`;
    teks += `- Followers: ${social.followers?.count || 0}\n`;
    teks += `- Following: ${social.following?.count || 0}\n\n`;

    const groups = data.groups?.list?.data || [];
    if (groups.length > 0) {
      teks += `🏢 *Top Groups:*\n`;
      groups.slice(0, 3).forEach((g, i) => {
        teks += `${i + 1}. ${g.group.name} (${g.role.name})\n`;
      });
      teks += `\n📦 Total Groups: ${groups.length}`;
    }

    await sock.sendMessage(
      m.chat,
      {
        image: { url: fullBody || headshot },
        caption: teks.trim()
      },
      { quoted: m }
    );
  } catch (err) {
    console.error("Error Roblox:", err);
    reply("❌ Gagal mengambil data Roblox");
  }
};

handler.command = ["roblox", "rbx"];
export default handler;
