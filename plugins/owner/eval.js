
import util from 'util';
import { exec } from 'child_process';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getRawCommandBody = (m, prefix, command) => {
    const body = typeof m.body === 'string' ? m.body : '';
    const commandPattern = new RegExp(
        `^${escapeRegExp(prefix)}${escapeRegExp(command)}(?=\\s|$)\\s*`,
        'i'
    );
    return body.replace(commandPattern, '').trim();
};

const getRepliedCode = async (m) => {
    const quoted = m.quoted;
    if (!quoted) return '';

    if (quoted.mtype === 'documentMessage') {
        const filename = quoted.fileName || quoted.filename || '';
        if (!/\.js$/i.test(filename)) {
            throw new Error('File reply harus berekstensi .js agar bisa dijalankan.');
        }

        const buffer = await quoted.download();
        if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
            throw new Error('File JavaScript yang di-reply kosong atau gagal diunduh.');
        }
        if (buffer.length > 256 * 1024) {
            throw new Error('Ukuran file JavaScript maksimal 256 KB.');
        }
        return buffer.toString('utf-8').trim();
    }

    const quotedContent = m.msg?.contextInfo?.quotedMessage;
    const extractText = (content) => {
        if (!content || typeof content !== 'object') return '';
        if (content.ephemeralMessage?.message) return extractText(content.ephemeralMessage.message);
        if (content.viewOnceMessage?.message) return extractText(content.viewOnceMessage.message);
        if (content.viewOnceMessageV2?.message) return extractText(content.viewOnceMessageV2.message);

        return content.conversation ||
            content.extendedTextMessage?.text ||
            content.imageMessage?.caption ||
            content.videoMessage?.caption ||
            content.documentMessage?.caption ||
            '';
    };

    const source = quoted.text || extractText(quotedContent);
    return String(source).replace(/^\s*```(?:javascript|js)?\s*\n?([\s\S]*?)\n?```\s*$/i, '$1').trim();
};

const getMessageId = (message) => message?.key?.id || null;

const formatWithMessageId = (label, value, message) => {
    const output = typeof value === 'string' ? value : util.inspect(value, { depth: 6 });
    const messageId = getMessageId(message);
    return `${label}\n${output}${messageId ? `\n\nMessage ID: ${messageId}` : ''}`;
};

const prepareEvalCode = (code) => {
    const trimmed = code.trim();
    if (!trimmed || /\breturn\b/.test(trimmed) || /[;\n]/.test(trimmed)) return code;

    const statementStart = /^(?:const|let|var|if|for|while|switch|try|throw|class|function|async\s+function)\b/;
    if (statementStart.test(trimmed)) return code;

    return `return (${trimmed})`;
};

