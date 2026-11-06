await sock.sendMessage(m.chat, {
  text: "🏷️ Just a label!",
  secureMetaServiceLabel: true
});

await reply("Pesan terkirim dengan secureMetaServiceLabel. Periksa tampilan pesan di WhatsApp.");
