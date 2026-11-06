const handler = async (m, { sock, text, command, reply }) => {

 try {
 const q = m.quoted ? m.quoted : m
 const mime =
 (q.msg || q).mimetype ||
 q.mimetype ||
 q.message?.imageMessage?.mimetype
 if (!mime || !/image/.test(mime))
 return reply("Kirim atau reply gambar dengan caption *ocr* untuk ekstrak teks")

 reply("wait...")
 const buffer = await q.download()
 const mimeType = /png/.test(mime) ? "image/png" : "image/jpeg"
 const imageBase64 = buffer.toString("base64")

 const res = await fetch("https://api.ocr.space/parse/image", {
 method: "POST",
 headers: {
   apikey: "helloworld"
 },
 body: new URLSearchParams({
   base64Image: `data:${mimeType};base64,${imageBase64}`,
   language: "eng",
 })
 })

 if (!res.ok) throw new Error(await res.text())

 const json = await res.json()

 const extractedText =
  json?.ParsedResults?.[0]?.ParsedText?.trim() ||
  "Teks tidak ditemukan."

 await sock.sendMessage(
      m.chat,
      {
        text: `*OCR result:*\n\n${extractedText}`,
        footer: `click button untuk copy`,
        interactiveButtons: [
          {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
              display_text: 'copy',
              copy_code: extractedText,
              id: 'copy'
            })
          }
        ]
      },
      { quoted: m }
 )

 } catch (err) {
 console.error(err)
 reply("Gagal melakukan OCR, coba lagi nanti.")
 await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
 }
}
handler.command = ["readtext", "ocr"]
export default handler;