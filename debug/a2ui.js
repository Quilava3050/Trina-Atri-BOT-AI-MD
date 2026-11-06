await sock.relayMessage(
  m.chat,
  {
    messageContextInfo: {
      messageSecret: "6dl5L3BxZ/haIDZtasZ9fcN4X+nGecLNbuiLh1slHLw="
    },
    interactiveMessage: {
      header: {
        hasMediaAttachment: false
      },
      body: {
        text: ""
      },
      footer: {
        text: "• Nebuluous"
      },
      nativeFlowMessage: {
        buttons: [
          {},
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              "display_text": "Cek Panda",
              "url": "https://www.google.com",
              "merchant_url": "https://www.google.com"
            })
          },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              "display_text": "Cek Pulsa",
              "url": "https://www.google.com",
              "merchant_url": "https://www.google.com"
            })
          }
        ],
        messageParamsJson: "{}",
        messageVersion: 1
      },
      bloksWidget: {
        uuid: "b392eacf-f086-48b0-b096-965be19d343a",
        data: JSON.stringify({
          "version": "v0.9",
          "createSurface": {
            "surfaceId": "starcore-widget=b392eacf-f086-48b0-b096-965be19d343a",
            "catalogId": "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json",
            "components": [
              {
                "id": "root",
                "component": "Column",
                "children": [
                  "portfolio_header",
                  "profile_section",
                  "about_section",
                  "skills",
                  "projects_section",
                  "contact"
                ]
              },
              {
                "id": "portfolio_header",
                "component": "Text",
                "text": "Portofolio Panda Raksasa",
                "variant": "h1"
              },
              {
                "id": "profile_section",
                "component": "Column",
                "children": [
                  "profile_image",
                  "profile"
                ]
              },
              {
                "id": "profile_image",
                "component": "Image",
                "url": "https://files.catbox.moe/ms64an.jpeg",
                "variant": "header",
                "fit": "none"
              },
              {
                "id": "profile",
                "component": "Text",
                "text": "Panda raksasa dengan spesialisasi bambu, tidur siang, dan menjadi hewan paling menggemaskan di hutan.",
                "variant": "body"
              },
              {
                "id": "about_section",
                "component": "Column",
                "children": [
                  "about",
                  "about_content"
                ]
              },
              {
                "id": "about",
                "component": "Text",
                "text": "Tentang Saya",
                "variant": "h2"
              },
              {
                "id": "about_content",
                "component": "Text",
                "text": "Saya adalah panda raksasa yang menghabiskan sebagian besar waktu mencari bambu, makan, beristirahat, dan menjalani kehidupan dengan santai. Keahlian utama saya adalah bertahan hidup dengan wajah menggemaskan.",
                "variant": "body"
              },
              {
                "id": "skills",
                "component": "Text",
                "text": "Keahlian: Makan Bambu • Memanjat Pohon • Berguling • Tidur Siang • Menggemaskan",
                "variant": "caption"
              },
              {
                "id": "projects_section",
                "component": "Column",
                "children": [
                  "projects",
                  "project_1",
                  "project_2",
                  "project_3"
                ]
              },
              {
                "id": "projects",
                "component": "Text",
                "text": "Aktivitas Pilihan",
                "variant": "h2"
              },
              {
                "id": "project_1",
                "component": "Card",
                "child": "project_1_content"
              },
              {
                "id": "project_1_content",
                "component": "Column",
                "children": [
                  "project_1_title",
                  "project_1_description"
                ]
              },
              {
                "id": "project_1_title",
                "component": "Text",
                "text": "Operasi Bambu",
                "variant": "h3"
              },
              {
                "id": "project_1_description",
                "component": "Text",
                "text": "Mencari, memilih, dan menghabiskan bambu berkualitas tinggi setiap hari.",
                "variant": "body"
              },
              {
                "id": "project_2",
                "component": "Card",
                "child": "project_2_content"
              },
              {
                "id": "project_2_content",
                "component": "Column",
                "children": [
                  "project_2_title",
                  "project_2_description"
                ]
              },
              {
                "id": "project_2_title",
                "component": "Text",
                "text": "Program Tidur Siang",
                "variant": "h3"
              },
              {
                "id": "project_2_description",
                "component": "Text",
                "text": "Mengoptimalkan energi dengan tidur di tempat paling nyaman setelah makan.",
                "variant": "body"
              },
              {
                "id": "project_3",
                "component": "Card",
                "child": "project_3_content"
              },
              {
                "id": "project_3_content",
                "component": "Column",
                "children": [
                  "project_3_title",
                  "project_3_description"
                ]
              },
              {
                "id": "project_3_title",
                "component": "Text",
                "text": "Duta Kegemasan",
                "variant": "h3"
              },
              {
                "id": "project_3_description",
                "component": "Text",
                "text": "Meningkatkan kebahagiaan pengunjung hanya dengan duduk, makan, dan menatap kamera.",
                "variant": "body"
              },
              {
                "id": "contact",
                "component": "Text",
                "text": "Status: Aktif • Lokasi: Hutan Bambu • Spesialisasi: Bambu",
                "variant": "caption"
              }
            ]
          }
        }),
        type: "im_a2ui"
      },
      contextInfo: {
        expiration: 7776000
      }
    }
  },
  {
    additionalNodes: [
      {
        tag: "biz",
        attrs: {}, 
        content: [
          {
            tag: "interactive",
            attrs: {
              type: "native_flow",
              v: "1"
            },
            content: [
              {
                tag: "native_flow",
                attrs: {
                  v: "9",
                  name: "mixed"
                }
              }
            ]
          }
        ]
      }
    ]
  }
)