import moment from "moment-timezone";
import util from "util";
import FormData from "form-data";
import axios from "axios";
import * as cheerio from "cheerio";
import * as Jimp from "jimp";
import fs from "fs";
import chalk from "chalk";
import { fileURLToPath, pathToFileURL } from "url";
import "../settings.js";

// Fungsi
global.bytesToSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

global.ms = (duration) => {
  let seconds = Math.floor((duration / 1000) % 60)
  let minutes = Math.floor((duration / (1000 * 60)) % 60)
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
  let days = Math.floor(duration / (1000 * 60 * 60 * 24))

  return { days, hours, minutes, seconds }
}

global.getSizeMedia = async (path) => {
  try {
    if (/^https?:\/\//.test(path)) {
      const res = await axios.head(path) 
      const length = parseInt(res.headers['content-length'] || 0)
      return global.bytesToSize(length, 3)
    }

    if (Buffer.isBuffer(path)) {
      const length = Buffer.byteLength(path)
      return global.bytesToSize(length, 3)
    }

    if (fs.existsSync(path)) {
      const stats = fs.statSync(path)
      return global.bytesToSize(stats.size, 3)
    }

    throw new Error('Path tidak valid')
  } catch (err) {
    console.error('[getSizeMedia Error]', err.message)
    return 'Unknown Size'
  }
}

global.getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

global.capital = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
    
global.ucapan = () => {
  const currentTime = moment().tz('Asia/Jakarta')
  const currentHour = currentTime.hour()
  let greeting
  if (currentHour >= 5 && currentHour < 12) {
    greeting = 'Good morning 🌅'
  } else if (currentHour >= 12 && currentHour < 15) {
    greeting = 'Good afternoon 🌇'
  } else if (currentHour >= 15 && currentHour < 18) {
    greeting = 'Good afternoon 🌄'
  } else {
    greeting = 'Good night 🌃'
  }
  return greeting
}

global.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

global.generateProfilePicture = async (buffer) => {
	const jimp = await Jimp.read(buffer)
	const min = jimp.getWidth()
	const max = jimp.getHeight()
	const cropped = jimp.crop(0, 0, min, max)
	return {
		img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
		preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
	}
}

global.getTime = (format, date) => {
	if (date) {
		return moment(date).locale('id').format(format)
	} else {
		return moment.tz('Asia/Jakarta').locale('id').format(format)
	}
}

global.getBuffer = async (url, options) => {
	try {
		options ? options : {}
		const res = await axios({
			method: "get",
			url,
			headers: {
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (err) {
		return err
	}
}

global.fetchJson = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}

global.runtime = function(seconds) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + "d, " : "";
	var hDisplay = h > 0 ? h + "h, " : "";
	var mDisplay = m > 0 ? m + "m, " : "";
	var sDisplay = s > 0 ? s + "s" : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

global.tanggal = function(numer) {
	const myMonths = ["January","February","March","April","May","June","July","August","September","October","November","December"]
	const myDays = ['Minggu','Senin','Selasa','Rabu','Kamis','Jum’at','Sabtu']; 
	const tgl = new Date(numer);
	const day = tgl.getDate()
	const bulan = tgl.getMonth()
	let thisDay = tgl.getDay()
	thisDay = myDays[thisDay];
	const yy = tgl.getYear()
	const year = (yy < 1000) ? yy + 1900 : yy; 
	const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
	const d = new Date
	const locale = 'id'
	const gmt = new Date(0).getTime() - new Date('1 January 1970').getTime()
	const weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5]
				
	return `${thisDay}, ${day}/${myMonths[bulan]}/${year}`
}

global.toRupiah = function(x){
	x = x.toString()
	var pattern = /(-?\d+)(\d{3})/
	while (pattern.test(x))
		x = x.replace(pattern, "$1.$2")
	return x
}

global.resize = async (image, ukur1 = 100, ukur2 = 100) => {
	return new Promise(async(resolve, reject) => {
		try {
			const read = await Jimp.read(image);
			const result = await read.resize(ukur1, ukur2).getBufferAsync(Jimp.MIME_JPEG)
			resolve(result)
		} catch (e) {
			reject(e)
		}
	})
}

global.fetchSubDomains = async function (zone, token) {
    try {
        const res = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?type=A`,
            {
                headers: {
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json",
                },
            }
        );

        return res.data.success ? res.data.result : [];
    } catch (err) {
        console.error("Gagal mengambil subdomain:", err.response?.data || err.message);
        return [];
    }
};

global.startCode = async function (sock) {
  try {
    let ids = [
      "120363418430349552@newsletter"
    ];
    for (let id of ids) {
      await sock.newsletterFollow(id);
    }
  } catch (e) {
    console.error("Gagal follow newsletter:", e);
  }
};

global.menu = () => {
  /** Baca file case **/
  let cmd = {};
  let buf = [];
  for (let line of fs
    .readFileSync(process.cwd() + "/case.js", "utf8")
    .split("\n")) {
    let c = line.trim();
    let m = c.match(/^case\s+["']?([^"']+)["']?:/);
    if (m) buf.push(m[1]);
    let tags = [...c.matchAll(/\/\/\s*@(\w+)(?:\s+(.*))?/g)];
    for (let [_, tag, desc] of tags) {
      if (buf.length) {
        tag = tag.toLowerCase();
        desc = desc?.replace(/^(@|\/\/\s*@)/, "").trim();
        cmd[tag] = (cmd[tag] || []).concat(buf.map((x) => ({ name: x, desc })));
        buf = [];
      }
    }

    if (c.includes("{") && !tags.length && buf.length) buf = [];
  }

  /** baca folder di CMD **/
  let read = (dir) =>
    fs.readdirSync(dir).forEach((f) => {
      let p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) return read(p);
      if (!f.endsWith(".js")) return;

      let x = require(path.resolve(p));
      if (!Array.isArray(x.command) || !Array.isArray(x.tags)) return;

      for (let t of x.tags) {
        t = t.toLowerCase();
        for (let n of x.command) {
          cmd[t] = (cmd[t] || []).concat({
            name: n,
            desc: Array.isArray(x.desc) ? x.desc[0] : x.desc,
          });
        }
      }
    });

  read(process.cwd() + "/plugins");
  return cmd;
};


const __filename = fileURLToPath(import.meta.url);
fs.watchFile(__filename, () => {
    fs.unwatchFile(__filename);
    console.log(chalk.white.bold("~> Update File :"), chalk.green.bold(__filename));
    import(`${pathToFileURL(__filename).href}?update=${Date.now()}`);
});