const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const homeScoreEl = document.getElementById('home-score');
const awayScoreEl = document.getElementById('away-score');
const downLabelEl = document.getElementById('down-label');
const yardsLabelEl = document.getElementById('yards-label');
const clockLabelEl = document.getElementById('clock-label');
const statusTextEl = document.getElementById('status-text');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');

const field = {
  width: canvas.width,
  height: canvas.height,
  goalY: 180,
  goalHeight: 180,
};

const keys = {};

const state = {
  started: false,
  playing: false,
  onDrive: false,
  clock: 90,
  score: { home: 0, away: 0 },
  possession: 'home',
  down: 1,
  yardsToGo: 10,
  players: [],
  ballCarrierIndex: 0,
  selectedIndex: 0,
  snapLocked: false,
  gameOver: false,
  lastTime: 0,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function getDownName(dn) {
  if (dn === 1) return '1ST';
  if (dn === 2) return '2ND';
  if (dn === 3) return '3RD';
  return '4TH';
}

function createPlayer(team, index, x, y, role) {
  return {
    team,
    index,
    role,
    x,
    y,
    radius: 15,
    speed: team === 'home' ? 2.5 : 2.2,
    color: team === 'home' ? '#4aa3ff' : '#ff6767',
    accent: team === 'home' ? '#1a5ab8' : '#c93d3d',
  };
}

function resetPlayers() {
  state.players = [];

  const homeLane = [140, 210, 270, 330, 400];
  const awayLane = [140, 210, 270, 330, 400];

  homeLane.forEach((y, i) => {
    const role = i === 0 ? 'QB' : i === 1 ? 'RB' : 'WR';
    state.players.push(createPlayer('home', i, 140 + i * 12, y, role));
  });

  awayLane.forEach((y, i) => {
    const role = i === 0 ? 'DB' : 'LB';
    state.players.push(createPlayer('away', i, 820 - i * 12, y, role));
  });

  state.ballCarrierIndex = 1;
  state.selectedIndex = 1;
  state.snapLocked = false;
}

function updateHud() {
  homeScoreEl.textContent = state.score.home;
  awayScoreEl.textContent = state.score.away;
  downLabelEl.textContent = getDownName(state.down);
  yardsLabelEl.textContent = state.yardsToGo;
  clockLabelEl.textContent = Math.ceil(state.clock);
}

function setStatus(message) {
  statusTextEl.textContent = message;
}

function beginDrive() {
  state.started = true;
  state.playing = true;
  state.onDrive = true;
  state.clock = 90;
  state.down = 1;
  state.yardsToGo = 10;
  state.possession = 'home';
  resetPlayers();
  setStatus('Drive started. Run the ball or hit a pass.');
  updateHud();
}

function endDrive() {
  state.playing = false;
  state.onDrive = false;
  state.snapLocked = true;
  setStatus('Drive ended. Press Start Game to continue.');
  updateHud();
}

function scoreTouchdown(team) {
  if (team === 'home') {
    state.score.home += 7;
  } else {
    state.score.away += 7;
  }

  state.playing = false;
  state.onDrive = false;
  setStatus(`${team === 'home' ? 'HOME' : 'AWAY'} scores a touchdown!`);
  state.possession = team === 'home' ? 'away' : 'home';
  state.down = 1;
  state.yardsToGo = 10;
  resetPlayers();
  updateHud();
}

function advanceDown() {
  if (state.down >= 4) {
    endDrive();
    return;
  }

  state.down += 1;
  state.yardsToGo = Math.max(1, 10);
  state.snapLocked = false;
  resetPlayers();
  setStatus(`New set. ${getDownName(state.down)} and ${state.yardsToGo}.`);
  updateHud();
}

function getBallCarrier() {
  return state.players[state.ballCarrierIndex] || null;
}

function getSelectedPlayer() {
  return state.players[state.selectedIndex] || null;
}

function handleUserMovement() {
  const carrier = getBallCarrier();
  if (!carrier || !state.playing) return;

  let moveX = 0;
  let moveY = 0;

  if (keys.ArrowLeft || keys.a) moveX -= 1;
  if (keys.ArrowRight || keys.d) moveX += 1;
  if (keys.ArrowUp || keys.w) moveY -= 1;
  if (keys.ArrowDown || keys.s) moveY += 1;

  if (moveX !== 0 || moveY !== 0) {
    const len = Math.hypot(moveX, moveY) || 1;
    const speedBoost = keys.Shift ? 1.8 : 1;
    const step = carrier.speed * speedBoost;
    carrier.x += (moveX / len) * step;
    carrier.y += (moveY / len) * step;
    carrier.x = clamp(carrier.x, 40, field.width - 40);
    carrier.y = clamp(carrier.y, 60, field.height - 60);
  }
}

function findBestReceiver() {
  const carrier = getBallCarrier();
  if (!carrier) return null;

  const teammates = state.players.filter((p) => p.team === carrier.team && p.index !== carrier.index);
  if (!teammates.length) return null;

  let best = teammates[0];
  let bestDistance = Infinity;

  teammates.forEach((p) => {
    const dx = p.x - carrier.x;
    const dy = p.y - carrier.y;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDistance) {
      bestDistance = dist;
      best = p;
    }
  });

  return best;
}

