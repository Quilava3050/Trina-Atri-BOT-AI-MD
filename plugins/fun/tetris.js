import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import crypto from 'crypto'

const htmlPayload = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Trina Tetris</title>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;padding:8px;background:transparent;font-family:Arial,sans-serif;color:#fff;touch-action:manipulation}
.card{width:100%;max-width:360px;margin:auto;padding:10px;background:#111b21;border:1px solid #2a3942;border-radius:14px}
.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;color:#ffd166;font-weight:800;font-size:13px}.muted{font-size:10px;color:#aebac1}
.game-row{display:flex;align-items:center;justify-content:center;gap:9px}.grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));grid-template-rows:repeat(16,minmax(0,1fr));width:min(54vw,190px);aspect-ratio:10/16;gap:2px;padding:4px;background:#0b141a;border:2px solid #374248;border-radius:8px}.cell{min-width:0;min-height:0;background:#1f2c34;border-radius:2px}.filled{background:#00a884}
.side{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:76px}.side-label{font-size:10px;color:#aebac1;text-align:center}.button{width:64px;min-height:32px;border:0;border-radius:7px;background:#00a884;color:#061912;font-weight:900;font-size:14px;cursor:pointer}.button:active{background:#ffd166}.wide{width:100%;margin-top:8px;min-height:30px;font-size:11px;background:#1f2c34;color:#fff;border:1px solid #374248}.status{text-align:center;min-height:18px;margin-top:6px;font-size:10px;color:#aebac1}@media(max-width:300px){.game-row{gap:5px}.grid{width:50vw}.side{min-width:62px}.button{width:54px}}
</style>
</head>
<body>
<main class="card">
  <div class="head"><span>TRINA TETRIS</span><span class="muted">SCORE <b id="score">0</b></span></div>
  <div class="game-row">
    <div class="side"><span class="side-label">GERAK</span><button class="button" id="left" type="button">◀</button><button class="button" id="rotate" type="button">⟳</button></div>
    <div id="grid" class="grid"></div>
    <div class="side"><span class="side-label">GERAK</span><button class="button" id="right" type="button">▶</button><button class="button" id="down" type="button">▼</button></div>
  </div>
  <div id="status" class="status">Bentuk otomatis</div>
  <button class="button wide" id="resetButton" type="button">RESET GAME</button>
</main>
<script>
(function(){
  const width=10;
  const height=16;
  const grid=document.getElementById('grid');
  const scoreElement=document.getElementById('score');
  const statusElement=document.getElementById('status');
  const leftButton=document.getElementById('left');
  const rightButton=document.getElementById('right');
  const downButton=document.getElementById('down');
  const rotateButton=document.getElementById('rotate');
  const resetButton=document.getElementById('resetButton');
  const cells=[];
  const shapes=[
    {name:'lurus',matrix:[[1,1,1,1]]},
    {name:'kotak',matrix:[[1,1],[1,1]]},
    {name:'miring kanan',matrix:[[1,1,0],[0,1,1]]},
    {name:'miring kiri',matrix:[[0,1,1],[1,1,0]]},
    {name:'T',matrix:[[1,1,1],[0,1,0]]},
    {name:'L',matrix:[[1,0],[1,0],[1,1]]}
  ];
  let board=[];
  let piece=null;
  let pieceIndex=0;
  let pieceX=0;
  let pieceY=0;
  let score=0;
  let timer=null;
  let gameOver=false;

  for(let index=0;index<width*height;index++){
    const cell=document.createElement('div');
    cell.className='cell';
    cells.push(cell);
    grid.appendChild(cell);
  }

  function resetGame(){
    clearInterval(timer);
    board=Array.from({length:height},()=>Array(width).fill(0));
    score=0;
    gameOver=false;
    scoreElement.textContent='0';
    createPiece();
    statusElement.textContent='Bentuk otomatis: '+shapes[pieceIndex].name;
    render();
    timer=setInterval(()=>move(0,1),520);
  }

  function createPiece(){
    pieceIndex=Math.floor(Math.random()*shapes.length);
    piece=shapes[pieceIndex].matrix.map(row=>row.slice());
    pieceX=Math.floor((width-piece[0].length)/2);
    pieceY=0;
    if(collides(pieceX,pieceY,piece)){
      gameOver=true;
      clearInterval(timer);
      statusElement.textContent='GAME OVER - tekan RESET GAME';
    }
  }

  function collides(testX,testY,testPiece){
    return testPiece.some((row,rowIndex)=>row.some((value,columnIndex)=>value && (
      testX+columnIndex<0 || testX+columnIndex>=width || testY+rowIndex>=height ||
      (testY+rowIndex>=0 && board[testY+rowIndex][testX+columnIndex])
    )));
  }

  function render(){
    cells.forEach((cell,index)=>{
      const row=Math.floor(index/width);
      const column=index%width;
      cell.classList.toggle('filled',Boolean(board[row][column]));
    });
    if(!piece)return;
    piece.forEach((row,rowIndex)=>row.forEach((value,columnIndex)=>{
      const targetRow=pieceY+rowIndex;
      const targetColumn=pieceX+columnIndex;
      if(value && targetRow>=0 && targetRow<height && targetColumn>=0 && targetColumn<width){
        cells[targetRow*width+targetColumn].classList.add('filled');
      }
    }));
  }

  function move(deltaX,deltaY){
    if(gameOver)return;
    if(!collides(pieceX+deltaX,pieceY+deltaY,piece)){
      pieceX+=deltaX;
      pieceY+=deltaY;
    }else if(deltaY>0){
      lockPiece();
    }
    render();
  }

  function lockPiece(){
    piece.forEach((row,rowIndex)=>row.forEach((value,columnIndex)=>{
      if(value && pieceY+rowIndex>=0)board[pieceY+rowIndex][pieceX+columnIndex]=1;
    }));
    clearLines();
    createPiece();
  }

  function clearLines(){
    for(let row=height-1;row>=0;row--){
      if(board[row].every(Boolean)){
        board.splice(row,1);
        board.unshift(Array(width).fill(0));
        score+=100;
      }
    }
    scoreElement.textContent=String(score);
  }

  function rotatePiece(){
    if(gameOver)return;
    const rotated=piece[0].map((_,columnIndex)=>piece.map(row=>row[columnIndex]).reverse());
    if(!collides(pieceX,pieceY,rotated))piece=rotated;
    render();
  }

  leftButton.onclick=()=>move(-1,0);
  rightButton.onclick=()=>move(1,0);
  downButton.onclick=()=>move(0,1);
  rotateButton.onclick=rotatePiece;
  resetButton.onclick=resetGame;
  window.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft')move(-1,0);
    if(event.key==='ArrowRight')move(1,0);
    if(event.key==='ArrowDown')move(0,1);
    if(event.key==='ArrowUp')rotatePiece();
    if(event.key.toLowerCase()==='r')resetGame();
  });
  resetGame();
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
                    submessages: [{ messageType: 2, messageText: '> Trina Tetris' }],
                    unifiedResponse: {
                        data: Buffer.from(JSON.stringify({
                            response_id: crypto.randomUUID(),
                            sections: [{ view_model: { primitive: { text: '> Trina Tetris', __typename: 'GenAIMarkdownTextUXPrimitive' }, __typename: 'GenAISingleLayoutViewModel' } }],
                            embedded_screens: [{
                                title: 'Preview',
                                content: [{
                                    __typename: 'FOAIDNixelButtonSheets',
                                    tabs: [{
                                        id: 'tab_0',
                                        tab_header: 'Tetris',
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
        console.error('Error send Tetris HTML:', error)
        if (m.reply) m.reply('❌ Error: ' + error.message)
    }
}

export default Object.assign(handler, { help: ['tetris'], tags: ['game', 'fun'], command: ['tetris'] })
