import { spawn } from "child_process";

const handler = async (m, { sock, reply }) => {

  const restartServer = () => {
    const newProcess = spawn(process.argv[0], process.argv.slice(1), {
      detached: true,
      stdio: "inherit",
    });
    process.exit(0);
  };

  await reply(`\`\`\`[✓] Restarting bot . . .\`\`\``);
  setTimeout(() => restartServer(), 4500);
};

// Nama perintahnya
handler.command = ["rst", "restart"];
handler.owner = true

export default handler;