import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import { fileTypeFromBuffer } from 'file-type'

/**
 * Upload File/Buffer ke Uguu.se
 * @param {Buffer|String} input - Bisa berupa Buffer atau path lokasi file
 */
export async function UploadFileUgu(input) {
  try {
    const form = new FormData()

    if (Buffer.isBuffer(input)) {
      const type = (await fileTypeFromBuffer(input)) || { ext: 'bin', mime: 'application/octet-stream' }
      form.append('files[]', input, { 
        filename: `file_${Date.now()}.${type.ext}`,
        contentType: type.mime 
      })
    } else if (typeof input === 'string' && fs.existsSync(input)) {
      form.append('files[]', fs.createReadStream(input))
    } else {
      throw new Error('Input harus berupa Buffer atau File Path yang valid!')
    }

    const { data } = await axios.post('https://uguu.se/upload.php', form, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...form.getHeaders()
      }
    })

    if (!data?.success || !data?.files?.[0]) {
      throw new Error('Gagal mengunggah file ke Uguu.se')
    }

    return data.files[0]
  } catch (err) {
    throw new Error(`Uguu Upload Error: ${err.message}`)
  }
}

// Alias biar cocok dengan pemanggilan umum
export const uploadImage = UploadFileUgu

export default {
  UploadFileUgu,
  uploadImage
}