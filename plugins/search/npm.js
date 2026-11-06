import axios from "axios"

const Func = {
  ago(dateString) {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "tanggal tidak tersedia"

    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return "baru saja"
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`
    return date.toLocaleDateString()
  }
}

const handler = async (m, { sock, text, reply }) => {
  const query = text?.trim()
  if (!query) return reply("Masukkan nama package yang ingin dicari.")

  try {
    const res = await axios.get(
      `https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(query)}`
    )

    const data = res.data
    if (!data.objects || data.objects.length === 0)
      return reply("Package tidak ditemukan. Coba kata kunci lain.")

    const results = data.objects.slice(0, 5).map(({ package: pkg }, index) => {
      const lines = [
        `${index + 1}. ${pkg.name}@${pkg.version}`,
        pkg.description ? `   ${pkg.description}` : null,
        pkg.publisher?.username ? `   Pembuat: ${pkg.publisher.username}` : null,
        pkg.date ? `   Diperbarui: ${Func.ago(pkg.date)}` : null,
        `   npm: https://www.npmjs.com/package/${encodeURIComponent(pkg.name)}`
      ]

      const repository = pkg.links?.repository
      if (repository) lines.push(`   Repository: ${repository}`)

      return lines.filter(Boolean).join("\n")
    })

    await reply(`Hasil pencarian NPM untuk "${query}"\n\n${results.join("\n\n")}`)
  } catch (err) {
    console.error("Error fetching npm package:", err)
    await reply("Terjadi kesalahan saat mencari package. Coba lagi nanti.")
  }
}

handler.command = ["npm", "npmjs", "package"]
export default handler