const axios = (await import("axios")).default;

// Fetch buffer gambar langsung tanpa Toolkit
const imageRes = await axios.get("https://cdn.ornzora.eu.cc/e5596d94-d434-4265-b0ec-eee03e8a1487-FIORA.jpg", { 
  responseType: "arraybuffer" 
});
const imageBuffer = Buffer.from(imageRes.data);

await sock.relayMessage(
  m.chat,
  {
    listMessage: {
      title: "NIXCODE",
      description: "Pilih salah satu produk di bawah.",
      buttonText: "Lihat Produk",
      listType: 2,
      productListInfo: {
        headerImage: {
          jpegThumbnail: imageBuffer,
          productId: "9116471035103640" // Wajib isi ID Produk valid
        }, 
        productSections: [
          {
            title: "Menu Utama",
            products: [
              { productId: "1234567890" },
              { productId: "0987654321" }
            ]
          }
        ],
        businessOwnerJid: global.owner?.[0] ? `${global.owner[0]}@s.whatsapp.net` : m.sender // Ganti ke JID WA Business pemilik katalog
      },
      footerText: "© NIXCODE"
    }
  },
  {
    additionalNodes: [
      {
        tag: "biz",
        attrs: {},
        content: [
          {
            tag: "list",
            attrs: {
              v: "2",
              type: "product_list"
            }
          }
        ]
      }
    ]
  }
);