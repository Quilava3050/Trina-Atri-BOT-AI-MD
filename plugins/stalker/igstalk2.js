import axios from "axios";
import { AIRich } from "../../control/MessageBuilderV4.7.js";

const handler = async (m, { sock, text, usedPrefix, command, reply }) => {
  const username = String(text || "").trim().replace(/^@/, "").toLowerCase();

  if (!username) {
    return reply(`Masukkan username Instagram.\nContoh: ${usedPrefix}${command} dhiekaaquila`);
  }

  if (!/^[a-z0-9._]{1,30}$/.test(username)) {
    return reply("Username Instagram hanya boleh berisi huruf, angka, titik, dan garis bawah (maksimal 30 karakter).");
  }

  try {
    await sock.sendMessage(m.chat, { react: { text: "🔎", key: m.key } });

    const { data } = await axios.get("https://api.botcahx.eu.org/api/stalk/ig", {
      params: {
        apikey: global.btc || "umaasa",
        username
      },
      timeout: 20000
    });

    const profile = data?.result;
    if (!data?.status || !profile) {
      await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return reply("Profil tidak ditemukan atau layanan Instagram sedang bermasalah.");
    }

    const profileUsername = String(profile.username || username).replace(/^@/, "");
    const avatar = profile.photoUrlHd || profile.photoUrl;
    const profileUrl = `https://www.instagram.com/${encodeURIComponent(profileUsername)}/`;
    const rich = new AIRich(sock);

    rich.addSection({
      view_model: {
        primitive: {
          title: profile.fullName || `@${profileUsername}`,
          subtitle: `@${profileUsername}`,
          secondary_subtitle: profile.isPrivate ? "Akun privat" : "Instagram",
          image: typeof avatar === "string" && /^https?:\/\//i.test(avatar) ? avatar : undefined,
          entity_id: profileUsername,
          entity_url: profileUrl,
          entity_type: "IG_PROFILE",
          action_type: "OPEN_URL",
          is_verified: Boolean(profile.isVerified),
          __typename: "GenAICompactEntityPrimitive"
        },
        __typename: "GenAISingleLayoutViewModel"
      }
    });

    rich.addSection({
      view_model: {
        primitives: [
          { type: "HORIZONTAL_LINE", __typename: "GenAIDividerPrimitive" }
        ],
        __typename: "GenAIVStackLayoutViewModel"
      }
    });

    rich.addSection({
      view_model: {
        primitives: [
          { __typename: "GenAISpacerPrimitive" },
          {
            text: "# {{social_entity_1}}See results{{/social_entity_1}}",
            inline_entities: [
              {
                key: "social_entity_1",
                metadata: {
                  __typename: "GenAISocialEntityItem",
                  entity_id: profileUsername,
                  entity_name: profileUsername,
                  entity_full_name: profile.fullName || profileUsername,
                  entity_picture_url: avatar,
                  entity_url: profileUrl,
                  entity_type: "IG_PROFILE",
                  is_verified: Boolean(profile.isVerified)
                }
              }
            ],
            __typename: "GenAIMarkdownTextUXPrimitive"
          },
          { __typename: "GenAISpacerPrimitive" }
        ],
        __typename: "GenAIActionRowLayoutViewModel"
      }
    });

    await rich.send(m.chat, { quoted: m });
    await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
  } catch (error) {
    console.error("[IG STALK] Gagal mengambil profil:", error);
    await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return reply(`Gagal mengambil profil Instagram: ${error.response?.data?.message || error.message}`);
  }
};

handler.help = ["igstalk <username>"];
handler.tags = ["stalker"];
handler.command = ["igstalk2", "instagramstalk2", "stalkig2"];

export default handler;
