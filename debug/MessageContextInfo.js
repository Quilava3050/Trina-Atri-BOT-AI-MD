await sock.relayMessage(
  m.chat,
  {
  messageContextInfo: {
    threadId: [],
    botMetadata: {}
  },
  interactiveMessage: {
    header: {
      title: "tes"
    },
    body: {
      text: "tes"
    },
    footer: {
      text: "tes"
    },
    nativeFlowMessage: {
      buttons: [
        {
          name: "review_and_pay",
          buttonParamsJson: "{\"currency\":\"IDR\",\"payment_configuration\":\"\",\"payment_type\":\"upr\",\"transaction_id\":\"\",\"total_amount\":{\"value\":1900000000,\"offset\":100},\"reference_id\":\"PAY-1789283637\",\"type\":\"physical-goods\",\"payment_method\":\"\",\"order\":{\"status\":\"pending\",\"description\":\"tes\",\"subtotal\":{\"value\":1900000000,\"offset\":100},\"tax\":{\"value\":0,\"offset\":100},\"discount\":{\"value\":0,\"offset\":100},\"shipping\":{\"value\":0,\"offset\":100},\"order_type\":\"PAYMENT_REQUEST\",\"items\":[{\"name\":\"tes\",\"amount\":{\"value\":1900000000,\"offset\":100},\"quantity\":1}]},\"payment_settings\":[{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"SeaBank\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Jago\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Neo Commerce\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Aladin Syariah\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Digital BCA\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Superbank\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Jenius\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Allo Bank\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Krom Bank\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Central Asia\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Mandiri\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Rakyat Indonesia\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Negara Indonesia\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"CIMB Niaga\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Permata\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Danamon Indonesia\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"bank_account\",\"identifier_type\":\"id_account_number\",\"identifier_value\":\"08888\",\"institution_name\":\"Bank Maybank Indonesia\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"digital_wallet\",\"identifier_type\":\"phone_number\",\"identifier_value\":\"087873384161\",\"institution_name\":\"DANA\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"digital_wallet\",\"identifier_type\":\"phone_number\",\"identifier_value\":\"087873384161\",\"institution_name\":\"OVO\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"digital_wallet\",\"identifier_type\":\"phone_number\",\"identifier_value\":\"087873384161\",\"institution_name\":\"GoPay\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"digital_wallet\",\"identifier_type\":\"phone_number\",\"identifier_value\":\"087873384161\",\"institution_name\":\"ShopeePay\",\"beneficiary_name\":\"Malazzz njir\"}},{\"type\":\"payment_account\",\"payment_account\":{\"account_type\":\"digital_wallet\",\"identifier_type\":\"phone_number\",\"identifier_value\":\"087873384161\",\"institution_name\":\"LinkAja\",\"beneficiary_name\":\"Malazzz njir\"}}],\"additional_note\":\"tes\",\"native_payment_methods\":[],\"share_payment_status\":false,\"is_soft_deleted\":false}"
        }
      ]
    },
    key: {
      remoteJid: "120363029215797600@g.us",
      participant: "2074989355026@lid",
      fromMe: false,
      id: "3EB029970C15ASTARFALL08B79E0AA"
    },
    mtype: "interactiveMessage",
    chat: "120363029215797600@g.us",
    id: "3EB029970C15ASTARFALL08B79E0AA",
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
        remoteJid: "120363029215797600@g.us",
        fromMe: false,
        id: "3EB029970C15ASTARFALL08B79E0AA",
        participant: "2074989355026@lid"
      },
      message: {
        messageContextInfo: {
          threadId: [],
          botMetadata: {}
        },
        interactiveMessage: "[Circular]"
      },
      participant: "2074989355026@lid"
    },
    contextInfo: {
      participant: "43237519659240@lid",
      stanzaId: "AC25048DB497D16AA087EC29B9605C53",
      quotedMessage: {
        extendedTextMessage: {
          endCardTiles: [],
          text: ".crm",
          previewType: 0,
          inviteLinkGroupTypeV2: 0
        }
      }
    }
  }
},
  {}
)