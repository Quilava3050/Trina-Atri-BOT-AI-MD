import fetch from 'node-fetch'

let handler = async (m, { sock, args, command, usedPrefix }) => {
  try {

    if (!args[0]) return m.reply(`Example: ${usedPrefix}${command} https://sub4unlock.co/xxxx`)
    
    m.reply('Wait...')

    const api = await fetch(`https://fgsi.dpdns.org/api/tools/skip/sub4unlock?apikey=fgsiapi-1f33ce6d-6d&url=${args[0]}`)
    const json = await api.json()

    if (!json.status || !json.data) return m.reply('❌ Gagal: Link invalid atau API lagi down.')

    const res = json.data
    let text = `*SUB4UNLOCK BYPASS*\n\n`
    text += `*ID:* ${res.id}\n`
    text += `*Link:* ${res.linkGo}`

    await sock.sendMessage(
      m.chat,
      {
        text: text,
        footer: `skip link sub4unlock`,
                interactiveButtons: [
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'copy link',
                            copy_code: res.linkGo,
                            id: 'copy'
                        })
                    },
                    {
                       name: 'open_webview',
                        buttonParamsJson: JSON.stringify({
                               title: 'view results',
                                 link: {
                                 in_app_webview: true, // or false
                                   url: res.linkGo
                    }
                })
               }
                ]
            }, 
            { quoted: m }
    )

  } catch (e) {
    console.error(e)
    m.reply('Yah Gagal :v')
  }
}

handler.help = ['sub4unlock']
handler.tags = ['tools']
handler.command = ['sub4unlock', 'sub4', 'skiplink']

export default handler