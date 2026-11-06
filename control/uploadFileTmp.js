import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Upload image/file to tmpfiles.org
 * @param {Buffer} buffer File Buffer
 * @returns {Promise<string>} Direct Download URL
 */
export default async (buffer) => {
  const fileType = await fileTypeFromBuffer(buffer);
  const ext = fileType ? fileType.ext : 'bin';
  const mime = fileType ? fileType.mime : 'application/octet-stream';

  const form = new FormData();
  form.append("file", buffer, { filename: `tmp.${ext}`, contentType: mime });

  try {
    const { data } = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
      headers: form.getHeaders(),
    });

    if (!data?.data?.url) throw new Error('Gagal mendapatkan URL dari tmpfiles');

    const match = /https?:\/\/tmpfiles.org\/(.*)/.exec(data.data.url);
    if (!match) throw new Error('Format URL tidak sesuai');

    return `https://tmpfiles.org/dl/${match[1]}`;
  } catch (error) {
    throw error;
  }
};