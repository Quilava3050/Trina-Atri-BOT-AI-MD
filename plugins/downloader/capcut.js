import axios from 'axios'

const handler = async (m, { sock, reply, example, args }) => {
  try {

    if (!args[0]) return m.reply(example("linknya"))
    m.reply('Wait . . .')
    let { data } = await axios.post('https://3bic.com/api/download', { url: args[0] }, {
      headers: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json'
      }
    })

    let base64url = data?.originalVideoUrl?.split('/api/cdn/')[1]
    let video = Buffer.from(base64url, 'base64').toString()

    await sock.sendMessage(m.chat, { video: { url: video } }, { quoted: m })
  } catch (e) {
    m.reply(e.message)
  }
}

handler.command = ["capcut", "ccdl"]
export default handler;