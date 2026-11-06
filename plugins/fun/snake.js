import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import crypto from 'crypto'

const htmlPayload = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Trina Snake Classic</title>
<style>
:root{--shell:#17231d;--screen:#9bbc0f;--screen-dark:#306230;--screen-mid:#5b7f22;--ink:#0f380f;--line:#263b2a}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;background:transparent;font-family:monospace;color:var(--screen)}
body{padding:8px;touch-action:manipulation}
.shell{width:100%;max-width:360px;margin:auto;padding:10px;background:var(--shell);border:2px solid #304535;border-radius:14px;box-shadow:0 8px 18px rgba(0,0,0,.5)}
.header{display:flex;justify-content:space-between;align-items:center;padding:6px 8px;margin-bottom:7px;background:var(--screen);color:var(--ink);border:2px solid #0f380f;border-radius:5px;font-weight:900}
.title{font-size:13px}.score{font-size:11px}.screen{padding:6px;background:#0f380f;border-radius:5px}.board{display:grid;grid-template-columns:repeat(16,minmax(0,1fr));grid-template-rows:repeat(16,minmax(0,1fr));width:100%;aspect-ratio:1;background:var(--screen);border:2px solid var(--ink)}
.cell{min-width:0;min-height:0;background:var(--screen)}.cell.snake{background:var(--ink)}.cell.head{background:#071e07}.cell.food{background:var(--screen-mid);box-shadow:inset 0 0 0 1px var(--ink)}
.play-row{display:flex;align-items:center;justify-content:center;gap:10px}.status{min-height:22px;padding:6px 3px;text-align:center;color:var(--screen);font-size:10px;font-weight:700}.board-wrap{width:min(54vw,210px);flex:0 0 auto}.controls{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;width:130px;margin:0}.btn{min-height:34px;border:2px solid #38543d;border-radius:6px;background:#263b2a;color:var(--screen);font:900 15px monospace;cursor:pointer}.btn:active{background:var(--screen-mid);color:var(--ink)}.reset{display:block;width:100%;margin-top:7px;min-height:29px;font-size:10px}@media(max-width:300px){.play-row{gap:6px}.board-wrap{width:52vw}.controls{width:112px}.btn{min-height:30px}}
</style>
</head>
<body>
<main class="shell">
  <div class="header"><span class="title">TRINA SNAKE</span><span class="score">SCORE <b id="score">000</b></span></div>
  <div class="play-row"><div class="screen board-wrap"><div id="board" class="board"></div></div><div><div id="status" class="status">Tekan tombol untuk mulai</div><div class="controls">
    <span></span><button class="btn" id="up" type="button">▲</button><span></span>
    <button class="btn" id="left" type="button">◀</button><button class="btn" id="pause" type="button">II</button><button class="btn" id="right" type="button">▶</button>
    <span></span><button class="btn" id="down" type="button">▼</button><span></span>
  </div></div></div>
  <button class="btn reset" id="reset" type="button">RESET GAME</button>
</main>
<script>
(function(){
  const size=16;
  const boardEl=document.getElementById('board');
  const scoreEl=document.getElementById('score');
  const statusEl=document.getElementById('status');
  const cells=[];
  let snake,food,direction,nextDirection,score,timer,running,paused,gameOver;

  for(let i=0;i<size*size;i++){
    const cell=document.createElement('div');
    cell.className='cell';
    cells.push(cell);
    boardEl.appendChild(cell);
  }

  function reset(){
    clearInterval(timer);
    snake=[{x:8,y:8},{x:7,y:8},{x:6,y:8}];
    direction={x:1,y:0};
    nextDirection={x:1,y:0};
    food={x:11,y:8};
    score=0;
    running=false;
    paused=false;
    gameOver=false;
    scoreEl.textContent='000';
    statusEl.textContent='Tekan tombol untuk mulai';
    render();
  }

  function render(){
    cells.forEach(function(cell,index){
      const x=index%size;
      const y=Math.floor(index/size);
      cell.className='cell';
      if(food.x===x&&food.y===y) cell.classList.add('food');
      const part=snake.find(function(item){return item.x===x&&item.y===y});
      if(part){cell.classList.add('snake');if(part===snake[0])cell.classList.add('head')}
    });
  }

  function spawnFood(){
    do{food={x:Math.floor(Math.random()*size),y:Math.floor(Math.random()*size)}}while(snake.some(function(part){return part.x===food.x&&part.y===food.y}));
  }

  function setDirection(next){
    if(next.x+direction.x===0&&next.y+direction.y===0)return;
    nextDirection=next;
    if(!running&&!gameOver) start();
  }

  function start(){
    if(gameOver)reset();
    running=true;
    paused=false;
    statusEl.textContent='Gunakan tombol arah';
    clearInterval(timer);
    timer=setInterval(tick,150);
  }

  function tick(){
    if(!running||paused)return;
    direction=nextDirection;
    const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};
    const hitWall=head.x<0||head.y<0||head.x>=size||head.y>=size;
    const hitSelf=snake.some(function(part,index){return index>0&&part.x===head.x&&part.y===head.y});
    if(hitWall||hitSelf){
      running=false;gameOver=true;clearInterval(timer);statusEl.textContent='GAME OVER - tekan RESET';render();return;
    }
    snake.unshift(head);
    if(head.x===food.x&&head.y===food.y){score+=10;scoreEl.textContent=String(score).padStart(3,'0');spawnFood()}else snake.pop();
    render();
  }

  function togglePause(){
    if(gameOver||!running)return;
    paused=!paused;
    statusEl.textContent=paused?'PAUSE':'Gunakan tombol arah';
  }

  document.getElementById('up').onclick=function(){setDirection({x:0,y:-1})};
  document.getElementById('down').onclick=function(){setDirection({x:0,y:1})};
  document.getElementById('left').onclick=function(){setDirection({x:-1,y:0})};
  document.getElementById('right').onclick=function(){setDirection({x:1,y:0})};
  document.getElementById('pause').onclick=togglePause;
  document.getElementById('reset').onclick=reset;
  window.addEventListener('keydown',function(event){
    const moves={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};
    if(moves[event.key]){event.preventDefault();setDirection(moves[event.key])}
    if(event.key===' '){event.preventDefault();togglePause()}
  });
  reset();
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
                    submessages: [{ messageType: 2, messageText: '> Trina Snake Classic' }],
                    unifiedResponse: {
                        data: Buffer.from(JSON.stringify({
                            response_id: crypto.randomUUID(),
                            sections: [{
                                view_model: {
                                    primitive: {
                                        text: '> Trina Snake Classic',
                                        __typename: 'GenAIMarkdownTextUXPrimitive'
                                    },
                                    __typename: 'GenAISingleLayoutViewModel'
                                }
                            }],
                            embedded_screens: [{
                                title: 'Preview',
                                content: [{
                                    __typename: 'FOAIDNixelButtonSheets',
                                    tabs: [{
                                        id: 'tab_0',
                                        tab_header: 'Snake Classic',
                                        sections: [{
                                            __typename: 'GenAIUnifiedResponseSection',
                                            view_model: {
                                                __typename: 'GenAISingleLayoutViewModel',
                                                primitive: {
                                                    __typename: 'GenAIaeacdsnwHtmlPrimitive',
                                                    payload: htmlPayload,
                                                    url: 'https://nixel.dev',
                                                    trusted_sources: ['nixel.dev']
                                                }
                                            }
                                        }],
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
        console.error('Error send Snake HTML:', error)
        if (m.reply) m.reply('❌ Error: ' + error.message)
    }
}

export default Object.assign(handler, {
    help: ['snake', 'snakeclassic'],
    tags: ['game', 'fun'],
    command: ['snake', 'snakeclassic']
})
