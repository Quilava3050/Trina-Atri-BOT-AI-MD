await sock.relayMessage(
  m.chat,
  {
    listMessage: {
      title: "NIXCODE",
      description: "Pilih salah satu menu di bawah.",
      buttonText: "Pilih Menu",
      listType: 1,
      sections: [
        {
          title: "Menu Utama",
          rows: [
            {
              title: "Profile",
              description: "Lihat profile pengguna",
              rowId: ".profile"
            },
            {
              title: "Settings",
              description: "Pengaturan bot",
              rowId: ".settings"
            },
            {
              title: "Help",
              description: "Lihat bantuan dan command",
              rowId: ".help"
            },
            {
              title: "About",
              description: "Informasi tentang bot",
              rowId: ".about"
            }
          ]
        },
        {
          title: "Tools",
          rows: [
            {
              title: "Downloader",
              description: "Download media dari berbagai sumber",
              rowId: ".downloader"
            },
            {
              title: "AI",
              description: "Gunakan fitur AI",
              rowId: ".ai"
            }
          ]
        }
      ],
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
)