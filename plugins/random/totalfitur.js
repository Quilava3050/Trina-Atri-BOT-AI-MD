let handler = async (m, { sock, getPluginStats, text }) => {

const info = getPluginStats();

await sock.sendMessage(
      m.chat,
      {
        text: `*Total feature:*
- Total fitur : ${info.totalFiles}
- Total folder category : (${info.totalCategory}) folders\n`,
        footer: `© powered by Trina`,
                interactiveButtons: [
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: 'REPORT',
                    url: 'https://t.me/qil_qila',
                    merchant_url: 'https://t.me/qil_qila'
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: 'FOLLOW CHANNEL',
                    url: 'https://whatsapp.com/channel/0029VbAu5Ng0G0XrGE2Uz51W',
                    merchant_url: 'https://whatsapp.com/channel/0029VbAu5Ng0G0XrGE2Uz51W'
                })
            }
                ]
            }, 
            { quoted: m }
    )
}
handler.command = ["totalfitur","total","count"]
export default handler;


