import { isJidBot, jidNormalizedUser } from '@whiskeysockets/baileys';

const baileysMessagePrefixes = ['3EB0', 'B1E', 'BAE', '3F8'];

const normalizeTarget = (value) => {
    const input = String(value || '').trim();
    if (!input) return '';

    if (input.includes('@')) {
        return jidNormalizedUser(input);
    }

    const digits = input.replace(/\D/g, '');
    if (!digits) return '';

    const phone = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
    return `${phone}@s.whatsapp.net`;
};

const getRawJid = (value) => {
    const input = String(value || '').trim();
    if (!input) return '';
    return input.includes('@') ? input : normalizeTarget(input);
};

const isKnownBaileysMessageId = (message) => {
    const id = String(message?.id || message?.key?.id || '').toUpperCase();
    return Boolean(id && baileysMessagePrefixes.some(prefix => id.startsWith(prefix)));
};

const getTarget = (m, args = []) => {
    if (m.quoted?.sender) {
        return {
            jid: getRawJid(m.quoted.sender),
            source: 'reply',
            message: m.quoted
        };
    }

    if (m.mentionedJid?.[0]) {
        return {
            jid: getRawJid(m.mentionedJid[0]),
            source: 'mention/tag',
            message: null
        };
    }

    const jid = normalizeTarget(args[0]);
    if (jid) {
        return {
            jid,
            source: 'nomor',
            message: null
        };
    }

    return null;
};

const formatStatus = (value) => value ? 'Ya' : 'Tidak';

const handler = async (m, { reply, args = [] }) => {
    const target = getTarget(m, args);
    if (!target) {
        return reply(
            'Cara penggunaan:\n' +
            '• Reply pesan: .isbot\n' +
            '• Tag pengguna: .isbot @628xxxx\n' +
            '• Masukkan nomor: .isbot 628xxxx'
        );
    }

    const normalizedJid = jidNormalizedUser(target.jid);
    const botJid = target.jid.endsWith('@c.us')
        ? target.jid
        : normalizedJid.replace(/@s\.whatsapp\.net$/, '@c.us');
    const jidBot = isJidBot(botJid);
    const messageId = target.message?.id || target.message?.key?.id || '';
    const messageBaileys = target.message?.isBaileys === true || isKnownBaileysMessageId(target.message);
    const messageFromMe = target.message?.fromMe === true;
    const reliableMessageCheck = target.source === 'reply';

    const details = [
        '🔎 *Hasil pemeriksaan target*',
        `• Sumber target: ${target.source}`,
        `• JID: ${target.jid}`,
        `• isJidBot: ${formatStatus(jidBot)}`,
        `• isBaileys pada pesan: ${reliableMessageCheck ? formatStatus(messageBaileys) : 'Tidak tersedia'}`,
        `• Pesan dari akun bot ini: ${reliableMessageCheck ? formatStatus(messageFromMe) : 'Tidak tersedia'}`,
        '',
        jidBot
            ? '⚠️ JID ini cocok dengan pola bot resmi Baileys.'
            : reliableMessageCheck && messageBaileys
                ? '⚠️ Pesan yang direply memiliki ciri ID pesan Baileys.'
                : 'ℹ️ Tidak ada indikator bot yang terdeteksi.'
    ];

    if (target.source !== 'reply') {
        details.push(
            '',
            'Catatan: tag/nomor hanya dapat memeriksa pola JID. Untuk memeriksa ciri pesan Baileys, gunakan fitur ini dengan reply pesan target.'
        );
    } else if (!messageBaileys) {
        details.push(
            '',
            `ID pesan yang diperiksa: ${messageId || 'tidak tersedia'}`,
            'Catatan: ID pesan ini tidak memiliki pola Baileys yang dikenali. Ini bukan bukti bahwa pengirimnya bukan bot.'
        );
    } else {
        details.push(
            '',
            `ID pesan yang diperiksa: ${messageId || 'tidak tersedia'}`,
            'Catatan: indikator ini hanya berdasarkan properti/format ID pesan dan bukan deteksi universal semua bot.'
        );
    }

    return reply(details.join('\n'));
};

handler.command = ['isbot', 'cekbot', 'antibot'];
handler.owner = true;

export default handler;
