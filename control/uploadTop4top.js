import { fileTypeFromBuffer } from 'file-type'
import { load } from 'cheerio'

/**
 * Upload file to top4top.io
 * Supports all media types: images, audio, video, documents
 * @param {Buffer} buffer File Buffer
 * @returns {string} Download URL
 */
export default async function uploadImage(buffer, mimeType) {
  const fileType = await fileTypeFromBuffer(buffer) || getFileTypeFromMime(mimeType)
  if (!fileType) throw new Error('❌ Jenis file tidak dikenali')

  return await uploadToTop4top(buffer, fileType)
}

function getFileTypeFromMime(mimeType) {
  const imageTypes = {
    'image/jpeg': { ext: 'jpg', mime: 'image/jpeg' },
    'image/png': { ext: 'png', mime: 'image/png' },
    'image/gif': { ext: 'gif', mime: 'image/gif' },
    'image/webp': { ext: 'webp', mime: 'image/webp' },
    'image/avif': { ext: 'avif', mime: 'image/avif' }
  }

  return imageTypes[mimeType?.split(';')[0].trim().toLowerCase()]
}

// 🔹 top4top.io uploader
async function uploadToTop4top(buffer, { ext, mime }) {
  const origin = 'https://top4top.io'
  const data = new FormData()
  const file = new File([buffer], Date.now() + '.' + ext, { type: mime })
  data.append('file_1_', file)
  data.append('submitr', '[ رفع الملفات ]')

  const options = {
    method: 'POST',
    body: data
  }

  console.log('Uploading file to top4top... ' + file.name)
  const response = await fetch(origin + '/index.php', options)

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}\n${await response.text()}`)
  }

  const html = await response.text()
  const $ = load(html)
  const urls = $('input.all_boxes')
    .map((_, input) => $(input).attr('value'))
    .get()
    .filter(Boolean)

  if (!urls.length) {
    const responseDetails = html.replace(/\s+/g, ' ').slice(0, 500)
    throw new Error(`Failed to upload file to top4top. Response: ${responseDetails}`)
  }

  const downloadUrl = urls.find(url => url.endsWith(ext))

  if (!downloadUrl) {
    throw new Error('Download URL not found')
  }

  return downloadUrl
}