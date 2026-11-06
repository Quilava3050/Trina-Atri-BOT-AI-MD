import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import crypto from 'crypto';

let handler = async (m, { sock, conn }) => {
    // Menyesuaikan koneksi socket bot Trina
    const client = sock || conn || global.conn;

    const htmlPayload = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Grandmaster Chess — Dark</title>
<style>
:root{
  --bg:#0b141a;
  --card:#111b21;
  --panel:#1f2c34;
  --line:#2a3942;
  --line-strong:#374248;
  --ink:#e9edef;
  --ink-soft:#aebac1;
  --muted:#8696a0;
  --accent:#00a884;
  --accent-2:#008069;
  --gold:#ffd166;
  --square-light:#2a3942;
  --square-dark:#111b21;
  --highlight:rgba(0,168,132,0.4);
  --selected:rgba(255,209,102,0.45);
  --sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  background:transparent;
  color:var(--ink);
  font-family:var(--sys);
  min-height:100vh;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  touch-action:manipulation;
}
.stage{
  min-height:100vh;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  padding:14px 10px;
}
.card{
  width:100%;
  max-width:370px;
  background:var(--card);
  border:1px solid var(--line);
  border-radius:16px;
  overflow:hidden;
  box-shadow:0 12px 32px rgba(0,0,0,0.6);
}
.header{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 16px;
  background:var(--panel);
  border-bottom:1px solid var(--line);
}
.header__title{
  font-size:16px;font-weight:700;
  color:var(--gold);
  display:flex;align-items:center;gap:6px;
}
.header__sub{font-size:11px;color:var(--muted)}

.status-bar{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 16px;
  background:rgba(0,168,132,0.06);
  border-bottom:1px solid var(--line);
  font-size:13px;
}
.status-turn{
  display:flex;align-items:center;gap:8px;
  font-weight:600;color:var(--ink);
}
.turn-dot{
  width:10px;height:10px;border-radius:50%;
  background:#fff;box-shadow:0 0 8px rgba(255,255,255,0.6);
  transition:background 0.2s;
}
.turn-dot.ai{background:#00a884;box-shadow:0 0 8px #00a884;}
.captured-box{font-size:14px;letter-spacing:1px}

/* CHESS BOARD */
.board-wrapper{
  padding:14px 10px;
  display:flex;justify-content:center;
  background:#090e11;
}
.chessboard{
  width:min(100%, 340px);
  height:auto;
  min-width:0;
  min-height:0;
  aspect-ratio:1;
  display:grid;
  grid-template-columns:repeat(8, minmax(0, 1fr));
  grid-template-rows:repeat(8, minmax(0, 1fr));
  border:2px solid var(--line-strong);
  border-radius:8px;
  overflow:hidden;
  box-shadow:0 6px 20px rgba(0,0,0,0.7);
}
.square{
  min-width:0;
  min-height:0;
  overflow:hidden;
  display:flex;align-items:center;justify-content:center;
  font-size:clamp(20px, 7vw, 34px);
  line-height:1;
  cursor:pointer;
  user-select:none;
  position:relative;
  transition:background 0.1s ease;
}
.square.light{background:var(--square-light)}
.square.dark{background:var(--square-dark)}
.square.selected{background:var(--selected)!important}
.square.last-move{background:rgba(0,168,132,0.22)!important}
.square.valid-move::after{
  content:'';
  width:12px;height:12px;
  border-radius:50%;
  background:var(--accent);
  opacity:0.85;
  box-shadow:0 0 6px var(--accent);
}
.square.valid-capture::after{
  content:'';
  position:absolute;inset:4px;
  border:2px solid var(--gold);
  border-radius:50%;
}

.piece{
  min-width:0;
  min-height:0;
  max-width:100%;
  max-height:100%;
  display:flex;align-items:center;justify-content:center;
  width:100%;height:100%;
  line-height:1;
  transition:transform 0.1s ease;
}
.piece.white{
  color:#ffffff;
  filter:drop-shadow(0 2px 4px rgba(0,0,0,0.9));
}
.piece.black{
  color:#00a884;
  filter:drop-shadow(0 2px 4px rgba(0,0,0,0.9));
}

/* FOOTER CONTROLS */
.footer-ctrl{
  padding:10px 14px;
  background:var(--panel);
  border-top:1px solid var(--line);
  display:flex;align-items:center;justify-content:space-between;
}
.lvl-btn-group{display:flex;gap:4px}
.lvl-btn{
  background:transparent;
  border:1px solid var(--line-strong);
  color:var(--ink-soft);
  font-size:11px;font-weight:600;
  padding:5px 8px;border-radius:6px;
  cursor:pointer;
}
.lvl-btn.active{background:var(--accent);color:#0b141a;border-color:var(--accent)}
.reset-btn{
  background:none;border:none;
  color:var(--gold);font-weight:700;
  font-size:12px;cursor:pointer;
  padding:6px 10px;
}

/* MODAL */
.modal{
  position:fixed;inset:0;z-index:50;
  display:flex;align-items:center;justify-content:center;
  padding:20px;
  background:rgba(0,0,0,0.85);
  opacity:0;pointer-events:none;
  transition:opacity 0.25s ease;
}
.modal.show{opacity:1;pointer-events:auto}
.modal-card{
  width:100%;max-width:300px;
  background:var(--panel);
  border:2px solid var(--gold);
  border-radius:14px;
  padding:22px 18px;
  text-align:center;
  transform:scale(0.9);
  transition:transform 0.25s ease;
}
.modal.show .modal-card{transform:scale(1)}
.modal-icon{font-size:48px;margin-bottom:6px}
.modal-title{font-size:20px;font-weight:800;color:var(--gold);margin-bottom:4px}
.modal-sub{font-size:12px;color:var(--ink-soft);margin-bottom:16px}
.modal-btn{
  width:100%;padding:11px;
  background:var(--accent);
  border:none;border-radius:8px;
  font-weight:700;font-size:14px;color:#0b141a;
  cursor:pointer;
}
</style>
</head>
<body>
<main class="stage">
  <div class="card">
    <div class="header">
      <div class="header__title">♟️ Grandmaster Chess</div>
      <div class="header__sub">Trina Interactive Game</div>
    </div>

    <div class="status-bar">
      <div class="status-turn">
        <span class="turn-dot" id="turn-dot"></span>
        <span id="turn-text">Giliran Putih (Kamu)</span>
      </div>
      <div class="captured-box" id="captured-pieces"></div>
    </div>

    <div class="board-wrapper">
      <div class="chessboard" id="board"></div>
    </div>

    <div class="footer-ctrl">
      <div class="lvl-btn-group">
        <button class="lvl-btn" data-lvl="1">Pemula</button>
        <button class="lvl-btn active" data-lvl="2">Menengah</button>
        <button class="lvl-btn" data-lvl="3">Master</button>
      </div>
      <button class="reset-btn" id="btn-reset">↺ Ulang Papan</button>
    </div>
  </div>
</main>

<div class="modal" id="game-modal">
  <div class="modal-card">
    <div class="modal-icon" id="modal-icon">🏆</div>
    <div class="modal-title" id="modal-title">SKAKMAT!</div>
    <div class="modal-sub" id="modal-sub">Kamu memenangkan pertandingan!</div>
    <button class="modal-btn" id="modal-restart">MAIN LAGI</button>
  </div>
</div>

<script>
const PIECES = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
};

const INITIAL_BOARD = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR']
];

let board = [];
let turn = 'w';
let selectedSquare = null;
let validMoves = [];
let lastMove = null;
let isThinking = false;
let difficulty = 2;
let capturedWhite = [];
let capturedBlack = [];

function initBoard() {
  board = INITIAL_BOARD.map(row => [...row]);
  turn = 'w';
  selectedSquare = null;
  validMoves = [];
  lastMove = null;
  isThinking = false;
  capturedWhite = [];
  capturedBlack = [];
  updateTurnUI();
  renderBoard();
}

function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement('div');
      const isLight = (r + c) % 2 === 0;
      sq.className = 'square ' + (isLight ? 'light' : 'dark');
      sq.dataset.row = r;
      sq.dataset.col = c;

      if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
        sq.classList.add('selected');
      }

      if (lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c))) {
        sq.classList.add('last-move');
      }

      const move = validMoves.find(m => m.r === r && m.c === c);
      if (move) {
        if (board[r][c]) sq.classList.add('valid-capture');
        else sq.classList.add('valid-move');
      }

      const piece = board[r][c];
      if (piece) {
        const pieceEl = document.createElement('div');
        const color = piece[0] === 'w' ? 'white' : 'black';
        pieceEl.className = 'piece ' + color;
        pieceEl.textContent = PIECES[piece];
        sq.appendChild(pieceEl);
      }

      sq.addEventListener('click', () => onSquareClick(r, c));
      boardEl.appendChild(sq);
    }
  }
}

