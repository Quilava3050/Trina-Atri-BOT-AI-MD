import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import crypto from 'crypto'

const htmlPayload = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Trina Piano</title>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}body{margin:0;padding:10px;background:transparent;font-family:Arial,sans-serif;color:#fff;touch-action:manipulation}.card{width:100%;max-width:380px;margin:auto;padding:14px;background:#111b21;border:1px solid #2a3942;border-radius:16px}.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.title{font-size:17px;font-weight:800;color:#ffd166}.sub{font-size:11px;color:#aebac1}.piano{display:flex;justify-content:center;gap:2px;height:150px;padding:8px;background:#0b141a;border:1px solid #374248;border-radius:10px}.key{position:relative;flex:1;min-width:0;border:1px solid #8d99ae;border-radius:0 0 7px 7px;background:#f8fafc;color:#111;font-size:11px;font-weight:800;cursor:pointer;box-shadow:0 4px 0 #94a3b8}.key:active,.key.active{background:#ffd166;transform:translateY(3px);box-shadow:0 1px 0 #b08900}.black{height:88px;margin:0 -8px;z-index:2;flex:0 0 20px;background:#111827;color:#fff;border:1px solid #000;border-radius:0 0 5px 5px;box-shadow:0 4px 0 #000}.controls{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px}.button{border:0;border-radius:8px;padding:9px 6px;background:#00a884;color:#061912;font-weight:800;cursor:pointer}.button:active{background:#ffd166}.status{min-height:18px;margin-top:10px;text-align:center;color:#aebac1;font-size:11px}.range{width:100%;accent-color:#00a884;margin-top:8px}
</style>
</head>
<body>
<main class="card">
  <div class="head"><div><div class="title">TRINA PIANO</div><div class="sub">Offline sound test</div></div><div id="freqText" class="sub">440 Hz</div></div>
    <div class="piano" id="piano"><button class="key" data-freq="261.63">Do</button><button class="key black" data-freq="277.18">Do#</button><button class="key" data-freq="293.66">Re</button><button class="key black" data-freq="311.13">Re#</button><button class="key" data-freq="329.63">Mi</button><button class="key" data-freq="349.23">Fa</button><button class="key black" data-freq="369.99">Fa#</button><button class="key" data-freq="392">Sol</button><button class="key black" data-freq="415.30">Sol#</button><button class="key" data-freq="440">La</button><button class="key black" data-freq="466.16">La#</button><button class="key" data-freq="493.88">Si</button><button class="key" data-freq="523.25">Do</button></div>
  <input class="range" id="freq" type="range" min="100" max="2000" value="440">
  <div class="controls"><button class="button" id="beep">BEEP</button><button class="button" id="melody">MELODY</button><button class="button" id="reset">RESET</button></div>
  <div id="status" class="status">Tekan tuts atau tombol untuk mulai</div>
</main>
<script>
(function(){
  let audioContext=null;
  const status=document.getElementById('status');
  const freq=document.getElementById('freq');
  const freqText=document.getElementById('freqText');
  function getAudio(){
    if(!audioContext)audioContext=new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume();
    return audioContext;
  }
  function playTone(value,duration=.35,type='sine'){
    const context=getAudio();
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    const delay=context.createDelay(1);
    const feedback=context.createGain();
    const echoGain=context.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(value,context.currentTime);
    gain.gain.setValueAtTime(.0001,context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.58,context.currentTime+.02);
    gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+duration);
    delay.delayTime.value=.18;
    feedback.gain.value=.28;
    echoGain.gain.value=.32;
    oscillator.connect(gain);
    gain.connect(context.destination);
    gain.connect(delay);
    delay.connect(echoGain);
    echoGain.connect(context.destination);
    delay.connect(feedback);
    feedback.connect(delay);
    oscillator.start();
    oscillator.stop(context.currentTime+duration+.05);
    status.textContent='Playing '+Math.round(value)+' Hz';
  }
  function playKey(key){
    key.classList.add('active');
    playTone(Number(key.dataset.freq),.4,'sine');
    setTimeout(()=>key.classList.remove('active'),180);
  }
  document.querySelectorAll('.key').forEach(key=>{key.addEventListener('pointerdown',()=>playKey(key))});
  freq.oninput=()=>{freqText.textContent=freq.value+' Hz'};
  freq.onchange=()=>playTone(Number(freq.value),.4,'sine');
  document.getElementById('beep').onclick=()=>playTone(440,.5,'sine');
  document.getElementById('reset').onclick=()=>{freq.value=440;freqText.textContent='440 Hz';status.textContent='Tekan tuts atau tombol untuk mulai'};
  document.getElementById('melody').onclick=async()=>{const notes=[261.63,329.63,392,523.25,392,329.63,261.63];status.textContent='Playing melody...';for(const note of notes){playTone(note,.22,'sine');await new Promise(resolve=>setTimeout(resolve,260))}status.textContent='Melody selesai'};
})();
</script>
</body>
</html>`

const handler = async (m, { sock, conn }) => {
    const client = sock || conn || global.conn
    const slots = {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [{ messageType: 2, messageText: '> Trina Piano' }],
                    unifiedResponse: {
                        data: Buffer.from(JSON.stringify({
                            response_id: crypto.randomUUID(),
                            sections: [{ view_model: { primitive: { text: '> Trina Piano', __typename: 'GenAIMarkdownTextUXPrimitive' }, __typename: 'GenAISingleLayoutViewModel' } }],
                            embedded_screens: [{
                                title: 'Preview',
                                content: [{
                                    __typename: 'FOAIDNixelButtonSheets',
                                    tabs: [{
                                        id: 'tab_0',
                                        tab_header: 'Piano',
                                        sections: [{ __typename: 'GenAIUnifiedResponseSection', view_model: { __typename: 'GenAISingleLayoutViewModel', primitive: { __typename: 'GenAIaeacdsnwHtmlPrimitive', payload: htmlPayload, url: 'https://trina.local', trusted_sources: ['trina.local'] } } }],
                                        step_entries: []
                                    }]
                                }]
                            }]
                        })).toString('base64')
                    },
                    contextInfo: { isForwarded: true, forwardOrigin: 4 }
                }
            }
        }
    }
    try {
        const msg = generateWAMessageFromContent(m.chat, slots, { quoted: m })
        await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    } catch (error) {
        console.error('Error send Piano HTML:', error)
        if (m.reply) m.reply('❌ Error: ' + error.message)
    }
}

export default Object.assign(handler, { help: ['piano', 'soundtest'], tags: ['game', 'fun'], command: ['piano', 'soundtest'] })
