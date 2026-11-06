const AUTO_DOWNLOAD_DOMAINS = [
  'tiktok.com',
  'douyin.com',
  'instagram.com',
  'facebook.com',
  'fb.watch',
  'twitter.com',
  'x.com',
  'pin.it',
  'pinterest.com',
  'threads.net',
  'threads.com',
  'scribd.com',
  'videy.co'
];

const isAutoDownloadUrl = (value) => {
  try {
    const { hostname, protocol } = new URL(value);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    const host = hostname.toLowerCase();
    return AUTO_DOWNLOAD_DOMAINS.some(domain => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

export const findAutoDownloadUrl = (text) =>
  (String(text || '').match(/https?:\/\/[^\s]+/gi) || [])
    .find(isAutoDownloadUrl) || null;

export const describeAutoDownloadError = (error) => {
  const code = String(error?.code || error?.cause?.code || '').toUpperCase();
  const message = String(error?.message || error || '').replace(/\s+/g, ' ').trim();

  if (['ENOMEM', 'ENOSPC', 'EFBIG', 'ERR_BUFFER_TOO_LARGE', 'ERR_FS_FILE_TOO_LARGE'].includes(code) ||
      /out of memory|memory allocation|not enough memory|no space left/i.test(message)) {
    return 'Memori atau ruang penyimpanan tidak cukup untuk memproses media.';
  }

  const status = Number(
    error?.status ||
    error?.statusCode ||
    error?.response?.status ||
    error?.output?.statusCode
  );
  if (status) return `Layanan downloader merespons HTTP ${status}.`;

  if (!message) return 'Penyebab tidak diberikan oleh sistem.';

  const safeMessage = message
    .replace(/https?:\/\/\S+/gi, '[URL]')
    .replace(/(?:apikey|api_key|token|key)=([^&\s]+)/gi, '$1=[disamarkan]')
    .slice(0, 400);
  return safeMessage || 'Penyebab tidak diberikan oleh sistem.';
};
