import axios from "axios";

async function turboseek(question) {
  try {
    if (!question) throw new Error("Pertanyaan wajib diisi.");

    const inst = axios.create({
      baseURL: "https://www.turboseek.io/api",
      headers: {
        origin: "https://www.turboseek.io",
        referer: "https://www.turboseek.io/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36",
      },
    });

    const { data: sources } = await inst.post("/getSources", {
      question: question,
    });

    const { data: answer } = await inst.post("/getAnswer", {
      question: question,
      sources: sources,
    });

    // Bersihkan HTML
    const clean = answer
      .match(/<p>(.*?)<\/p>/gs)
      ?.map((match) =>
        match
          .replace(/<\/?p>/g, "")
          .replace(/<\/?strong>/g, "")
          .replace(/<\/?em>/g, "")
          .replace(/<\/?b>/g, "")
          .replace(/<\/?i>/g, "")
          .replace(/<\/?u>/g, "")
          .replace(/<\/?[^>]+>/g, "")
          .trim()
      )
      .join("\n\n") || answer.replace(/<\/?[^>]+>/g, "").trim();

    return {
      answer: clean,
      sources: sources.map((s) => s.url),
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

const handler = async (m, { sock, text, reply, command, usedPrefix }) => {
  try {

    if (!text)
      return reply(`${usedPrefix + command} pertanyaan?`);
    await sock.sendMessage(m.chat, { react: { text: "🔄", key: m.key } })
    const result = await turboseek(text);

    let msg = `${result.answer}`;

    reply(msg);
  } catch (err) {
    reply("⚠️ Error: " + err.message);
  }
};

handler.command = ["turboseek", "turbosek", "ts"];
export default handler;