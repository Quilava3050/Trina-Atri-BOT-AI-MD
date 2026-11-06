import fs from 'fs';
import path from 'path';
import axios from "axios";

const sentSholat = {}; 
let cachedJadwal = null; 
let lastFetchDate = "";  

const getDateParams = () => {
    const date = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return { yyyy, mm, dd, dateObj: date };
}

const getAutoSholatGroups = () => {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'database.json'), 'utf-8'));
    return Promise.resolve(
        Object.values(data.groups).filter(g => g.autosholat === 1).map(g => g.id)
    );
};

const getJadwalHarian = async () => {
    const { yyyy, mm, dd } = getDateParams();
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    if (cachedJadwal && lastFetchDate === todayStr) {
        return cachedJadwal;
    }

    try {
        const cityId = '1301'; 
        const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${yyyy}/${mm}/${dd}`;
        
        // console.log(`📡 Fetching MyQuran: ${url}`);
        const response = await axios.get(url);
        const data = response.data;

        if (!data.status || !data.data || !data.data.jadwal) {
            throw new Error("Format API berubah atau data kosong");
        }

        const rawJadwal = data.data.jadwal;

        const jadwal = {
            Subuh: rawJadwal.subuh,
            Dzuhur: rawJadwal.dzuhur,
            Ashar: rawJadwal.ashar,
            Maghrib: rawJadwal.maghrib,
            Isya: rawJadwal.isya
        };

        cachedJadwal = jadwal;
        lastFetchDate = todayStr;
        
        Object.keys(sentSholat).forEach(key => {
            if (!key.includes(todayStr)) delete sentSholat[key];
        });
        
        return jadwal;

    } catch (e) {
        console.error("❌ Gagal fetch jadwal MyQuran:", e.message);
        return null; 
    }
};

export async function startAutoSholat(sock) {
  setInterval(async () => {
    try {
      const { dateObj, yyyy, mm, dd } = getDateParams();
      const hours = dateObj.getHours().toString().padStart(2, "0");
      const minutes = dateObj.getMinutes().toString().padStart(2, "0");
      const timeNow = `${hours}:${minutes}`; 
      const jadwalSholat = await getJadwalHarian();
      if (!jadwalSholat) return; 
      for (const [sholat, waktu] of Object.entries(jadwalSholat)) {
        const waktuBersih = waktu.trim(); 
        if (timeNow === waktuBersih) {
          const activeGroups = await getAutoSholatGroups();
          if (activeGroups.length === 0) return;

          const todayStr = `${yyyy}-${mm}-${dd}`;

          for (const groupId of activeGroups) {
            const key = `${sholat}_${groupId}_${todayStr}`;

            if (sentSholat[key]) continue; 
            if (!sock?.user) continue
            
            const qtext = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net" },
                message: { extendedTextMessage: { text: `Hello everyone 👋` } }
            };

            const caption = `*Waktu Sholat Tiba!* 🕌
            
- Tepat pada 🕑 Pukul *${waktuBersih} WIB*
- 💬 Waktu Sholat *${sholat}* telah tiba untuk 
wilayah *Jakarta & Sekitarnya*

_"Dirikanlah shalat dari sesudah matahari tergelincir sampai gelap malam dan (dirikanlah pula shalat) subuh."_
(QS. Al-Isra: 78)

> Segera tunaikan ibadah sholat bagi yang muslim`;

            // Kirim Pesan
        const ownerNum = (Array.isArray(global.owner) && global.owner[0]) 
           ? global.owner[0].replace(/[^0-9]/g, '') 
           : '6282113148932';

        const qsholat = {
           key: { 
              remoteJid: "status@broadcast", 
              participant: `${ownerNum}@s.whatsapp.net`
           },
           message: { 
              extendedTextMessage: { 
                 text: `Sholat Dulu Bagi Yang Muslim| Waktu ${sholat.toUpperCase()} Telah Tiba` 
              } 
           }
        };

        await sock.sendMessage(
           groupId,
           { text: caption },
           { quoted: qsholat }
        );

            // Tandai sudah terkirim
            sentSholat[key] = true;
          }
        }
      }
    } catch (err) {
      console.error("Error Auto Sholat Loop:", err);
    }
  }, 60_000); 
}