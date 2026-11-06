import axios from 'axios';
import { UploadFileUgu } from '../../control/ugUploade.js';
import '../../settings.js';

let handler = async (m, { sock, conn, args, usedPrefix, command }) => {
   try {
      const client = sock || conn;

      // 1. Cek media gambar (dikirim langsung atau di-reply)
      const quoted = m.quoted ? m.quoted : m;
      const mime = (quoted.msg || quoted).mimetype || '';

      if (!mime.startsWith('image/')) {
         return m.reply(`⚠️ Kirim atau reply gambar dengan caption *${usedPrefix + command} <prompt>*\n\nContoh: *${usedPrefix + command} ubah latar belakang jadi pantai*`);
      }

      // 2. Ambil prompt/instruksi
      const prompt = args.join(' ').trim();
      if (!prompt) {
         return m.reply(`⚠️ Harap masukkan instruksi editnya!\nContoh: *${usedPrefix + command} berikan warna yang hangat*`);
      }

      await m.reply('⏳ Sedang mengunduh gambar & memproses AI...');

      // 3. Download media gambar
      let buffer;
      if (typeof client.downloadMediaMessage === 'function') {
         buffer = await client.downloadMediaMessage(quoted);
      } else if (typeof quoted.download === 'function') {
         buffer = await quoted.download();
      } else {
         return m.reply('❌ Gagal mengunduh media dari WhatsApp.');
      }

      // 4. Upload gambar ke Uguu.se
      let uploadRes = await UploadFileUgu(buffer);

      // Ekstraksi URL murni (jika uploader mengembalikan object/array)
      let uploadedUrl = '';
      if (typeof uploadRes === 'string') {
         uploadedUrl = uploadRes;
      } else if (uploadRes && uploadRes.url) {
         uploadedUrl = uploadRes.url;
      } else if (uploadRes && uploadRes.files && uploadRes.files[0]) {
         uploadedUrl = uploadRes.files[0].url;
      }

      // Validasi apakah URL valid (harus diawali http/https)
      if (!uploadedUrl || !uploadedUrl.startsWith('http')) {
         console.error('Hasil Upload Uguu Tidak Valid:', uploadRes);
         return m.reply('❌ Gagal mengunggah gambar. Hasil URL uploader tidak valid.');
      }

      console.log('URL Terunggah:', uploadedUrl); // Log untuk pengecekan di console

      // 5. Panggil API Edit Image AI (Zansxart)
      const response = await axios.get('https://api.zansxart.me/api/ai/editimage', {
         params: {
            apikey: global.zansxart,
            url: uploadedUrl.trim(),
            prompt: prompt,
            raw: 'true'
         },
         responseType: 'arraybuffer',
         timeout: 60000
      });

      const resultBuffer = Buffer.from(response.data);

      // 6. Kirim hasil gambar yang telah diedit
      await client.sendMessage(m.chat, {
         image: resultBuffer,
         caption: `✨ *Edit Image AI Result*\n\n◦ *Prompt* : ${prompt}`
      }, { quoted: m });

   } catch (err) {
      // Jika response API berupa buffer error, ubah ke string untuk dibaca
      let errMsg = err.message;
      if (err.response && err.response.data) {
         try {
            const errJson = JSON.parse(Buffer.from(err.response.data).toString('utf-8'));
            errMsg = errJson.message || JSON.stringify(errJson);
         } catch (e) {
            errMsg = err.response.data.toString();
         }
      }
      console.error('Error EditImage AI:', errMsg);
      m.reply(`❌ Terjadi kesalahan API: ${errMsg}`);
   }
};

handler.help = ['editimage <prompt>', 'editimg <prompt>'];
handler.command = ["editpict", "editimage"]

export default handler;