function onSquareClick(r, c) {
  if (turn !== 'w' || isThinking) return;

  const piece = board[r][c];

  if (selectedSquare) {
    const move = validMoves.find(m => m.r === r && m.c === c);
    if (move) {
      makeMove(selectedSquare, { r, c });
      selectedSquare = null;
      validMoves = [];
      renderBoard();
      if (!checkGameOver('b')) {
        turn = 'b';
        updateTurnUI();
        setTimeout(makeAIMove, 300 + Math.random() * 400);
      }
      return;
    }
  }

  if (piece && piece[0] === 'w') {
    selectedSquare = { r, c };
    validMoves = getLegalMoves(r, c, board);
    renderBoard();
  } else {
    selectedSquare = null;
    validMoves = [];
    renderBoard();
  }
}

function makeMove(from, to) {
  const p = board[from.r][from.c];
  const target = board[to.r][to.c];
  if (target) {
    if (target[0] === 'w') capturedWhite.push(target);
    else capturedBlack.push(target);
  }

  if (p === 'wP' && to.r === 0) board[to.r][to.c] = 'wQ';
  else if (p === 'bP' && to.r === 7) board[to.r][to.c] = 'bQ';
  else board[to.r][to.c] = p;

  board[from.r][from.c] = null;
  lastMove = { from, to };
}

