import crypto from 'crypto';

const htmlPayload = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Trina Minesweeper</title>
<style>
:root{color-scheme:dark;--bg:#0b141a;--panel:#111b21;--cell:#263640;--cell-open:#18252c;--line:#37474f;--ink:#e9edef;--muted:#aebac1;--accent:#00a884;--gold:#ffd166;--red:#ff6b6b}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{width:100%;min-height:100%;margin:0;overflow-x:hidden}
body{min-height:100vh;min-height:100dvh;padding:env(safe-area-inset-top, 0px) 12px env(safe-area-inset-bottom, 0px);background:transparent;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.game{display:flex;flex-direction:column;width:100%;max-width:760px;min-height:100vh;min-height:100dvh;margin:0 auto;padding:10px 0}
.top{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 2px 12px;border-bottom:1px solid var(--line)}
.title{font-size:20px;font-weight:800;color:var(--gold)}
.subtitle{font-size:11px;color:var(--muted);margin-top:3px}
.stats{display:flex;gap:8px}
.stat{min-width:58px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--panel);text-align:center}
.stat-label{font-size:9px;color:var(--muted);letter-spacing:.06em}
.stat-value{font-size:16px;font-weight:800;font-variant-numeric:tabular-nums}
.controls{display:flex;gap:7px;margin:12px 0 8px}
select,.control{min-height:36px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink);font:inherit;font-size:12px}
select{flex:1;min-width:0}
.control{cursor:pointer;font-weight:700}
.control.primary{background:var(--accent);border-color:var(--accent);color:#06251e}
.control.active{background:var(--gold);border-color:var(--gold);color:#302200}
.status{min-height:34px;padding:8px 10px;margin-bottom:9px;border-radius:8px;background:var(--panel);color:var(--muted);font-size:12px;text-align:center}
.status.good{color:#58e0b5}.status.bad{color:#ff8c8c}
.board-wrap{flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:flex-start;overflow:auto;padding:8px 0;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.board{display:grid;flex:none;gap:2px;width:max-content;min-width:0;margin:auto;padding:4px;border:1px solid var(--line);border-radius:9px;background:#0d171d;touch-action:manipulation}
.cell{width:var(--cell-size,30px);height:var(--cell-size,30px);padding:0;border:1px solid #3a4b54;border-radius:4px;background:linear-gradient(145deg,#31434d,#24343d);color:var(--ink);font-size:clamp(10px,calc(var(--cell-size,30px)*.48),17px);font-weight:900;cursor:pointer;line-height:1}
.cell:active{filter:brightness(1.25)}
.cell.open{border-color:#263740;background:var(--cell-open);cursor:default}
.cell.flag{color:var(--gold)}
.cell.mine-hit{border-color:var(--red);background:#692c32}
.cell:disabled{opacity:1}
.n1{color:#69b7ff}.n2{color:#58d68d}.n3{color:#ff7777}.n4{color:#b69cff}.n5{color:#ffad66}.n6{color:#65d9d1}.n7{color:#e9edef}.n8{color:#9aa7ae}
.help{margin:3px 2px 0;color:var(--muted);font-size:11px;line-height:1.55}
.help b{color:var(--ink)}
@media(max-width:380px){body{padding-right:8px;padding-left:8px}.game{padding-top:8px;padding-bottom:8px}.title{font-size:17px}.stats{gap:5px}.stat{min-width:49px;padding:5px}.controls{gap:5px}.control{padding:0 7px;font-size:11px}.help{font-size:10px}}
</style>
</head>
<body>
<main class="game">
  <header class="top">
    <div><div class="title">💣 MINESWEEPER</div><div class="subtitle">Buka semua kotak aman, hindari ranjau!</div></div>
    <div class="stats">
      <div class="stat"><div class="stat-label">RANJAU</div><div id="mineCount" class="stat-value">010</div></div>
      <div class="stat"><div class="stat-label">WAKTU</div><div id="timer" class="stat-value">000</div></div>
    </div>
  </header>
  <div class="controls">
    <select id="level" aria-label="Pilih level">
      <option value="beginner">Pemula · 9×9 · 10 ranjau</option>
      <option value="intermediate">Menengah · 16×16 · 40 ranjau</option>
      <option value="expert">Ahli · 30×16 · 99 ranjau</option>
    </select>
    <button id="flagMode" class="control" type="button" aria-pressed="false">⚑ Tandai</button>
    <button id="reset" class="control primary" type="button">🙂 Baru</button>
  </div>
  <div id="status" class="status" role="status">Pilih kotak untuk mulai. Klik kanan atau aktifkan Tandai untuk memasang bendera.</div>
  <div class="board-wrap"><div id="board" class="board" role="grid" aria-label="Papan Minesweeper"></div></div>
  <p class="help"><b>Aturan:</b> Angka menunjukkan jumlah ranjau di 8 kotak sekitarnya. Buka semua kotak aman untuk menang. Kotak pertama dijamin aman. Di ponsel, aktifkan <b>⚑ Tandai</b> untuk memasang atau melepas bendera.</p>
</main>
<script>
(function(){
  var levels={
    beginner:{rows:9,cols:9,mines:10},
    intermediate:{rows:16,cols:16,mines:40},
    expert:{rows:16,cols:30,mines:99}
  };
  var boardElement=document.getElementById('board');
  var levelElement=document.getElementById('level');
  var mineCountElement=document.getElementById('mineCount');
  var timerElement=document.getElementById('timer');
  var statusElement=document.getElementById('status');
  var flagModeButton=document.getElementById('flagMode');
  var resetButton=document.getElementById('reset');
  var state;

  function formatCount(value){
    if(value<0)return '-'+('00'+Math.abs(value)).slice(-2);
    var text=String(value);
    return text.length<3?('000'+text).slice(-3):text;
  }

  function startGame(){
    if(state&&state.timerId)clearInterval(state.timerId);
    var config=levels[levelElement.value];
    state={
      rows:config.rows,
      cols:config.cols,
      mines:config.mines,
      cells:[],
      flags:0,
      opened:0,
      started:false,
      ended:false,
      flagMode:false,
      seconds:0,
      timerId:null
    };
    for(var row=0;row<state.rows;row++){
      var line=[];
      for(var col=0;col<state.cols;col++)line.push({mine:false,opened:false,flagged:false,count:0});
      state.cells.push(line);
    }
    mineCountElement.textContent=formatCount(state.mines);
    timerElement.textContent='000';
    resetButton.textContent='🙂 Baru';
    statusElement.className='status';
    statusElement.textContent='Pilih kotak untuk mulai. Klik kanan atau aktifkan Tandai untuk memasang bendera.';
    flagModeButton.classList.remove('active');
    flagModeButton.setAttribute('aria-pressed','false');
    state.flagMode=false;
    render();
  }

  function placeMines(safeRow,safeCol){
    var candidates=[];
    for(var row=0;row<state.rows;row++){
      for(var col=0;col<state.cols;col++){
        if(Math.abs(row-safeRow)<=1&&Math.abs(col-safeCol)<=1)continue;
        candidates.push({row:row,col:col});
      }
    }
    for(var i=candidates.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1));
      var temp=candidates[i];candidates[i]=candidates[j];candidates[j]=temp;
    }
    for(var mineIndex=0;mineIndex<state.mines;mineIndex++){
      var spot=candidates[mineIndex];
      state.cells[spot.row][spot.col].mine=true;
    }
    for(var r=0;r<state.rows;r++){
      for(var c=0;c<state.cols;c++){
        if(state.cells[r][c].mine)continue;
        var count=0;
        for(var dr=-1;dr<=1;dr++){
          for(var dc=-1;dc<=1;dc++){
            var nr=r+dr,nc=c+dc;
            if(nr>=0&&nr<state.rows&&nc>=0&&nc<state.cols&&state.cells[nr][nc].mine)count++;
          }
        }
        state.cells[r][c].count=count;
      }
    }
  }

  function startTimer(){
    if(state.started)return;
    state.started=true;
    state.timerId=setInterval(function(){
      state.seconds++;
      timerElement.textContent=formatCount(state.seconds);
    },1000);
  }

  function finishGame(won){
    state.ended=true;
    if(state.timerId)clearInterval(state.timerId);
    state.cells.forEach(function(row){
      row.forEach(function(cell){
        if(cell.mine)cell.opened=true;
      });
    });
    if(won){
      resetButton.textContent='😎 Menang';
      statusElement.className='status good';
      statusElement.textContent='Hebat! Semua kotak aman berhasil dibuka dalam '+state.seconds+' detik.';
    }else{
      resetButton.textContent='😵 Kalah';
      statusElement.className='status bad';
      statusElement.textContent='Ups, kamu menemukan ranjau. Coba lagi!';
    }
    render();
  }

  function openCell(row,col){
    if(state.ended)return;
    var cell=state.cells[row][col];
    if(cell.opened||cell.flagged)return;
    if(!state.started){
      placeMines(row,col);
      startTimer();
    }
    cell=state.cells[row][col];
    if(cell.mine){
      cell.hit=true;
      finishGame(false);
      return;
    }
    var queue=[{row:row,col:col}];
    while(queue.length){
      var current=queue.pop();
      var currentCell=state.cells[current.row][current.col];
      if(currentCell.opened||currentCell.flagged||currentCell.mine)continue;
      currentCell.opened=true;
      state.opened++;
      if(currentCell.count===0){
        for(var dr=-1;dr<=1;dr++){
          for(var dc=-1;dc<=1;dc++){
            var nextRow=current.row+dr,nextCol=current.col+dc;
            if(nextRow>=0&&nextRow<state.rows&&nextCol>=0&&nextCol<state.cols){
              var nextCell=state.cells[nextRow][nextCol];
              if(!nextCell.opened&&!nextCell.flagged&&!nextCell.mine)queue.push({row:nextRow,col:nextCol});
            }
          }
        }
      }
    }
    if(state.opened===state.rows*state.cols-state.mines){
      finishGame(true);
      return;
    }
    render();
  }

  function toggleFlag(row,col){
    if(state.ended)return;
    var cell=state.cells[row][col];
    if(cell.opened)return;
    cell.flagged=!cell.flagged;
    state.flags+=cell.flagged?1:-1;
    mineCountElement.textContent=formatCount(state.mines-state.flags);
    render();
  }

  function render(){
    var availableWidth=boardElement.parentElement.clientWidth-18-(state.cols-1)*2;
    var availableHeight=boardElement.parentElement.clientHeight-24-(state.rows-1)*2;
    var cellSize=Math.max(15,Math.min(42,availableWidth/state.cols,availableHeight/state.rows));
    boardElement.style.setProperty('--cell-size',cellSize+'px');
    boardElement.style.gridTemplateColumns='repeat('+state.cols+', '+cellSize+'px)';
    boardElement.innerHTML='';
    var fragment=document.createDocumentFragment();
    for(var row=0;row<state.rows;row++){
      for(var col=0;col<state.cols;col++){
        (function(r,c){
          var cell=state.cells[r][c];
          var button=document.createElement('button');
          button.type='button';
          button.className='cell';
          button.setAttribute('role','gridcell');
          button.setAttribute('aria-label','Baris '+(r+1)+', kolom '+(c+1)+(cell.opened?(cell.mine?', ranjau':cell.count?', '+cell.count+' ranjau di sekitar':', kosong'):cell.flagged?', ditandai':''));
          if(cell.opened){
            button.classList.add('open');
            button.disabled=true;
            if(cell.mine){
              button.textContent=cell.hit?'💥':'💣';
              if(cell.hit)button.classList.add('mine-hit');
            }else if(cell.count){
              button.textContent=String(cell.count);
              button.classList.add('n'+cell.count);
            }
          }else if(cell.flagged){
            button.textContent='⚑';
            button.classList.add('flag');
          }
          button.addEventListener('click',function(){
            if(state.flagMode)toggleFlag(r,c);
            else openCell(r,c);
          });
          button.addEventListener('contextmenu',function(event){
            event.preventDefault();
            toggleFlag(r,c);
          });
          fragment.appendChild(button);
        })(row,col);
      }
    }
    boardElement.appendChild(fragment);
  }

  flagModeButton.addEventListener('click',function(){
    state.flagMode=!state.flagMode;
    flagModeButton.classList.toggle('active',state.flagMode);
    flagModeButton.setAttribute('aria-pressed',String(state.flagMode));
    statusElement.textContent=state.flagMode?'Mode tandai aktif: pilih kotak untuk memasang atau melepas bendera.':'Mode buka aktif: pilih kotak untuk membukanya.';
  });
  resetButton.addEventListener('click',startGame);
  levelElement.addEventListener('change',startGame);
  window.addEventListener('resize',render);
  startGame();
})();
<\/script>
</body>
</html>`;

const handler = async (m, { sock, conn }) => {
    const client = sock || conn || global.conn;
    const data = {
        response_id: crypto.randomUUID(),
        sections: [{
            __typename: 'GenAIUnifiedResponseSection',
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: {
                    __typename: 'GenAIBotProgressStatusPrimitive',
                    title: 'Minesweeper:*Click Me*',
                    is_in_progress: true
                }
            }
        }],
        embedded_screens: [{
            title: 'Preview',
            content: [{
                __typename: 'FOAIDNixelButtonSheets',
                tabs: [{
                    id: 'tab_0',
                    tab_header: 'Minesweeper',
                    sections: [{
                        __typename: 'GenAIUnifiedResponseSection',
                        view_model: {
                            __typename: 'GenAISingleLayoutViewModel',
                            primitive: {
                                __typename: 'GenAIaeacdsnwHtmlPrimitive',
                                payload: htmlPayload,
                                url: 'https://example.com',
                                trusted_sources: ['example.com']
                            }
                        }
                    }],
                    step_entries: []
                }]
            }]
        }]
    };

    try {
        await client.relayMessage(
            m.chat,
            {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                    botMetadata: {
                        messageDisclaimerText: '',
                        richResponseSourcesMetadata: {}
                    }
                },
                botForwardedMessage: {
                    message: {
                        richResponseMessage: {
                            messageType: 1,
                            unifiedResponse: {
                                data: Buffer.from(JSON.stringify(data)).toString('base64')
                            },
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedAiBotMessageInfo: { botJid: '0@bot' },
                                forwardOrigin: 4
                            }
                        }
                    }
                }
            },
            { messageId: await client.generateMessageTag() }
        );
    } catch (error) {
        console.error('Error send Minesweeper HTML:', error);
        if (m.reply) m.reply('❌ Error: ' + error.message);
    }
};

export default Object.assign(handler, {
    help: ['minesweeper', 'mines'],
    tags: ['game', 'fun'],
    command: ['minesweeper', 'mines']
});
