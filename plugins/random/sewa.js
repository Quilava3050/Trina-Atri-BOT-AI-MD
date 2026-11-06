const handler = async (m) => {
let tq =`*List Harga sewa bot 🍀*
- 1 Jam : Rp2.000
- 24 Jam : Rp3.000
- 7 Hari : Rp5.000
- 1 Bulan : Rp8.000
- Permanent : Rp20.000

*Benefit sewa bot ✨*
- Akses all fitur prem
- Grup lebih aman 
- Bebas pake bot
- dll

Want to Buy? *.owner*`
m.reply(tq)
}
handler.command = [
 "sewa"
] 
export default handler;