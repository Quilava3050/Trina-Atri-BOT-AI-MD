import {
  clearMsgStore,
  deleteMsgStoreItem,
  getMsgStoreItem,
  getMsgStoreItems,
  isMsgStoreEnabled,
  readMsgStoreMedia,
  setMsgStoreEnabled,
} from '../../control/lib/msgstore.js';

const MAX_TEXT_BYTES = 60 * 1024;
const PAGE_SIZE = 20;

const parseArchiveId = (value) => {
  const normalized = String(value || '').replace(/^#/, '');
  if (!/^\d+$/.test(normalized)) return null;
  const id = Number(normalized);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const describeItem = (item) => {
  const preview = (item.text || `[${item.type.replace(/Message$/, '')}]`)
    .replace(/\s+/g, ' ')
    .slice(0, 90);
  return [
    `ID: ${item.id}`,
    `Waktu: ${new Date(item.timestamp).toLocaleString('id-ID')}`,
    `Cuplikan: ${preview}`,
  ].join('\n');
};

const sendStoredItem = async (sock, chat, item) => {
  if (item.mediaFile) {
    const buffer = await readMsgStoreMedia(chat, item);
    const caption = item.text || undefined;
    switch (item.type) {
      case 'imageMessage':
        return sock.sendMessage(chat, { image: buffer, caption });
      case 'videoMessage':
        return sock.sendMessage(chat, { video: buffer, caption, gifPlayback: item.gifPlayback });
      case 'audioMessage':
        return sock.sendMessage(chat, { audio: buffer, mimetype: item.mimetype || 'audio/ogg', ptt: item.ptt });
      case 'documentMessage':
        return sock.sendMessage(chat, {
          document: buffer,
          mimetype: item.mimetype || 'application/octet-stream',
          fileName: item.fileName || `msgstore-${item.id}`,
          caption,
        });
      case 'stickerMessage':
        return sock.sendMessage(chat, { sticker: buffer });
      default:
        throw new Error(`Jenis media ${item.type} belum didukung untuk dikirim ulang.`);
    }
  }
  if (typeof item.text !== 'string' || !item.text) {
    throw new Error('Pesan ini tidak memiliki isi yang dapat dikirim ulang.');
  }
  return sock.sendMessage(chat, { text: item.text });
};

const handler = async (m, { sock, args = [] }) => {
  const action = String(args[0] || 'help').toLowerCase();
  const value = args[1];

  try {
    if (action === 'on' || action === 'aktif') {
      await setMsgStoreEnabled(m.chat, true);
      await sock.sendMessage(m.chat, {
        text: [
          '✅ Arsip manual pesan grup diaktifkan.',
          'Pesan baru akan disimpan selama maksimal 7 hari. Media dibatasi 10 MB per file dan 100 MB per grup.',
          'Pesan sementara/sekali lihat dan pesan perintah tidak disimpan. Admin dapat melihat, mengirim ulang, atau menghapus arsip.',
          'Catatan: antidelete diatur terpisah melalui `.on 13`.',
          'Pastikan anggota grup mengetahui bahwa arsip ini aktif.',
        ].join('\n'),
      }, { quoted: m });
      return;
    }

    if (action === 'off' || action === 'mati') {
      await setMsgStoreEnabled(m.chat, false);
      await sock.sendMessage(m.chat, {
        text: '⏸️ Arsip manual dimatikan. Antidelete tidak berubah; gunakan `.off 13` untuk mematikannya.',
      }, { quoted: m });
      return;
    }

    if (action === 'status') {
      const [enabled, items] = await Promise.all([
        isMsgStoreEnabled(m.chat),
        getMsgStoreItems(m.chat),
      ]);
      await sock.sendMessage(m.chat, {
        text: [
          `Arsip manual: ${enabled ? 'aktif' : 'mati'}`,
          `Pesan tersimpan: ${items.length}`,
          'Retensi: maksimal 7 hari',
        ].join('\n'),
      }, { quoted: m });
      return;
    }

    if (action === 'list' || action === 'daftar') {
      const page = Math.max(1, Number.parseInt(value, 10) || 1);
      const items = await getMsgStoreItems(m.chat);
      const start = (page - 1) * PAGE_SIZE;
      const pageItems = items.slice(start, start + PAGE_SIZE);
      const output = pageItems.length
        ? `Daftar arsip (halaman ${page}/${Math.max(1, Math.ceil(items.length / PAGE_SIZE))})\n\n${pageItems.map(describeItem).join('\n\n')}`
        : 'Belum ada pesan pada halaman ini.';
      await sock.sendMessage(m.chat, { text: output }, { quoted: m });
      return;
    }

    if (action === 'view' || action === 'lihat') {
      const id = parseArchiveId(value);
      if (!id) {
        await sock.sendMessage(m.chat, { text: '❌ ID belum valid. Gunakan `.msgstore view 1` atau `.msgstore view #1`.' }, { quoted: m });
        return;
      }
      const item = await getMsgStoreItem(m.chat, id);
      if (!item) {
        await sock.sendMessage(m.chat, { text: '❌ ID arsip tidak ditemukan.' }, { quoted: m });
        return;
      }
      if (Buffer.byteLength(item.text || '', 'utf8') > MAX_TEXT_BYTES) {
        await sock.sendMessage(m.chat, { text: '❌ Isi terlalu besar untuk ditampilkan sebagai satu pesan.' }, { quoted: m });
        return;
      }
      const detail = [
        `📄 Arsip #${item.id}`,
        `Jenis: ${item.type.replace(/Message$/, '')}`,
        `Pengirim: @${item.sender.split('@')[0]}`,
        `Waktu: ${new Date(item.timestamp).toLocaleString('id-ID')}`,
        item.mediaFile ? `Media: tersimpan (${(item.mediaSize / 1024 / 1024).toFixed(2)} MB)` : '',
        '',
        item.text || '(tanpa teks)',
      ].filter(Boolean).join('\n');
      await sock.sendMessage(m.chat, { text: detail, mentions: [item.sender] }, { quoted: m });
      return;
    }

    if (action === 'resend' || action === 'kirim') {
      const id = parseArchiveId(value);
      if (!id) {
        await sock.sendMessage(m.chat, { text: '❌ ID belum valid. Gunakan `.msgstore resend 1` atau `.msgstore resend #1`.' }, { quoted: m });
        return;
      }
      const item = await getMsgStoreItem(m.chat, id);
      if (!item) {
        await sock.sendMessage(m.chat, { text: '❌ ID arsip tidak ditemukan.' }, { quoted: m });
        return;
      }
      await sendStoredItem(sock, m.chat, item);
      return;
    }

    if (action === 'delete' || action === 'hapus') {
      const id = parseArchiveId(value);
      if (!id) {
        await sock.sendMessage(m.chat, { text: '❌ ID belum valid. Gunakan `.msgstore delete 1` atau `.msgstore delete #1`.' }, { quoted: m });
        return;
      }
      const item = await deleteMsgStoreItem(m.chat, id);
      if (!item) {
        await sock.sendMessage(m.chat, { text: '❌ ID arsip tidak ditemukan.' }, { quoted: m });
        return;
      }
      let deleteError;
      try {
        await sock.sendMessage(m.chat, { delete: item.key });
      } catch (err) {
        console.error('[MSGSTORE] Arsip terhapus, tetapi penghapusan pesan asli gagal:', err);
        deleteError = err;
      }
      const status = deleteError
        ? `🗑️ Arsip #${item.id} sudah dihapus, tetapi pesan asli gagal dihapus: ${deleteError?.message || deleteError}`
        : `🗑️ Arsip #${item.id} dihapus dan permintaan hapus pesan asli sudah dikirim. WhatsApp hanya mengizinkan penghapusan asli dalam kondisi tertentu.`;
      await sock.sendMessage(m.chat, { text: status }, { quoted: m });
      return;
    }

    if (action === 'clear' || action === 'bersihkan') {
      const count = await clearMsgStore(m.chat);
      await setMsgStoreEnabled(m.chat, false);
      await sock.sendMessage(m.chat, {
        text: `🧹 ${count} arsip dihapus dan arsip manual dimatikan. Antidelete tidak berubah.`,
      }, { quoted: m });
      return;
    }

    await sock.sendMessage(m.chat, {
      text: [
        'Pengelola arsip pesan grup (admin grup/owner):',
        '.msgstore on — aktifkan arsip manual',
        '.msgstore off — matikan arsip manual',
        '.on 13 / .off 13 — aktifkan/matikan antidelete',
        '.msgstore status — status dan jumlah arsip',
        '.msgstore list [halaman] — daftar pesan',
        '.msgstore view <id> — lihat isi pesan',
        '.msgstore resend <id> — kirim ulang teks/media',
        '.msgstore delete <id> — hapus arsip dan coba hapus pesan asli',
        '.msgstore clear — hapus semua arsip dan matikan perekaman',
      ].join('\n'),
    }, { quoted: m });
  } catch (err) {
    console.error('[MSGSTORE] Gagal menjalankan perintah:', err);
    await sock.sendMessage(m.chat, {
      text: `❌ Gagal menjalankan msgstore: ${err?.message || err}`,
    }, { quoted: m });
  }
};

handler.help = ['msgstore <on|off|status|list|view|resend|delete|clear>'];
handler.tags = ['owner'];
handler.command = ['msgstore'];
handler.group = true;
handler.admin = true;

export default handler;
