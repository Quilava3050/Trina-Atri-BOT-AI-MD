const { generateWAMessageFromContent, proto } = await import('@whiskeysockets/baileys')

let jid = m.chat

let msg = generateWAMessageFromContent(jid, {
  interactiveMessage: proto.Message.InteractiveMessage.create({
    body: proto.Message.InteractiveMessage.Body.create({
      text: "Silakan selesaikan pembayaran berikut:"
    }),
    footer: proto.Message.InteractiveMessage.Footer.create({
      text: "ATRI-MD Payment System"
    }),
    header: proto.Message.InteractiveMessage.Header.create({
      title: "Rincian Pembayaran",
      hasMediaAttachment: false
    }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons: [
        {
          name: "review_and_pay",
          buttonParamsJson: JSON.stringify({
            currency: "IDR",
            payment_type: "upr",
            total_amount: {
              value: 0,
              offset: 100
            },
            reference_id: "4VXZSIAF6WP",
            type: "physical-goods",
            order: {
              status: "pending",
              order_type: "PAYMENT_REQUEST"
            },
            payment_settings: [
              {
                type: "payment_account",
                payment_account: {
                  account_type: "digital_wallet",
                  identifier_type: "phone_number",
                  identifier_value: "082113148932",
                  institution_name: "DANA",
                  beneficiary_name: "Dhieka Ananda Aquila"
                }
              }
            ],
            share_payment_status: false,
            is_soft_deleted: false
          })
        }
      ]
    })
  })
}, { userJid: sock.user.id, quoted: m })

await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
'Pesan berhasil terkirim!'