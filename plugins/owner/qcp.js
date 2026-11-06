import {
    generateWAMessageFromContent,
    getContentType
} from '@whiskeysockets/baileys';

const unwrapMessage = (message) => {
    if (!message || typeof message !== 'object') return null;

    for (const wrapper of ['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2']) {
        if (message[wrapper]?.message) return unwrapMessage(message[wrapper].message);
    }

    return message;
};

const getNestedQuoted = (message) => {
    const content = unwrapMessage(message);
    const quotedMessage = content?.contextInfo?.quotedMessage;
    if (!quotedMessage) return null;

    const nested = unwrapMessage(quotedMessage);
    const type = getContentType(nested);
    return type ? { [type]: nested[type] } : null;
};

const handler = async (m, { sock, reply }) => {
    if (!m.quoted) return reply('Reply pesan yang merupakan reply dari pesan lain.');

    const originalMessage = getNestedQuoted(m.quoted);
    if (!originalMessage) {
        return reply('Pesan yang kamu reply tidak menyimpan pesan reply di dalamnya.');
    }

    const forwarded = await generateWAMessageFromContent(m.chat, originalMessage, {
        userJid: sock.user?.id
    });

    await sock.relayMessage(m.chat, forwarded.message, {
        messageId: forwarded.key.id
    });
};

handler.command = ['qcp', 'qroot'];
handler.owner = true;

export default handler;