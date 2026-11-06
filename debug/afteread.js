await sock.relayMessage(
  m.chat,
  {
    extendedTextMessage: {
      text: "this message will disappear in 1 second.",
      previewType: 0,
      contextInfo: {
        expiration: 0,
        ephemeralSettingTimestamp: Date.now(),
        disappearingMode: {
          initiator: 0,
          trigger: 1
        },
        afterReadDuration: 1 //seconds
      },
      inviteLinkGroupTypeV2: 0
    }
  },
  {}
)

await reply("Pesan dikirim. Penghapusan setelah dibaca bergantung pada dukungan WhatsApp terhadap afterReadDuration.");