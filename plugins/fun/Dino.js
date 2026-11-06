import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import crypto from 'crypto';

let handler = async (m, { sock, conn }) => {
    const client = sock || conn || global.conn;

    const htmlPayload = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #0f0f19; font-family: Arial, sans-serif; color: #eee; touch-action: manipulation; }
  .container { width: 100%; max-width: 620px; margin: auto; padding: 12px; }
  .card { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.15); border-radius: 16px; overflow: hidden; }
  .header { padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,.12); display: flex; justify-content: space-between; align-items: center; }
  .title-sub { font-size: 10px; letter-spacing: 1.5px; color: rgba(255,255,255,.45); }
  .title-main { font-size: 18px; font-weight: bold; color: #fff; }
  .score { font-size: 16px; font-weight: bold; color: #fff; text-shadow: 0 0 10px rgba(108,92,231,.85); }
  .best { font-size: 10px; color: rgba(255,255,255,.4); text-align: right; margin-top: 2px; }
  .canvas-container { padding: 14px; }
  canvas { width: 100%; height: auto; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; display: block; }
  .status { text-align: center; margin-top: 8px; font-size: 11px; color: rgba(255,255,255,.55); }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="header">
      <div>
        <div class="title-sub">TRINA DINO</div>
        <div class="title-main">Dino Runner</div>
      </div>
      <div>
        <div id="score" class="score">00000</div>
        <div id="best" class="best">BEST 00000</div>
      </div>
    </div>
    <div class="canvas-container">
      <canvas id="game" width="560" height="190"></canvas>
      <div id="status" class="status">Speed 5.0x</div>
    </div>
  </div>
</div>
<script>
  const c = document.getElementById('game'), x = c.getContext('2d');
  const scoreEl = document.getElementById('score'), bestEl = document.getElementById('best'), statusEl = document.getElementById('status');
  const GY = 170;
  let d, o, clouds, particles, ambient, trail, score, best = 0, speed, gameOver, last, shake, flash, runT, spawnTimer, milestone, squash;

  function loadBest() {
    try { return parseInt(localStorage.getItem('dino_best') || '0', 10); } catch(e) { return 0; }
  }
  function saveBest(v) {
    try { localStorage.setItem('dino_best', String(Math.floor(v))); } catch(e) {}
  }

  best = loadBest();

  function reset() {
    d = { x: 55, y: 132, w: 34, h: 38, vy: 0, jumping: false };
    o = [];
    clouds = [{x:120,y:32,w:44,s:.35},{x:300,y:52,w:60,s:.22},{x:460,y:26,w:36,s:.4},{x:560,y:70,w:50,s:.18}];
    particles = []; trail = [];
    if (!ambient) {
      ambient = [];
      for (let i = 0; i < 18; i++) ambient.push({ x: Math.random()*c.width, y: Math.random()*c.height, r: .5+Math.random()*1.5, vx: .1+Math.random()*.3, ph: Math.random()*10 });
    }
    score = 0; speed = 5; gameOver = false; last = 0; shake = 0; flash = 0; runT = 0; milestone = 0; squash = 1;
    spawnTimer = 62 + Math.random() * 32;
    bestEl.textContent = 'BEST ' + String(Math.floor(best)).padStart(5, '0');
    statusEl.textContent = 'Speed 5.0x';
  }

  function burst(px, py, n, col, spd) {
    for (let i = 0; i < n; i++) particles.push({ x: px, y: py, vx: (Math.random()-.5)*spd, vy: -Math.random()*spd, life: 1, col, size: 2+Math.random()*2 });
  }

  function jumpDino() {
    if (gameOver) { reset(); return; }
    if (!d.jumping) { d.jumping = true; d.vy = -13.5; squash = .9; burst(d.x+16, d.y+34, 10, '255,255,255', 4); }
  }

  function cactus() {
    const type = Math.random();
    const startX = c.width + 20;
    if (type < .24) {
      o.push({ x: startX, y: GY - 24, w: 42, h: 24, kind: 'double' });
    } else if (type < .48) {
      o.push({ x: startX, y: GY - 42, w: 20, h: 42, kind: 'tall' });
    } else if (type < .68) {
      o.push({ x: startX, y: GY - 27, w: 18, h: 27, kind: 'cactus' });
      o.push({ x: startX + 29, y: GY - 21, w: 16, h: 21, kind: 'cactus' });
    } else if (type < .84 && score > 35) {
      o.push({ x: startX, y: 116, w: 30, h: 14, kind: 'bird', flap: 0 });
    } else {
      const h = 24 + Math.random() * 24;
      o.push({ x: startX, y: GY - h, w: 16 + Math.random() * 6, h, kind: 'cactus' });
    }
  }

  function hit(a, b) {
    return a.x + 4 < b.x + b.w && a.x + a.w - 4 > b.x && a.y + 4 < b.y + b.h && a.y + a.h > b.y;
  }

  function drawDino() {
    x.save();
    let cx = d.x + 16, cy = d.y + 34;
    x.translate(cx, cy); x.scale(1, squash); x.translate(-cx, -cy);
    const legOff = d.jumping ? 0 : Math.sin(runT * .5) * 4;
    x.fillStyle = '#eaeaea';
    x.beginPath();
    x.moveTo(d.x + 2, d.y + 18); x.lineTo(d.x - 10, d.y + 12); x.lineTo(d.x + 3, d.y + 10);
    x.lineTo(d.x + 9, d.y + 3); x.lineTo(d.x + 25, d.y + 3); x.lineTo(d.x + 29, d.y + 8);
    x.lineTo(d.x + 35, d.y + 8); x.lineTo(d.x + 35, d.y + 22); x.lineTo(d.x + 27, d.y + 22);
    x.lineTo(d.x + 25, d.y + 34); x.lineTo(d.x + 18, d.y + 34); x.lineTo(d.x + 16, d.y + 25);
    x.lineTo(d.x + 10, d.y + 25); x.lineTo(d.x + 8, d.y + 36); x.lineTo(d.x + 1, d.y + 36);
    x.closePath(); x.fill();
    x.fillStyle = '#6c5ce7';
    x.fillRect(d.x + 28, d.y + 11, 4, 4);
    x.fillStyle = '#0f0f19';
    x.fillRect(d.x + 28, d.y + 10, 3, 3);
    x.strokeStyle = '#eaeaea'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(d.x + 12, d.y + 24); x.lineTo(d.x + 5, d.y + 29 + legOff); x.stroke();
    x.beginPath(); x.moveTo(d.x + 22, d.y + 24); x.lineTo(d.x + 29, d.y + 29 - legOff); x.stroke();
    x.restore();
  }

  function drawCactus(q) {
    x.save();
    if (q.kind === 'bird') {
      q.flap += .18;
      x.fillStyle = '#f2a65a';
      x.fillRect(q.x + 6, q.y + 4, 19, 8);
      x.fillRect(q.x + 22, q.y + 1, 8, 9);
      x.fillStyle = '#0f0f19'; x.fillRect(q.x + 25, q.y + 3, 2, 2);
      x.strokeStyle = '#f2a65a'; x.lineWidth = 3;
      const wing = Math.sin(q.flap) * 5;
      x.beginPath(); x.moveTo(q.x + 13, q.y + 6); x.lineTo(q.x + 6, q.y + 1 + wing); x.stroke();
      x.beginPath(); x.moveTo(q.x + 16, q.y + 11); x.lineTo(q.x + 10, q.y + 15 - wing); x.stroke();
    } else {
      x.fillStyle = q.kind === 'tall' ? '#c95f72' : '#e17a7a';
      x.fillRect(q.x + (q.kind === 'double' ? 8 : 0), q.y, q.w - (q.kind === 'double' ? 16 : 0), q.h);
      if (q.kind === 'double') {
        x.fillRect(q.x, q.y + 8, 12, q.h - 8);
        x.fillRect(q.x + q.w - 12, q.y + 4, 12, q.h - 4);
      } else {
        x.fillRect(q.x - 5, q.y + q.h * .45, 7, 5);
        x.fillRect(q.x + q.w - 2, q.y + q.h * .28, 7, 5);
      }
    }
    x.restore();
  }

  function draw() {
    x.clearRect(0, 0, c.width, c.height);
    x.save();
    if (shake > 0) x.translate((Math.random()-.5)*shake, (Math.random()-.5)*shake);
    
    x.strokeStyle = 'rgba(255,255,255,.25)';
    x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, GY); x.lineTo(c.width, GY); x.stroke();
    
    drawDino();
    o.forEach(drawCactus);
    
    if (gameOver) {
      x.fillStyle = 'rgba(15,15,25,.75)'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#fff'; x.textAlign = 'center';
      x.font = 'bold 20px Arial'; x.fillText('GAME OVER', c.width/2, 85);
      x.font = '12px Arial'; x.fillText('Tap layar untuk main lagi', c.width/2, 110);
    }
    x.restore();
  }

  function loop(t) {
    if (!last) last = t;
    let dt = Math.min((t - last) / 16.67, 2);
    last = t; runT += dt;
    if (!gameOver) {
      d.y += d.vy * dt; d.vy += .75 * dt;
      if (d.y >= 132) { d.y = 132; d.vy = 0; d.jumping = false; squash = 1.05; }
      squash += (1 - squash) * Math.min(1, .18 * dt);
      
      spawnTimer -= dt;
      if (spawnTimer <= 0) { cactus(); spawnTimer = Math.max(42, 76 - speed * 1.6) + Math.random() * 34; }
      
      o.forEach(q => q.x -= speed * dt);
      o = o.filter(q => q.x > -40);
      
      speed = Math.min(11, speed + .0018 * dt);
      score += dt * .6;
      if (score > best) best = score;
      
      scoreEl.textContent = String(Math.floor(score)).padStart(5, '0');
      bestEl.textContent = 'BEST ' + String(Math.floor(best)).padStart(5, '0');
      statusEl.textContent = 'Speed ' + speed.toFixed(1) + 'x';
      
      for (const q of o) {
        if (hit(d, q)) {
          gameOver = true; shake = 10;
          saveBest(best);
        }
      }
    }
    if (shake > 0) shake = Math.max(0, shake - .6 * dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('pointerdown', jumpDino);
  window.addEventListener('keydown', e => { if (e.code === 'Space') jumpDino(); });
  reset();
  requestAnimationFrame(loop);
<\/script>
</body>
</html>`;

    const slots = {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        {
                            messageType: 2,
                            messageText: '> Dino Runner Game'
                        }
                    ],
                    unifiedResponse: {
                        data: Buffer.from(
                            JSON.stringify({
                                response_id: crypto.randomUUID(),
                                sections: [
                                    {
                                        view_model: {
                                            primitive: {
                                                text: '> Dino Runner Game',
                                                __typename: 'GenAIMarkdownTextUXPrimitive'
                                            },
                                            __typename: 'GenAISingleLayoutViewModel'
                                        }
                                    }
                                ],
                                embedded_screens: [
                                    {
                                        title: 'Preview',
                                        content: [
                                            {
                                                __typename: 'FOAIDNixelButtonSheets',
                                                tabs: [
                                                    {
                                                        id: 'tab_0',
                                                        tab_header: 'Dino Runner',
                                                        sections: [
                                                            {
                                                                __typename: 'GenAIUnifiedResponseSection',
                                                                view_model: {
                                                                    __typename: 'GenAISingleLayoutViewModel',
                                                                    primitive: {
                                                                        __typename: 'GenAIaeacdsnwHtmlPrimitive',
                                                                        payload: htmlPayload,
                                                                        url: 'https://trina.local',
                                                                        trusted_sources: ['trina.local']
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                        step_entries: []
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            })
                        ).toString('base64')
                    },
                    contextInfo: { isForwarded: true, forwardOrigin: 4 }
                }
            }
        }
    };

    try {
        const msg = generateWAMessageFromContent(m.chat, slots, { quoted: m });
        await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    } catch (e) {
        if (m.reply) m.reply('❌ Error: ' + e.message);
    }
};

export default Object.assign(handler, {
    help: ['dino', 'dinorunner'],
    tags: ['game', 'fun'],
    command: ['dino', 'dinorunner']
});
