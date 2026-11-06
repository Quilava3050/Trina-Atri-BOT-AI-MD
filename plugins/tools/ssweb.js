import axios from "axios"
import FormData from "form-data"

async function ssweb(url) {
  const token = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJhdWQiOiIiLCJpYXQiOjE1MjMzNjQ4MjQsIm5iZiI6MTUyMzM2NDgyNCwianRpIjoicHJvamVjdF9wdWJsaWNfYzkwNWRkMWMwMWU5ZmQ3NzY5ODNjYTQwZDBhOWQyZjNfT1Vzd2EwODA0MGI4ZDJjN2NhM2NjZGE2MGQ2MTBhMmRkY2U3NyJ9.qvHSXgCJgqpC4gd6-paUlDLFmg0o2DsOvb1EUYPYx_E'

  const f1 = new FormData()
  f1.append('task','t0bbjt9wrvbj7yAqlwgbt7r37dvdfmnthfz6zgmt15pt3j3scwp73hxkhyb63lzh5bkc9mj09Az5dmkww8b3nvA91dx2nld6djbdsd6n6vtyccphcj01j76q6vm9l26rct5yk4kf7bm35f6Axl11c4n6tq56jzjr1nh6mpfgv6xdtggvzbd1')
  f1.append('cloud_file', url)

  const up = await axios.post('https://api32.ilovepdf.com/v1/upload', f1, {
    headers: { ...f1.getHeaders(), authorization: token }
  })

  const f2 = new FormData()
  f2.append('server_filename', up.data.server_filename)
  f2.append('task','t0bbjt9wrvbj7yAqlwgbt7r37dvdfmnthfz6zgmt15pt3j3scwp73hxkhyb63lzh5bkc9mj09Az5dmkww8b3nvA91dx2nld6djbdsd6n6vtyccphcj01j76q6vm9l26rct5yk4kf7bm35f6Axl11c4n6tq56jzjr1nh6mpfgv6xdtggvzbd1')
  f2.append('url', url)
  f2.append('view_width', '596')
  f2.append('to_format', 'jpg')
  f2.append('block_ads', 'false')
  f2.append('remove_popups', 'false')

  const prev = await axios.post('https://api32.ilovepdf.com/v1/preview', f2, {
    headers: { ...f2.getHeaders(), authorization: token }
  })

  return 'https://api32.ilovepdf.com/thumbnails/' + prev.data.thumbnail
}

let handler = async (m, { reply, text, sock, usedPrefix }) => {

    if (!text) return reply(`Contoh: ${usedPrefix}ssweb https://google.com`)
    reply("Wait...")

    try {
        const result = await ssweb(text)

        await sock.sendMessage(m.chat, {
            image: { url: result },
            caption: `\`\`\`Screenshot Web\`\`\``
        }, { quoted: m })

    } catch (e) {
        console.log(e)
        reply("Gagal mengambil screenshot web.")
    }
}

handler.command = ["ssweb"]
export default handler