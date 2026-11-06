// plugins/grup/add.js
const handler = async (m, { sock, text, command, reply, usedPrefix }) => {

  let nomor = text?.replace(/[^0-9]/g, "");

  if (m.mentionedJid?.[0]) nomor = m.mentionedJid[0].split("@")[0];
  else if (m.quoted?.sender) nomor = m.quoted.sender.split("@")[0];

  if (!nomor) return reply(`Contoh: ${usedPrefix}${command} 628xxxx`);
  if (nomor.length < 8) return reply("Nomor tidak valid!");

  const target = nomor + "@s.whatsapp.net";

  try {
    const updateResult = await sock.groupParticipantsUpdate(m.chat, [target], "add");
    const resultItems = Array.isArray(updateResult) ? updateResult : [updateResult];
    const resultText = JSON.stringify(resultItems).toLowerCase();
    let metadata = null;

    try {
      metadata = await sock.groupMetadata(m.chat);
    } catch (metadataError) {
      console.warn("[ADD] Tidak dapat memeriksa status peserta setelah request:", metadataError?.message);
    }

    const normalizeJid = jid => String(jid || "").replace(/:\d+(?=@)/, "");
    const targetJid = normalizeJid(target);
    const participants = metadata?.participants || [];
    const pendingParticipants = metadata?.pendingParticipants ||
      metadata?.pending_participants ||
      metadata?.joinApprovalRequests ||
      [];
    const isMember = participants.some(participant =>
      normalizeJid(participant?.id || participant?.jid || participant) === targetJid
    );
    const isPending = pendingParticipants.some(participant =>
      normalizeJid(participant?.id || participant?.jid || participant) === targetJid
    ) || /pending|approval|request.?sent|join.?request/.test(resultText);

    if (isPending && !isMember) {
      await sock.sendMessage(m.chat, {
        text: `Permintaan untuk menambahkan @${nomor} sudah dikirim dan sedang menunggu persetujuan admin.`,
        mentions: [target]
      }, { quoted: m });
      return;
    }

    await sock.sendMessage(m.chat, {
      text: `Berhasil menambahkan @${nomor}`,
      mentions: [target]
    }, { quoted: m });
  } catch (err) {
    const statusCode = err?.output?.statusCode || err?.statusCode || err?.data?.statusCode;
    const errorText = String(
      err?.output?.payload?.message ||
      err?.message ||
      err?.data?.message ||
      ""
    ).toLowerCase();

    console.error("[ADD] Gagal menambahkan peserta:", {
      statusCode,
      message: err?.message
    });

    let message = "Gagal menambahkan peserta. Tidak ada percobaan ulang otomatis.";
    if (statusCode === 429 || /rate.?limit|too many|throttl/.test(errorText)) {
      message = "Permintaan add sedang dibatasi WhatsApp. Jangan ulangi berkali-kali; tunggu beberapa saat.";
    } else if (statusCode === 403 || /forbidden|not authorized|privacy|not in group/.test(errorText)) {
      message = "Bot tidak diizinkan menambahkan nomor ini. Nomor tersebut mungkin membatasi penambahan atau bot tidak memiliki izin.";
    } else if (statusCode === 409 || /already.*(group|参加)|exists/.test(errorText)) {
      message = "Nomor tersebut sudah ada di grup atau permintaan add sedang diproses.";
    } else if (statusCode === 400 || /invalid|bad request|not a whatsapp user/.test(errorText)) {
      message = "Nomor tidak valid atau tidak terdaftar di WhatsApp.";
    } else if (statusCode === 408 || /timeout|timed out|connection/.test(errorText)) {
      message = "Permintaan add tidak mendapat respons. Tidak ada retry otomatis; coba lagi nanti.";
    }

    await reply(message);
  }
};

handler.command = ["add"];
handler.admin = true
handler.group = true
handler.botadmin = true

export default handler;