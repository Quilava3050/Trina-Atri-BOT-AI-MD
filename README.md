# Trina & Atri BOT AI MD

Bot WhatsApp berbasis Baileys. Project ini dibuat untuk dicoba, dipelajari, dan dikembangkan bersama.

## Fitur

Ada berbagai fitur yang dikelompokkan di folder `plugins`, seperti:

- AI dan tools
- Downloader dan pencarian
- Game dan hiburan
- Pengaturan grup, termasuk auto motivasi
- Sticker dan maker

Daftar command bisa dilihat dari menu bot.

## Persiapan

- Node.js 20 atau lebih baru
- Git
- Nomor WhatsApp untuk menjalankan bot

## Instalasi

Clone repository, lalu masuk ke folder project:

```bash
git clone https://github.com/Quilava3050/Trina-Atri-BOT-AI-MD.git
cd Trina-Atri-BOT-AI-MD
npm install
```

Sebelum menjalankan bot, siapkan `settings.js` lokal dan isi konfigurasi milikmu sendiri. File tersebut tidak disertakan di repository karena berisi pengaturan pribadi dan API key. Jangan unggah API key, file `.env`, atau data sesi WhatsApp ke GitHub.

Jalankan bot:

```bash
npm start
```

Ikuti instruksi pairing yang muncul di terminal untuk menghubungkan WhatsApp.

## Auto motivasi grup

Admin grup bisa melihat daftar pengaturan dengan `.on` atau `.off`, lalu mengaktifkan atau menonaktifkan `automotivasi` menggunakan nomor yang ditampilkan. Pesan motivasi dikirim otomatis setiap 3 jam ke grup yang mengaktifkannya.

## Catatan

- Gunakan API key milik sendiri dan simpan secara privat.
- Jangan bagikan folder `Auth` atau file sesi WhatsApp.
- Beberapa fitur memerlukan API key atau layanan pihak ketiga agar dapat digunakan.
