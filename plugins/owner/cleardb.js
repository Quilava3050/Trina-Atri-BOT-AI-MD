import { clearUserGroupData, getDatabaseCounts } from '../../control/database.js'

const CONFIRM_WINDOW_MS = 60 * 1000
const pendingConfirmations = new Map()

const handler = async (m, { args, reply }) => {
  const sender = m.sender
  const confirmation = args[0]?.toLowerCase()

  if (confirmation !== 'confirm') {
    const counts = getDatabaseCounts()
    pendingConfirmations.set(sender, Date.now() + CONFIRM_WINDOW_MS)
    return reply(
      `Database berisi ${counts.users} data user dan ${counts.groups} data grup.\n\n` +
      `Untuk melanjutkan, kirim .cleardb confirm dalam 60 detik.\n` +
      `Ini menghapus semua data user (termasuk status ban) dan konfigurasi grup. ` +
      `Pengaturan bot akan dipertahankan. File konfigurasi dan data lain tidak disentuh.`
    )
  }

  const expiresAt = pendingConfirmations.get(sender)
  pendingConfirmations.delete(sender)
  if (!expiresAt || Date.now() > expiresAt) {
    return reply('Tidak ada konfirmasi cleardb yang aktif. Jalankan .cleardb terlebih dahulu untuk meninjau data yang akan dihapus.')
  }

  try {
    const counts = clearUserGroupData()
    return reply(
      `Database berhasil dibersihkan.\n` +
      `Data user dihapus: ${counts.users}\n` +
      `Data grup dihapus: ${counts.groups}\n` +
      `Pengaturan bot tetap dipertahankan.`
    )
  } catch (error) {
    console.error('[CLEARD_DB] Gagal membersihkan database:', error)
    return reply(`Gagal membersihkan database: ${error.message || error}`)
  }
}

handler.help = ['cleardb']
handler.tags = ['owner']
handler.command = ['cleardb']
handler.owner = true

export default handler