let handler = async (m, pluginContext) => {
    const { sock, reply, command, text, usedPrefix } = pluginContext;

    const prefix = typeof usedPrefix === 'string' ? usedPrefix : (global.prefix || '.');
    const baseCommand = String(command || '').toLowerCase(); 
    let codeBody = text;
    
    if (baseCommand === '>' || baseCommand === '$') {
        if (typeof codeBody !== 'string') {
            const messageText = typeof m.text === 'string' ? m.text.trim() : '';
            codeBody = messageText.slice(prefix.length + baseCommand.length).trim();
        } else {
            codeBody = codeBody.trim();
        }
    }


    switch (baseCommand) {
        
        case 'ambilq':
        case 'q':
            try {
                if (!m.quoted) return reply(`Ex: ${prefix}q (reply pesannya)`);
                const result = m.quoted;
                const output = util.inspect(result, { depth: 5 }); 
                await sock.sendMessage(m.chat, { text: output }, { quoted: m });
            } catch (err) {
                await sock.sendMessage(m.chat, { text: util.format(err) }, { quoted: m });
            }
            break;

        case 'eval':
        case '=>':
            try {
                const commandCode = getRawCommandBody(m, prefix, baseCommand) || codeBody;
                const code = commandCode || await getRepliedCode(m);
                if (!code) return reply(`Ex: ${prefix}eval kode yang mau di eval`);

                const sendMessage = async (jid, content, options = {}) => {
                    const target = jid || m.chat;
                    const message = await sock.sendMessage(target, content, options);
                    return message;
                };
                const sendText = (value, options = {}) =>
                    sendMessage(m.chat, { text: String(value) }, options);
                const sendReply = (value, options = {}) =>
                    sendMessage(m.chat, { text: String(value) }, { quoted: m, ...options });
                const sendImage = (image, caption = '', options = {}) =>
                    sendMessage(m.chat, { image, caption }, options);
                const sendVideo = (video, caption = '', options = {}) =>
                    sendMessage(m.chat, { video, caption }, options);
                const sendAudio = (audio, ptt = false, options = {}) =>
                    sendMessage(m.chat, {
                        audio,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt
                    }, options);
                const sendDocument = (document, fileName, mimetype = 'application/octet-stream', options = {}) =>
                    sendMessage(m.chat, { document, fileName, mimetype }, options);
                const sendReaction = (reaction, key = m.key) =>
                    sendMessage(m.chat, { react: { text: String(reaction), key } });
                const sendEvalOutput = async (label, value) => {
                    const outputMessage = await sendReply(formatWithMessageId(label, value, value));
                    const outputId = getMessageId(outputMessage);
                    if (outputId) {
                        await sendText(`[EVAL TRACE] Message ID: ${outputId}`);
                    }
                    return outputMessage;
                };

                const evaluationCode = prepareEvalCode(code);
                const evaluationContext = {
                    ...pluginContext,
                    sock,
                    conn: pluginContext.conn || sock,
                    wa: sock,
                    m,
                    msg: m,
                    message: m,
                    jid: m.chat,
                    chatId: m.chat,
                    chat: m.chat,
                    sender: m.sender,
                    userJid: m.sender,
                    messageId: m.key?.id || null,
                    mkey: m.key,
                    isGroup: Boolean(m.isGroup),
                    quoted: m.quoted,
                    q: m.quoted || m,
                    qmsg: pluginContext.qmsg || m.quoted?.msg || null,
                    reply,
                    sendMessage,
                    send: sendMessage,
                    sendText,
                    sendReply,
                    sendImage,
                    sendVideo,
                    sendAudio,
                    sendDocument,
                    sendReaction,
                    getMessageId,
                    getQuotedMessage: () => m.quoted,
                    text: evaluationCode,
                    mess: global.mess,
                    util,
                    delay: pluginContext.delay || ((ms) => new Promise(resolve => setTimeout(resolve, ms))),
                    usedPrefix: prefix,
                    prefix
                };
                const contextEntries = Object.entries(evaluationContext)
                    .filter(([name]) =>
                        /^[A-Za-z_$][\w$]*$/.test(name) &&
                        !["await", "arguments", "eval"].includes(name)
                    );
                const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
                const fn = new AsyncFunction(...contextEntries.map(([name]) => name), evaluationCode);
                const result = await fn(...contextEntries.map(([, value]) => value));

                if (result !== undefined) {
                    const outputMessage = await sendEvalOutput('[EVAL RESULT]', result);
                    console.log(`[EVAL] Result message ID: ${getMessageId(outputMessage) || 'unknown'}`);
                }
            } catch (err) {
                const errorMessage = await reply(`[EVAL ERROR]\n${util.format(err)}`);
                const errorId = getMessageId(errorMessage);
                if (errorId) {
                    await sock.sendMessage(m.chat, { text: `[EVAL TRACE] Error message ID: ${errorId}` });
                }
                console.error(`[EVAL] Error message ID: ${getMessageId(errorMessage) || 'unknown'}`, err);
            }
            break;
            
        case '>':
            try {
                const code = codeBody;
                if (!code) return reply(`Ex: ${prefix}> kodenya`);

                let result = await (async () => eval(code))();
                if (typeof result !== "string") result = util.inspect(result);
                
                await sock.sendMessage(m.chat, { text: result }, { quoted: m });
            } catch (err) {
                await sock.sendMessage(m.chat, { text: util.format(err) }, { quoted: m });
            }
            break;

        case '$':
            const shellCommand = codeBody;
            if (!shellCommand) return reply(`Ex: ${prefix}$ command nya`);

            exec(shellCommand, (err, stdout, stderr) => {
                if (err) return sock.sendMessage(m.chat, { text: err.toString() }, { quoted: m });
                if (stdout) return sock.sendMessage(m.chat, { text: util.format(stdout) }, { quoted: m });
                if (stderr) return sock.sendMessage(m.chat, { text: util.format(stderr) }, { quoted: m });

                return sock.sendMessage(m.chat, { text: 'Done (No output)' }, { quoted: m });
            });
            break;
            
        default:
            break; 
    }
};

handler.command = ['ambilq', 'q', 'eval', '=>', '$']; 
handler.owner = true

export default handler;