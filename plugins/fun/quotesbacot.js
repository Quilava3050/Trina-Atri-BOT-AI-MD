const handler = async (m, { sock, text, command, reply, example }) => {
 
 await sock.sendMessage(m.chat, { react: { text: '🔁', key: m.key } });
  let anu = `${pickRandom(global.sharedQuotes)}`;
  m.reply(anu);
};

handler.command = ["gombal","bacot"];
export default handler;

function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())];
}

global.sharedQuotes = [
'Kamu suka kopi nggak? Aku sih suka. Tau kenapa alesannya? Kopi itu ibarat kamu, pahit sih tapi bikin candu jadi pingin terus.',
'Gajian itu kayak mantan ya? Bisanya cuman lewat sebentar saja.',
'Kata pak haji, cowok yang nggak mau pergi Sholat Jumat disuruh pakai rok aja.',
'Kamu tahu mantan nggak? Mantan itu ibarat gajian, biasa numpang lewat dong di kehidupan kita.',
'Aku suka kamu, kamu suka dia, tapi dia sayangnya nggak ke kamu. Wkwkw lucu ya? Cinta serumit ini.',
'Google itu hebat ya? Tapi sayang sehebat-hebatnya Google nggak bisa menemukan jodoh kita.',
'Terlalu sering memegang pensil alis dapat membuat mata menjadi buta, jika dicolok-colokkan ke mata.',
'Saya bekerja keras karena sadar kalau uang nggak punya kaki buat jalan sendiri ke kantong saya.',
'Jika kamu tak mampu meyakinkan dan memukau orang dengan kepintaranmu, bingungkan dia dengan kebodohanmu.',
'Selelah-lelahnya bekerja, lebih lelah lagi kalau nganggur.',
'Kita hidup di masa kalau salah kena marah, pas bener dibilang tumben.',
'Nggak ada bahu pacar? Tenang aja, masih ada bahu jalan buat nyandar.',
'Mencintai dirimu itu wajar, yang gak wajar mencintai bapakmu.',
'Katanya enggak bisa bohong. Iyalah, mata kan cuma bisa melihat.',
'Madu di tangan kananmu, racun di tangan kirimu, jodoh tetap di tangan tuhan.',
'Selingkuh terjadi bukan karena ada niat, selingkuh terjadi karna pacar kamu masih laku.',
'Netizen kalau senam jempol di ponsel nggak pakai pendinginan, pantes komennya bikin panas terus.',
'Jodoh memang enggak kemana, tapi saingannya ada dimana-mana.',
'Perasaan aku salah terus di matamu. Kalu gitu, besok aku pindah ke hidungmu.',
'Jomblo tidak perlu malu, jomblo bukan berarti tidak laku, tapi memang tidak ada yang mau.',
'Jika doamu belum terkabul maka bersabar, ingatlah bahwa yang berdoa bukan cuma kamu!',
'Masih berharap dan terus berharap lama-lama aku jadi juara harapan.',
'Manusia boleh berencana, tapi akhirnya saldo juga yang menentukan.',
'Statusnya rohani, kelakuannya rohalus.',
'Kegagalan bukan suatu keberhasilan.',
'Tadi mau makan bakso, cuma kok panas banget, keliatannya baksonya lagi demam.',
'Aku juga pernah kaya, waktu gajian.',
'Aku diputusin sama pacar karena kita beda keyakinan. Aku yakin kalau aku ganteng, tapi dia enggak.',
'Masa depanmu tergantung pada mimpimu, maka perbanyaklah tidur.',
'Seberat apapun pekerjaanmu, akan semakin ringan jika tidak dibawa.',
'Jangan terlalu berharap! nanti jatuhnya sakit!',
'Ingat! Anda itu jomblo',
 'Kalau kamu pergi, tolong matiin lampu ya. Biar aku nggak berharap lagi.',
  'Katanya cinta itu buta, tapi kok kamu lihatnya ke dia terus?',
  'Kalau aku jadi kucing, mungkin aku udah punya sembilan kesempatan buat gagal move on.',
  'Jangan insecure, kamu itu bukan jelek… cuma kurang pencahayaan.',
  'Nunggu kepastian darimu itu kayak nunggu sinyal di gunung, ada sih… tapi ngilang muncul ngilang.',
  'Aku tuh sayang kamu, tapi kamu sayang kuota unlimited.',
  'Cinta itu sederhana, yang ribet tuh mantanmu.',
  'Aku bukan siapa-siapa, tapi kalau kamu mau, aku bisa jadi apa aja.',
  'Kalau sayang kok nyakitin? Oh iya, kamu kan bukan sayang. Kamu hobi.',
  'Dewasa itu mahal, makanya banyak yang pura-pura dewasa.',
  'Masalah datang silih berganti, tapi gajian tetap tanggal segitu-gitu aja.',
  'Aku kira kamu bercanda, ternyata aku yang jadi bahan candaan.',
  'Kamu bukan Google, tapi semua yang aku cari ada di kamu.',
  'Kalau dia serius, dia datang. Kalau enggak, ya cuma lewat.',
  'Hidup itu singkat, jangan dibuat ribet… kecuali kamu admin grup.',
  'Kamu itu kayak checkpoint game, ketemu kamu bikin lega.',
  'Orang sabar disayang Tuhan, tapi disakitin manusia.',
  'Rezeki boleh telat, tapi bahagia jangan.',
  'Aku sih suka jujur, tapi kalau jujur bikin kamu pergi, bohong dikit gapapa.',
  'Dia nggak hilang, cuma berpindah ke yang lebih mampu.',
  'Yang penting itu bukan cantik atau ganteng, tapi kuat-kuatin mental.',
  'Jangan bilang kamu cinta kalau chat aja dua kali sehari.',
  'Kamu tuh bukan nggak bisa move on, kamu cuma males kenalan sama yang baru.',
  'Capek jadi orang baik, tapi takut jadi orang jahat. Jadinya diem aja.',
  'Senangnya jadi kamu, ya? Hidup di hati orang banyak.',
  'Kalau rindu jangan ditahan, nanti meledak.',
  'Cinta itu butuh perjuangan, tapi kalau kamu yang berjuang sendiri namanya bukan cinta.',
  'Plis lah, jangan ghosting. Hantu aja pamit kalau mau ngilang.',
  'Aku tuh sayang kamu, tapi dompetku nggak dukung.',
  'Yang jauh dirinduin, yang dekat dicuekin. Konsisten banget.',
  'Semua terlihat mudah sebelum dicoba, dan terlihat susah setelah menyerah.',
  'Mantan itu bukan untuk dibenci, tapi untuk dijadikan pelajaran.',
  'Jangan iri sama hidup orang lain, mereka juga belum tentu bahagia.',
  'Kalau kamu capek, sini istirahat di bahu jalan.',
  'Jangan merasa paling benar, karena yang paling benar itu Google.',
  'Aku sering salah paham, tapi jarang disalahpahamkan balikan.',
  'Kalau kamu bahagia, aku ikut senang. Kalau kamu sedih, aku ikut sedih. Kalau kamu hilang, aku lapor.',
  'Senyummu manis, tapi attitude-mu pahit.',
  'Maaf aku cuek, bukan sombong… cuma hemat energi.',
  'Jangan terlalu baik, nanti disangka modus.',
  'Nggak semua yang hilang harus dicari… contohnya mantan.'
]