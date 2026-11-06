const jid = m.chat;
const conn = sock;

await sock.sendMessage(jid, {
    disappearingMessagesInChat: 60 // 60 seconds
})
 
// Using the WhatsApp query directly
await conn.query({
    tag: 'iq',
    attrs: {
        type: 'set',
        xmlns: 'w:g2',
        to: jid
    },
    content: [
        {
            tag: 'ephemeral',
            attrs: {
                expiration: '60', //60 seconds
                trigger: '1'
            }
        }
    ]
})
