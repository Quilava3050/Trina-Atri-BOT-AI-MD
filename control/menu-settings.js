import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "setbot.json");

export const readMenuStyle = () => {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const style = Number(data?.menuStyle);
    return Number.isInteger(style) && style >= 1 && style <= 9 ? style : 1;
  } catch {
    return 1;
  }
};

export const writeMenuStyle = style => {
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {}

  data.menuStyle = style;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};