import fetch from "node-fetch"

const handler = async (m, { sock, text, command, reply, usedPrefix }) => {

  if (!text) return reply(`Example: *${usedPrefix}${command}* teksnya`);
  
  const api = `${global.api.free3}/api/maker/bratanime?text=${encodeURIComponent(text)}`

  try {
    const res = await fetch(api)
    const contentType = res.headers.get("content-type")
    let imgUrl;
    if (contentType.includes("application/json")) {
      const json = await res.json()
      imgUrl = json.result || json.url || json.image
      if (!imgUrl) throw new Error("API tidak memberikan URL gambar")
    } 
    else {
      imgUrl = api
    }
    await sock.sendImageAsSticker(
      m.chat,
      imgUrl,
      m,
      { packname: "Trina", author: "sesudah before" }
    )

  } catch (err) {
    reply("❌ Error: " + err.message)
  }

}

handler.command = ["animebrat","bratanim","bratanime"]
export default handler;