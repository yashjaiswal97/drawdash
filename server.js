<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover" />
  <title>2-Player Pictionary — Mobile Friendly</title>
  <style>
    :root{
      --bg:#071428; --panel:rgba(255,255,255,0.03); --accent:#06b6d4; --muted:#9fb0c6; --card:#0b1226; --text:#e6eef6
    }
    *{box-sizing:border-box;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial}
    html,body{height:100%;margin:0;background:linear-gradient(180deg,#031022 0%, #071428 100%);color:var(--text);-webkit-font-smoothing:antialiased}
    .app{max-width:1100px;margin:12px auto;padding:12px;border-radius:12px}

    header{display:flex;align-items:center;justify-content:space-between;gap:8px}
    h1{font-size:16px;margin:0}

    /* Layout: on wide screens show canvas + sidebar; on small screens stack vertically */
    main{display:grid;grid-template-columns:1fr 380px;gap:12px;margin-top:12px}
    @media (max-width:900px){main{grid-template-columns:1fr;}}

    .panel{background:var(--panel);padding:10px;border-radius:10px}

    .canvas-area{display:flex;flex-direction:column;gap:8px}
    .canvas-wrap{background:#fff;border-radius:10px;overflow:hidden;position:relative}

    /* Make canvas responsive and maintain aspect ratio */
    .canvas-frame{width:100%;height:0;padding-bottom:62.5%;position:relative}
    canvas{position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none}

    .tools{display:flex;flex-wrap:wrap;gap:8px;padding:8px}
    .btn{background:var(--accent);color:#021c22;padding:10px 12px;border-radius:10px;border:0;cursor:pointer;font-weight:600}
    .btn.secondary{background:transparent;border:1px solid rgba(255,255,255,0.06);color:var(--muted)}
    .tool-field{background:transparent;border-radius:8px;padding:6px 8px;border:1px solid rgba(255,255,255,0.04);display:flex;align-items:center;gap:8px}
    input[type=range]{width:120px}

    .sidebar{display:flex;flex-direction:column;gap:10px}
    .players{display:flex;gap:8px}
    .player{flex:1;padding:8px;border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,0.01),transparent);border:1px solid rgba(255,255,255,0.02)}
    .big{font-size:22px;font-weight:700}

    .word-box{padding:10px;border-radius:8px;background:linear-gradient(90deg,rgba(0,0,0,0.2),transparent);text-align:center}
    .muted{color:var(--muted);font-size:13px}
    .guess-list{max-height:180px;overflow:auto;padding:6px;display:flex;flex-direction:column;gap:6px}
    .guess-item{padding:8px;border-radius:8px;background:rgba(255,255,255,0.02)}

    footer{display:flex;justify-content:space-between;align-items:center;margin-top:8px}

    /* Mobile specific enhancements */
    @media (max-width:520px){
      header{flex-direction:column;align-items:flex-start}
      .tools{gap:6px}
      .btn{padding:10px;border-radius:12px}
      input[type=range]{width:100px}
      .players{flex-direction:column}
      .canvas-wrap{border-radius:12px}
    }

    /* Floating bottom action bar for mobile */
    .mobile-bar{display:none;position:fixed;left:12px;right:12px;bottom:12px;gap:8px;padding:10px;background:linear-gradient(180deg,rgba(2,6,23,0.8),rgba(2,6,23,0.95));border-radius:14px;backdrop-filter:blur(6px)}
    @media (max-width:900px){.mobile-bar{display:flex}}

  </style>
</head>
<body>
  <div class="app">
    <header>
      <h1>2-Player Pictionary 🎨 — Mobile Friendly</h1>
      <div style="display:flex;gap:8px;align-items:center">
        <label class="muted" style="font-size:13px;margin-right:6px">Round (sec)</label>
        <input id="timeLimit" type="number" value="60" style="width:80px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:inherit" />
      </div>
    </header>

    <main>
      <section class="canvas-area panel">
        <div class="canvas-wrap">
          <div class="canvas-frame">
            <canvas id="board"></canvas>
          </div>
        </div>

        <div class="tools">
          <div class="tool-field" style="align-items:center">
            <label class="muted" style="font-size:13px">Brush</label>
            <input id="brushSize" type="range" min="2" max="40" value="6" />
          </div>

          <div class="tool-field">
            <label class="muted" style="font-size:13px">Color</label>
            <input id="color" type="color" value="#000000" />
          </div>

          <button id="clearBtn" class="btn secondary">Clear</button>
          <button id="undoBtn" class="btn secondary">Undo</button>
          <button id="saveBtn" class="btn">Save</button>

          <div style="flex:1"></div>

          <button id="startBtn" class="btn">Start Round</button>
          <button id="nextBtn" class="btn secondary">Next Turn</button>
        </div>

        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:space-between">
          <div class="muted">Tip: Drawer should see the secret word on their device; Guesser types guesses below.</div>
          <div class="muted">Rounds: <span id="roundCount">0</span></div>
        </div>
      </section>

      <aside class="sidebar">
        <div class="panel">
          <div class="muted">Players</div>
          <div class="players" style="margin-top:8px">
            <div class="player">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                <input id="p1name" type="text" value="Player 1" style="background:transparent;border:0;color:inherit;font-weight:600" />
                <div class="big" id="p1score">0</div>
              </div>
            </div>
            <div class="player">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                <input id="p2name" type="text" value="Player 2" style="background:transparent;border:0;color:inherit;font-weight:600" />
                <div class="big" id="p2score">0</div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="muted">Round</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
            <div>
              <div class="muted">Current drawer</div>
              <div id="currentDrawer" class="big">Player 1</div>
            </div>
            <div>
              <div class="muted">Time left</div>
              <div id="timer" class="big">00:00</div>
            </div>
          </div>

          <div style="margin-top:10px" class="word-box">
            <div class="muted">Secret word (drawer only)</div>
            <div id="secretWord" style="font-size:18px;font-weight:700;letter-spacing:1px;margin-top:6px">—</div>
          </div>
        </div>

        <div class="panel">
          <div class="muted">Guesser</div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <input id="guessInput" type="text" placeholder="Type a guess and press Enter" style="flex:1;padding:10px;border-radius:10px;background:transparent;border:1px solid rgba(255,255,255,0.04);color:inherit" />
            <button id="guessBtn" class="btn">Guess</button>
          </div>
          <div class="guess-list" id="guesses"></div>
        </div>

        <div style="display:flex;gap:8px">
          <button id="passBtn" class="btn secondary">Pass Word</button>
          <button id="shuffleWordBtn" class="btn">New Word</button>
          <button id="resetBtn" class="btn secondary">Reset Game</button>
        </div>
      </aside>
    </main>

    <!-- mobile floating bar for quick actions -->
    <div class="mobile-bar">
      <button id="mClear" class="btn secondary">Clear</button>
      <button id="mUndo" class="btn secondary">Undo</button>
      <button id="mStart" class="btn">Start</button>
      <button id="mNext" class="btn secondary">Next</button>
    </div>

  </div>

  <script>
    // Word bank (same as before)
    const WORDS = ['apple','bicycle','guitar','house','elephant','computer','pizza','rainbow','airplane','camera','mountain','basketball','flower','banana','shark','cloud','book','umbrella','key','dragon','rocket','bridge','sushi','tree','sunglasses','piano','clock','hat','boat','island'];

    // DOM
    const board = document.getElementById('board');
    const ctx = board.getContext('2d');
    const clearBtn = document.getElementById('clearBtn');
    const undoBtn = document.getElementById('undoBtn');
    const saveBtn = document.getElementById('saveBtn');
    const brushSize = document.getElementById('brushSize');
    const color = document.getElementById('color');
    const startBtn = document.getElementById('startBtn');
    const nextBtn = document.getElementById('nextBtn');
    const timeLimit = document.getElementById('timeLimit');
    const secretWord = document.getElementById('secretWord');
    const currentDrawer = document.getElementById('currentDrawer');
    const timerDisplay = document.getElementById('timer');
    const guessInput = document.getElementById('guessInput');
    const guessBtn = document.getElementById('guessBtn');
    const guessesWrap = document.getElementById('guesses');
    const p1scoreEl = document.getElementById('p1score');
    const p2scoreEl = document.getElementById('p2score');
    const p1name = document.getElementById('p1name');
    const p2name = document.getElementById('p2name');
    const passBtn = document.getElementById('passBtn');
    const shuffleWordBtn = document.getElementById('shuffleWordBtn');
    const roundCount = document.getElementById('roundCount');
    const resetBtn = document.getElementById('resetBtn');

    // Mobile shortcut buttons
    const mClear = document.getElementById('mClear');
    const mUndo = document.getElementById('mUndo');
    const mStart = document.getElementById('mStart');
    const mNext = document.getElementById('mNext');

    // State
    let currentDrawerIndex = 0; // 0 -> player1 draws
    let secret = '';
    let timerId = null;
    let timeLeft = 0;
    let roundPlaying = false;
    let historyStrokes = [];
    let drawing = false;
    let currentPath = [];

    // Responsive canvas sizing using devicePixelRatio and container size
    function resizeCanvas(){
      const rect = board.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      board.width = Math.round(rect.width * ratio);
      board.height = Math.round(rect.height * ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
      ctx.lineJoin = 'round';
      redrawAll();
    }

    // Observe size changes to parent frame
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(board);
    window.addEventListener('orientationchange', ()=> setTimeout(resizeCanvas,250));

    function setBrushFromUI(){ ctx.lineWidth = Number(brushSize.value); ctx.lineCap = 'round'; ctx.strokeStyle = color.value; }

    function startPath(x,y){ drawing = true; currentPath = [{x,y,color:color.value,width:brushSize.value}]; ctx.beginPath(); ctx.moveTo(x,y); }
    function pushPoint(x,y){ if(!drawing) return; currentPath.push({x,y}); ctx.lineTo(x,y); ctx.stroke(); }
    function endPath(){ if(!drawing) return; drawing=false; ctx.closePath(); historyStrokes.push(currentPath); currentPath=[]; }

    function redrawAll(){ ctx.clearRect(0,0,board.width,board.height); // draw strokes scaled by transform
      // ctx is already transformed via setTransform
      for(const stroke of historyStrokes){ if(!stroke || !stroke.length) continue; ctx.beginPath(); ctx.lineWidth = stroke[0].width || 6; ctx.strokeStyle = stroke[0].color || '#000'; ctx.moveTo(stroke[0].x, stroke[0].y); for(let i=1;i<stroke.length;i++) ctx.lineTo(stroke[i].x, stroke[i].y); ctx.stroke(); ctx.closePath(); }
    }

    // Pointer event helpers that support touch and mouse
    function getPointerPos(e){ const rect = board.getBoundingClientRect(); const p = e.touches? e.touches[0] : e; return {x: (p.clientX - rect.left), y: (p.clientY - rect.top)}; }

    board.addEventListener('pointerdown', (e)=>{ if(!roundPlaying) return; // only allow drawing during active round
      e.preventDefault(); board.setPointerCapture(e.pointerId); setBrushFromUI(); const pos = getPointerPos(e); startPath(pos.x,pos.y); });
    board.addEventListener('pointermove', (e)=>{ if(!drawing) return; e.preventDefault(); const pos = getPointerPos(e); pushPoint(pos.x,pos.y); });
    board.addEventListener('pointerup', (e)=>{ if(e.pointerId) board.releasePointerCapture(e.pointerId); endPath(); });
    board.addEventListener('pointercancel', endPath);

    // Buttons
    clearBtn.addEventListener('click', ()=>{ historyStrokes=[]; redrawAll(); });
    undoBtn.addEventListener('click', ()=>{ historyStrokes.pop(); redrawAll(); });
    saveBtn.addEventListener('click', ()=>{ const url = board.toDataURL('image/png'); const a = document.createElement('a'); a.href = url; a.download = 'pictionary.png'; a.click(); });
    // mobile bar
    mClear.addEventListener('click', ()=> clearBtn.click()); mUndo.addEventListener('click', ()=> undoBtn.click()); mStart.addEventListener('click', ()=> startBtn.click()); mNext.addEventListener('click', ()=> nextBtn.click());

    function pickWord(){ return WORDS[Math.floor(Math.random()*WORDS.length)]; }
    function setSecretVisibleForDrawer(){ secretWord.textContent = secret || '—'; }
    function formatTime(s){ const mm = String(Math.floor(s/60)).padStart(2,'0'); const ss = String(s%60).padStart(2,'0'); return mm+":"+ss }

    function startRound(){ if(roundPlaying) return; roundPlaying = true; historyStrokes = []; redrawAll(); secret = pickWord(); setSecretVisibleForDrawer(); timeLeft = parseInt(timeLimit.value,10) || 60; timerDisplay.textContent = formatTime(timeLeft); startBtn.disabled = true; mStart.disabled=true; currentDrawer.textContent = (currentDrawerIndex===0? p1name.value : p2name.value); guessesWrap.innerHTML = ''; roundCount.textContent = String(Number(roundCount.textContent||0)+1);
      timerId = setInterval(()=>{ timeLeft--; timerDisplay.textContent = formatTime(timeLeft); if(timeLeft<=0) endRound(false); },1000);
    }

    function endRound(solved){ if(!roundPlaying) return; roundPlaying=false; clearInterval(timerId); timerId=null; startBtn.disabled=false; mStart.disabled=false; if(solved){ if(currentDrawerIndex===0) p2scoreEl.textContent = String(Number(p2scoreEl.textContent||0)+1); else p1scoreEl.textContent = String(Number(p1scoreEl.textContent||0)+1); } secretWord.textContent = secret + (solved? ' ✅':' (time)'); }

    startBtn.addEventListener('click', startRound);
    nextBtn.addEventListener('click', ()=>{ currentDrawerIndex = 1 - currentDrawerIndex; currentDrawer.textContent = (currentDrawerIndex===0? p1name.value : p2name.value); secretWord.textContent = '—'; startBtn.disabled=false; mStart.disabled=false; roundPlaying=false; });

    guessBtn.addEventListener('click', submitGuess); guessInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') submitGuess(); });
    function submitGuess(){ const g = guessInput.value.trim(); if(!g) return; const item = document.createElement('div'); item.className='guess-item'; item.textContent = (currentDrawerIndex===0? p2name.value : p1name.value) + ': ' + g; guessesWrap.prepend(item); guessInput.value=''; if(g.toLowerCase() === secret.toLowerCase()){ endRound(true); } }

    passBtn.addEventListener('click', ()=>{ secret = pickWord(); setSecretVisibleForDrawer(); }); shuffleWordBtn.addEventListener('click', ()=>{ secret = pickWord(); setSecretVisibleForDrawer(); });
    resetBtn.addEventListener('click', ()=>{ if(timerId) clearInterval(timerId); roundPlaying=false; historyStrokes=[]; redrawAll(); p1scoreEl.textContent='0'; p2scoreEl.textContent='0'; roundCount.textContent='0'; secret=''; secretWord.textContent='—'; timerDisplay.textContent='00:00'; currentDrawerIndex=0; currentDrawer.textContent=p1name.value; });

    // initial setup
    currentDrawer.textContent = p1name.value; timerDisplay.textContent = '00:00'; setBrushFromUI(); brushSize.addEventListener('input', setBrushFromUI); color.addEventListener('input', setBrushFromUI);

    // initial resize after DOM ready
    setTimeout(resizeCanvas,50);

    // Accessibility: allow drawer visibility by tapping the word area twice to reveal for one second (mobile-friendly hint)
    let revealTimeout = null;
    secretWord.addEventListener('dblclick', ()=>{ const prev = secretWord.textContent; secretWord.textContent = secret || '—'; clearTimeout(revealTimeout); revealTimeout = setTimeout(()=>{ secretWord.textContent = prev; },3000); });

    // Prevent scrolling while drawing on mobile
    board.addEventListener('touchstart', (e)=>{ if(roundPlaying) e.preventDefault(); }, {passive:false});
    board.addEventListener('touchmove', (e)=>{ if(drawing) e.preventDefault(); }, {passive:false});

  </script>
</body>
</html>