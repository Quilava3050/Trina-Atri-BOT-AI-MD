import moment from "moment-timezone";
import PhoneNumber from "awesome-phonenumber";

let regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const getName = async (jid, sock) => {
  try {
    const contact = sock.contacts?.[jid] || {};
    return (
      contact.notify ||
      contact.vname ||
      contact.name ||
      (await sock.onWhatsApp(jid))[0]?.jid.split("@")[0] ||
      jid.split("@")[0]
    );
  } catch {
    return jid.split("@")[0];
  }
};

const handler = async (m, { sock, text, command, usedPrefix }) => {

  let num = m.quoted?.sender || m.mentionedJid?.[0] || text;
  if (!num) return m.reply(`*Example:* ${usedPrefix + command} <nomornya>`);

  num = num.replace(/\D/g, "") + "@s.whatsapp.net";
  const [cek] = await sock.onWhatsApp(num);
  if (!cek?.exists)
    return m.reply("Nomor tersebut tidak terdaftar di WhatsApp.");

  const img = await sock
    .profilePictureUrl(num, "image")
    .catch(() => "https://telegra.ph/file/84c1a0f05d8fbc2c8b48d.jpg");
  const bio = await sock.fetchStatus(num).catch(() => {});
  const name = await getName(num, sock);
  const business = await sock.getBusinessProfile(num).catch(() => null);
  const format = PhoneNumber(`+${num.split("@")[0]}`);
  const regionCode = format.regionCode || "Unknown";
  const country = regionNames.of(regionCode) || "Unknown";

  let caption = `*WHATSAPP INFO :*\n
- 🌍 Country: ${country.toUpperCase()}
- 👤 Name: ${name || "-"}
- 📞 Number: ${format.number.international}
- 💬 Status: ${bio?.status || "-"}
- 📅 Date: ${bio?.setAt ? moment(bio.setAt).locale("id").format("LLL") : "-"}\n\n`;

  if (business) {
    caption += `*BUSINESS INFO :*\n
- 🆔 Business ID: ${business.wid}
- 🌐 Website: ${business.website || "-"}
- 📧 Email: ${business.email || "-"}
- 🏷️ Category: ${business.category || "-"}
- 📍 Address: ${business.address || "-"}
- ⏰ Timezone: ${business.business_hours?.timezone || "-"}
- 📝 Description: ${business.description || "-"}n`;
  } else {
    caption += "> _Original WhatsApp Account_";
  }

  await sock.sendMessage(
    m.chat,
    {
      image: { url: img },
      caption,
      mentions: [num],
    },
    { quoted: m }
  );
};

handler.command = ["wa", "wastalk"];
export default handler;