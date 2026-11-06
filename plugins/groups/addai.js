let handler = async (m, { sock, conn }) => {
   const client = sock || conn;

   try {
      const groupJid = m.chat;

      if (!groupJid.endsWith("@g.us")) {
         return m.reply("Command ini hanya untuk grup.");
      }

      await client.groupParticipantsUpdate(
         groupJid,
         ["867051314767696@bot"],
         "add"
      );

      await m.reply("Sukses add Meta AI ke grup ✅");
   } catch (e) {
      console.error(e);
      await m.reply(String(e?.stack || e));
   }
};

handler.help = ['addai'];
handler.tags = ['group'];
handler.command = ['addai']
handler.group = true;

export default handler;