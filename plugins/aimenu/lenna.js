import axios from "axios"

const handler = async (m, { sock, text }) => {

if (!text) return m.reply("mau tanya apa?")

await sock.sendMessage(m.chat, {
react: { text: "⏳", key: m.key }
})

try {

const { data } = await axios.get("https://fgsi.dpdns.org/api/ai/lenna", {
params: {
apikey: "fgsiapi-1f33ce6d-6d",
text: text
},
headers: {
accept: "application/json"
}
})

let hasil =
data?.data?.result ||
data?.data?.answer ||
data?.result ||
data?.message ||
JSON.stringify(data, null, 2)

await sock.sendMessage(m.chat, {
text: hasil
}, { quoted: m })

} catch (err) {

let status = err.response?.status

if (status === 502) {
return m.reply("⚠️ Server AI sedang sibuk, coba lagi nanti.")
}

if (status === 500) {
return m.reply("⚠️ Server API error.")
}

m.reply("❌ Error: " + (err.response?.data?.message || err.message))

}

}

handler.command = ["lenna","lena"]
export default handler