function getLegalMoves(r, c, b) {
  const piece = b[r][c];
  if (!piece) return [];
  const color = piece[0];
  const type = piece[1];
  const moves = [];

  const add = (nr, nc) => {
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false;
    const dest = b[nr][nc];
    if (!dest) { moves.push({ r: nr, c: nc }); return true; }
    if (dest[0] !== color) { moves.push({ r: nr, c: nc }); return false; }
    return false;
  };

  const line = (dr, dc) => {
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      if (!b[nr][nc]) { moves.push({ r: nr, c: nc }); }
      else {
        if (b[nr][nc][0] !== color) moves.push({ r: nr, c: nc });
        break;
      }
      nr += dr; nc += dc;
    }
  };

  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    if (b[r + dir] && !b[r + dir][c]) {
      moves.push({ r: r + dir, c });
      if (r === startRow && !b[r + 2 * dir][c]) moves.push({ r: r + 2 * dir, c });
    }
    [-1, 1].forEach(dc => {
      const nr = r + dir, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr][nc] && b[nr][nc][0] !== color) {
        moves.push({ r: nr, c: nc });
      }
    });
  } else if (type === 'N') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => add(r + dr, c + dc));
  } else if (type === 'B') {
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr, dc]) => line(dr, dc));
  } else if (type === 'R') {
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => line(dr, dc));
  } else if (type === 'Q') {
    [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => line(dr, dc));
  } else if (type === 'K') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => add(r + dr, c + dc));
  }

  return moves;
}

