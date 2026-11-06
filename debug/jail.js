await sock.relayMessage(
  m.chat,
  {
  interactiveMessage: {
    body: {
      text: "hai"
    },
    nativeFlowMessage: {
      buttons: [
        {
          name: "quick_reply",
          buttonParamsJson: "{\"display_text\":\",menu\",\"id\":\"€ cat config.js\"}"
        }
      ],
      messageParamsJson: "{}"
    },
    key: {
      remoteJid: "120363346280940705@g.us",
      participant: "2074989355026@lid",
      fromMe: false,
      id: "3EB08453STARFALLFA1961DD7778B3"
    },
    mtype: "interactiveMessage",
    chat: "120363346280940705@g.us",
    id: "3EB08453STARFALLFA1961DD7778B3",
    from: "2074989355026@lid",
    isBaileys: true,
    sender: "2074989355026@lid",
    fromMe: false,
    text: "",
    mentionedJid: [],
    fakeObj: {
      messageStubParameters: [],
      labels: [],
      userReceipt: [],
      reactions: [],
      pollUpdates: [],
      eventResponses: [],
      statusMentions: [],
      messageAddOns: [],
      statusMentionSources: [],
      supportAiCitations: [],
      key: {
        remoteJid: "120363346280940705@g.us",
        fromMe: false,
        id: "3EB08453STARFALLFA1961DD7778B3",
        participant: "2074989355026@lid"
      },
      message: {
        interactiveMessage: "[Circular]"
      },
      participant: "2074989355026@lid"
    },
    contextInfo: {
      participant: "43237519659240@lid",
      stanzaId: "ACC9A122E1E6564C65D3361F6691BD52",
      quotedMessage: {
        extendedTextMessage: {
          endCardTiles: [],
          text: ".crm -snipp",
          previewType: 0,
          inviteLinkGroupTypeV2: 0
        }
      }
    }
  }
},
  {}
) 