function throwPass() {
  if (!state.playing || !state.started || !state.snapLocked) return;

  const carrier = getBallCarrier();
  const target = findBestReceiver();

  if (!carrier || !target) {
    setStatus('No receiver open. Incomplete pass.');
    advanceDown();
    return;
  }

  const dx = target.x - carrier.x;
  const dy = target.y - carrier.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 120) {
    state.ballCarrierIndex = target.index;
    state.selectedIndex = target.index;
    setStatus('Complete pass! Keep moving downfield.');
  } else {
    setStatus('Pass is underthrown. Incomplete.');
    advanceDown();
  }
}

function enemyAI() {
  const carrier = getBallCarrier();
  if (!carrier || !state.playing) return;

  state.players.forEach((player) => {
    if (player.team === carrier.team) return;

    const dx = carrier.x - player.x;
    const dy = carrier.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (dist < 110) {
      player.x += (dx / dist) * 1.5;
      player.y += (dy / dist) * 1.5;
    }

    const dx2 = carrier.x - player.x;
    const dy2 = carrier.y - player.y;
    const dist2 = Math.hypot(dx2, dy2) || 1;

    if (dist2 < 26) {
      state.playing = false;
      state.snapLocked = true;
      const gain = Math.round(Math.abs(carrier.x - 120) / 12);
      setStatus(`Tackle! ${gain} yards gained.`);
      state.down += 1;
      state.yardsToGo = Math.max(1, state.yardsToGo - gain);
      if (state.yardsToGo <= 0) {
        state.down = 1;
        state.yardsToGo = 10;
        setStatus(`First down!`);
      }
      if (carrier.x > field.width - 70 || carrier.x < 70) {
        scoreTouchdown(state.possession);
      }
      updateHud();
      setTimeout(() => {
        state.playing = true;
        state.snapLocked = false;
        setStatus('Next snap.');
      }, 700);
    }
  });
}

function updateGame(dt) {
  if (!state.started || !state.playing) return;

  state.clock -= dt;
  if (state.clock <= 0) {
    state.clock = 0;
    endDrive();
    return;
  }

  handleUserMovement();
  enemyAI();

  const carrier = getBallCarrier();
  if (!carrier) return;

  const endZoneHit = state.possession === 'home'
    ? carrier.x > field.width - 60
    : carrier.x < 60;

  if (endZoneHit) {
    scoreTouchdown(state.possession);
    return;
  }

  if (carrier.x < 40 || carrier.x > field.width - 40) {
    setStatus('Ball carrier pushed out of bounds.');
    advanceDown();
  }

  updateHud();
}

function drawField() {
  ctx.clearRect(0, 0, field.width, field.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, field.height);
  gradient.addColorStop(0, '#2ea75d');
  gradient.addColorStop(1, '#1d7c3b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, field.width, field.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, field.width - 20, field.height - 20);

  for (let i = 1; i < 10; i += 1) {
    const x = i * (field.width / 10);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, field.height);
    ctx.stroke();
  }

  ctx.fillStyle = '#dfeef4';
  ctx.fillRect(0, 0, 12, field.height);
  ctx.fillRect(field.width - 12, 0, 12, field.height);

  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(0, 150, 70, 240);
  ctx.fillRect(field.width - 70, 150, 70, 240);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = 'bold 14px Arial';
  for (let i = 0; i < 10; i++) {
    const x = 30 + i * 90;
    ctx.fillText(String(10 - i), x, 26);
  }
}

function drawPlayers() {
  state.players.forEach((player) => {
    ctx.beginPath();
    ctx.fillStyle = player.color;
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = player.accent;
    ctx.arc(player.x, player.y, player.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f5f8ff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.role, player.x, player.y + 4);

    if (player.index === state.ballCarrierIndex) {
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffd166';
      ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawStartOverlay() {
  if (!state.started) {
    ctx.fillStyle = 'rgba(10, 18, 14, 0.28)';
    ctx.fillRect(0, 0, field.width, field.height);
    ctx.fillStyle = '#f7fbff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px Arial';
    ctx.fillText('GRIDIRON ARCADE', field.width / 2, field.height / 2 - 24);
    ctx.font = '20px Arial';
    ctx.fillText('Press Start Game', field.width / 2, field.height / 2 + 18);
  }
}

function gameLoop(timestamp) {
  const dt = Math.min(0.033, (timestamp - (state.lastTime || timestamp)) / 1000 || 0.016);
  state.lastTime = timestamp;

  updateGame(dt);
  drawField();
  drawPlayers();
  drawStartOverlay();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = true;

  if (event.code === 'Space') {
    event.preventDefault();
    if (state.started && !state.snapLocked && !state.playing) {
      state.playing = true;
      state.snapLocked = true;
      setStatus('Ball is live. Run the play.');
    }
  }

  if (key === 'p') {
    throwPass();
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = false;
});

startButton.addEventListener('click', () => {
  beginDrive();
});

resetButton.addEventListener('click', () => {
  state.started = false;
  state.playing = false;
  state.onDrive = false;
  state.clock = 90;
  state.score = { home: 0, away: 0 };
  state.possession = 'home';
  state.down = 1;
  state.yardsToGo = 10;
  resetPlayers();
  setStatus('Press Start Game to begin the drive.');
  updateHud();
});

resetPlayers();
updateHud();
requestAnimationFrame(gameLoop);