function makeAIMove() {
  isThinking = true;
  updateTurnUI();

  const allMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c][0] === 'b') {
        const moves = getLegalMoves(r, c, board);
        moves.forEach(to => allMoves.push({ from: { r, c }, to, piece: board[r][c] }));
      }
    }
  }

  if (allMoves.length === 0) {
    showModal('SKAKMAT!', 'AI tidak memiliki langkah legal. Kamu menang!', '👑');
    return;
  }

  let chosenMove = null;
  if (difficulty === 1) {
    chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
  } else {
    const captures = allMoves.filter(m => board[m.to.r][m.to.c] !== null);
    if (captures.length && (difficulty === 3 || Math.random() < 0.75)) {
      captures.sort((a, b) => getPieceValue(board[b.to.r][b.to.c]) - getPieceValue(board[a.to.r][a.to.c]));
      chosenMove = captures[0];
    } else {
      chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    }
  }

  makeMove(chosenMove.from, chosenMove.to);
  turn = 'w';
  isThinking = false;
  updateTurnUI();
  renderBoard();
  checkGameOver('w');
}

function getPieceValue(p) {
  if (!p) return 0;
  const vals = { P: 10, N: 30, B: 35, R: 50, Q: 90, K: 900 };
  return vals[p[1]] || 0;
}

function checkGameOver(playerColor) {
  let hasKing = false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === playerColor + 'K') hasKing = true;
    }
  }
  if (!hasKing) {
    if (playerColor === 'b') showModal('MENANG!', 'Raja AI telah tumbang! Kamu pemenangnya.', '👑');
    else showModal('KALAH!', 'Raja kamu tertangkap oleh AI.', '💀');
    return true;
  }
  return false;
}

function updateTurnUI() {
  const dot = document.getElementById('turn-dot');
  const txt = document.getElementById('turn-text');
  if (isThinking) {
    dot.className = 'turn-dot ai';
    txt.textContent = 'AI sedang berpikir...';
  } else if (turn === 'w') {
    dot.className = 'turn-dot';
    txt.textContent = 'Giliranmu (Putih)';
  } else {
    dot.className = 'turn-dot ai';
    txt.textContent = 'Giliran AI (Hitam)';
  }
  document.getElementById('captured-pieces').textContent = capturedBlack.map(p => PIECES[p]).join('');
}

function showModal(title, sub, icon) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-sub').textContent = sub;
  document.getElementById('modal-icon').textContent = icon;
  document.getElementById('game-modal').classList.add('show');
}

document.querySelectorAll('.lvl-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    difficulty = parseInt(btn.dataset.lvl);
    document.querySelectorAll('.lvl-btn').forEach(b => b.classList.toggle('active', b === btn));
    initBoard();
  });
});

document.getElementById('btn-reset').addEventListener('click', initBoard);
document.getElementById('modal-restart').addEventListener('click', () => {
  document.getElementById('game-modal').classList.remove('show');
  initBoard();
});

initBoard();
</script>
</body>
</html>`;

    const slots = {
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages: [
              { messageType: 2, messageText: '> Trina Chess' }
            ],
            unifiedResponse: {
              data: Buffer.from(JSON.stringify({
                response_id: crypto.randomUUID(),
                sections: [{
                  view_model: {
                    primitive: {
                      text: '> Trina Chess',
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
                      tab_header: 'Catur',
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
    };

    try {
        const msg = generateWAMessageFromContent(m.chat, slots, { quoted: m });
        await client.relayMessage(m.chat, msg.message, {
            messageId: msg.key.id
        });
    } catch (e) {
        console.error('Error send Chess HTML:', e);
        if (m.reply) m.reply('❌ Error: ' + e.message);
    }
};

export default Object.assign(handler, {
    help: ['catur', 'chess', 'caturhtml'],
    tags: ['game', 'fun'],
    command: ['catur', 'chess', 'caturhtml'],
});