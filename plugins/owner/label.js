const handler = async (m, { sock, text, usedPrefix, command }) => {

    if (!text) return m.reply(`Ex: ${usedPrefix+ command} txt nya`);

    const maxLength = 50; 

    if (text.length > maxLength) {
        return m.reply(`Terlaku panjang max 50 huruf`);
    }

    const label = text.slice(0, maxLength);

    try {
        await sock.relayMessage(
            m.chat,
            {
                protocolMessage: {
                    type: 30,
                    memberLabel: {
                        label
                    }
                }
            },
            {
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {
                            tag_reason: "user_update",
                            appdata: "member_tag"
                        },
                        content: undefined
                    }
                ]
            }
        );

        m.reply(`Succes!`);
    } catch (e) {
        console.error(e);
        m.reply("Gagal mengatur label.");
    }
};

handler.command = ["label", "lb"]
handler.owner = true

export default handler;