// /script.js
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const cells = Array.from(document.querySelectorAll('[data-cell]'));
  const boardEl = document.getElementById('game-board');
  const statusDisplay = document.getElementById('status-display');
  const restartButton = document.getElementById('restart-button');
  const resetScoresBtn = document.getElementById('reset-scores');
  const winningLine = document.getElementById('winning-line');

  // Radio groups
  const difficultyRadios = Array.from(document.querySelectorAll('input[name="difficulty"]'));
  const humanRadios = Array.from(document.querySelectorAll('input[name="human"]'));

  // Scoreboard
  const scoreXEl = document.getElementById('score-x');
  const scoreOEl = document.getElementById('score-o');
  const scoreDrawEl = document.getElementById('score-draw');

  // Constants
  const X = 'x';
  const O = 'o';
  const WINNING_COMBINATIONS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  const STORAGE_KEY = 'ttt_scores_v2';

  // State
  let gameActive = true;
  let human = X;               // 'x' or 'o'
  let ai = O;                  // opposite of human
  let difficulty = 'easy';     // 'easy' | 'hard'
  let isOTurn = false;         // false => X's turn, true => O's turn
  let scores = { x:0, o:0, d:0 };
  let kbIndex = 0;             // keyboard focus index

  init();

  function init(){
    // Load scores
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') scores = {...scores, ...saved};
    } catch {}
    renderScores();

    // Wire up radios
    difficultyRadios.forEach(r => r.addEventListener('change', () => {
      difficulty = difficultyRadios.find(x => x.checked)?.value || 'easy';
      setStatus(`Difficulty: ${difficulty.toUpperCase()}${gameActive ? ' // applies now' : ''}`);
    }));
    humanRadios.forEach(r => r.addEventListener('change', onHumanChange));

    // Buttons
    restartButton.addEventListener('click', startRound);
    resetScoresBtn.addEventListener('click', resetScores);

    // Keyboard navigation on board
    boardEl.addEventListener('keydown', onBoardKeyDown);

    // Start
    startRound();
  }

  function onHumanChange(){
    const nextHuman = humanRadios.find(x => x.checked)?.value || X;
    const anyMove = cells.some(c => c.classList.contains(X) || c.classList.contains(O));
    if (anyMove) {
      // Prevent mid-round swap to avoid confusing state
      humanRadios.forEach(r => { if (r.value !== human) r.checked = false; else r.checked = true; });
      setStatus('Human mark can change on NEW_ROUND only');
      return;
    }
    human = nextHuman;
    ai = human === X ? O : X;
    setStatus(`You play as ${human.toUpperCase()}`);
    // If human switched to O before start and it's an idle board, let AI (X) start immediately
    maybeAIGoesFirst();
  }

  function startRound(){
    // Reset board
    gameActive = true;
    isOTurn = false; // X starts by default
    winningLine.className = 'winning-line';
    statusDisplay.classList.remove('win','draw');

    cells.forEach((cell, i) => {
      cell.classList.remove(X, O, 'clicked');
      cell.textContent = '';
      cell.disabled = false;
      cell.setAttribute('aria-label', `Cell ${i+1}: Empty`);
      // Ensure fresh listeners
      cell.replaceWith(cell.cloneNode(true));
    });
    // Requery cells after cloneNode
    const freshCells = Array.from(document.querySelectorAll('[data-cell]'));
    freshCells.forEach(cell => cell.addEventListener('click', handleClick, { once:false }));
    // Replace cells reference
    cells.length = 0; cells.push(...freshCells);

    // Focus first cell for keyboard users
    kbIndex = 0;
    cells[kbIndex].focus();

    // If human is O, AI (X) starts
    renderTurnStatus();
    maybeAIGoesFirst();
  }

  function maybeAIGoesFirst(){
    const empty = getEmptyIndices(getBoardState());
    if (human === O && empty.length === 9 && gameActive) {
      setStatus('AI thinking…');
      setTimeout(aiMove, 500);
    }
  }

  function handleClick(e){
    if (!gameActive) return;
    const cell = e.currentTarget;
    const currentClass = isOTurn ? O : X;
    const isHumanTurn = currentClass === human;

    if (!isHumanTurn) {
      // Ignore clicks when it's AI's turn
      return;
    }
    if (cell.classList.contains(X) || cell.classList.contains(O)) return;

    markCell(cell, currentClass);
    const winCombo = checkWin(currentClass);
    if (winCombo) return endGame(false, currentClass);
    if (isDraw()) return endGame(true);

    swapTurns();
    setStatus('AI thinking…');
    setTimeout(aiMove, 550);
  }

  function aiMove(){
    if (!gameActive) return;

    const board = getBoardState();
    const currentClass = isOTurn ? O : X;
    if (currentClass !== ai) return; // Safety: only move when it's AI's turn

    let idx = null;
    const empty = getEmptyIndices(board);
    if (empty.length === 0) return;

    if (difficulty === 'hard') {
      idx = minimax(board, ai, ai, human).index;
    } else {
      idx = empty[Math.floor(Math.random() * empty.length)];
    }

    const cell = cells[idx];
    markCell(cell, ai);

    const winCombo = checkWin(ai);
    if (winCombo) return endGame(false, ai);
    if (isDraw()) return endGame(true);

    swapTurns();
    renderTurnStatus();
    // Bring focus back to nearest empty for keyboard flow
    focusNearestEmpty(idx);
  }

  function markCell(cell, cls){
    cell.classList.add('clicked', cls);
    cell.textContent = cls.toUpperCase();
    cell.setAttribute('aria-label', `${cell.getAttribute('aria-label').replace('Empty','')} ${cls.toUpperCase()}`);
  }

  function swapTurns(){ isOTurn = !isOTurn; }

  function renderTurnStatus(){
    const currentClass = isOTurn ? O : X;
    if (currentClass === human) setStatus(`Your move (${human.toUpperCase()})`);
    else setStatus('AI thinking…');
  }

  function setStatus(msg){
    statusDisplay.innerText = msg;
  }

  function getBoardState(){
    return cells.map(c => c.classList.contains(X) ? X : c.classList.contains(O) ? O : null);
  }

  function getEmptyIndices(board){ return board.map((v,i)=>v===null?i:null).filter(v=>v!==null); }

  function isDraw(){
    return getBoardState().every(v => v === X || v === O);
  }

  function checkWin(player){
    const state = getBoardState();
    const combo = WINNING_COMBINATIONS.find(comb => comb.every(i => state[i] === player));
    if (combo) {
      const idx = WINNING_COMBINATIONS.indexOf(combo);
      showWinningLine(idx, player);
    }
    return combo;
  }

  function showWinningLine(comboIndex, winnerClass){
    winningLine.classList.add(`win-${comboIndex}`);
    winningLine.classList.add(`${winnerClass}-win`);
    winningLine.classList.add('show');
  }

  function endGame(draw, winnerClass=null){
    gameActive = false;
    if (draw) {
      scores.d += 1;
      setStatus('SYSTEM_CALL: DRAW');
      statusDisplay.classList.add('draw');
    } else {
      if (winnerClass === X) scores.x += 1; else scores.o += 1;
      setStatus(`Player ${winnerClass.toUpperCase()} Wins!`);
      statusDisplay.classList.add('win');
    }
    renderScores();
    persistScores();
  }

  function renderScores(){
    scoreXEl.textContent = String(scores.x);
    scoreOEl.textContent = String(scores.o);
    scoreDrawEl.textContent = String(scores.d);
  }

  function persistScores(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scores)); } catch {}
  }

  function resetScores(){
    scores = { x:0, o:0, d:0 };
    persistScores();
    renderScores();
    setStatus('Scores reset');
  }

  // Minimax — supports arbitrary ai/human marks
  function minimax(board, player, aiMark, humanMark){
    const empty = getEmptyIndices(board);

    if (checkWinSim(board, humanMark)) return { score: -10 };
    if (checkWinSim(board, aiMark))    return { score:  10 };
    if (empty.length === 0)            return { score:   0 };

    const moves = [];
    for (const spot of empty){
      const move = { index: spot };
      board[spot] = player;

      if (player === aiMark) {
        move.score = minimax(board, humanMark, aiMark, humanMark).score;
      } else {
        move.score = minimax(board, aiMark, aiMark, humanMark).score;
      }

      board[spot] = null;
      moves.push(move);
    }

    if (player === aiMark) {
      let bestScore = -Infinity, bestIdx = 0;
      moves.forEach((m,i)=>{ if (m.score > bestScore){bestScore = m.score; bestIdx = i;} });
      return moves[bestIdx];
    } else {
      let bestScore = +Infinity, bestIdx = 0;
      moves.forEach((m,i)=>{ if (m.score < bestScore){bestScore = m.score; bestIdx = i;} });
      return moves[bestIdx];
    }
  }

  function checkWinSim(board, player){
    return WINNING_COMBINATIONS.some(c => c.every(i => board[i] === player));
  }

  // Keyboard navigation: arrows cycle within 3×3, Enter/Space to act
  function onBoardKeyDown(e){
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','PageUp','PageDown','Enter',' '].includes(e.key)) return;
    const row = Math.floor(kbIndex / 3);
    const col = kbIndex % 3;
    let r=row, c=col;

    if (e.key === 'ArrowUp')    r = (row + 2) % 3;
    if (e.key === 'ArrowDown')  r = (row + 1) % 3;
    if (e.key === 'ArrowLeft')  c = (col + 2) % 3;
    if (e.key === 'ArrowRight') c = (col + 1) % 3;
    if (e.key === 'Home')       r = 0, c = 0;
    if (e.key === 'End')        r = 2, c = 2;
    if (e.key === 'PageUp')     r = 0;
    if (e.key === 'PageDown')   r = 2;

    const nextIndex = r*3 + c;
    if (nextIndex !== kbIndex && e.key.startsWith('Arrow') || ['Home','End','PageUp','PageDown'].includes(e.key)) {
      kbIndex = nextIndex;
      cells[kbIndex].focus();
      e.preventDefault();
    }

    if ((e.key === 'Enter' || e.key === ' ') && gameActive) {
      const currentClass = isOTurn ? O : X;
      if (currentClass === human) {
        cells[kbIndex].click(); // why: unify input handling paths
        e.preventDefault();
      }
    }
  }

  function focusNearestEmpty(fromIdx){
    const state = getBoardState();
    let idx = fromIdx;
    for (let i=0;i<9;i++){
      idx = (idx + 1) % 9;
      if (state[idx] === null) { kbIndex = idx; cells[idx].focus(); return; }
    }
  }
});
