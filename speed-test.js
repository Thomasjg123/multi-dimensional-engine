const testCanvas = document.getElementById('test-canvas');
const testCtx = testCanvas.getContext('2d');
const statusEl = document.getElementById('test-status');
const logEl = document.getElementById('results-log');

let testSpace = null;
let stationaryBlock = null;
let movingBlocks = [];
let testSpeed = 0.5;
let testRunning = false;
let testFrame = 0;
let testMultiBlock = false;
const TEST_MAX_FRAMES = 300;
const SPEED_INCREMENT = 0.5;
const SPEED_MAX = 100;
const MULTI_COUNT = 5;

let savedGravity = 0;
let savedDrag = 0;

function renderTest() {
  const ctx = testCtx;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = '#1a1a3a';
  ctx.lineWidth = 1;
  for (let u = 0; u <= MAX_X; u += 1) {
    const x = u * PIXELS_PER_UNIT;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }

  ctx.strokeStyle = '#446';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, LINE_Y); ctx.lineTo(CANVAS_W, LINE_Y); ctx.stroke();

  if (testSpace) {
    drawEndpoint(ctx, 0, 'left', testSpace.id);
    drawEndpoint(ctx, CANVAS_W, 'right', testSpace.id);
  }

  if (stationaryBlock && stationaryBlock.alive) {
    const px = stationaryBlock.pos * PIXELS_PER_UNIT;
    const s = BLOCK_SIZE;
    ctx.fillStyle = '#ff6644';
    ctx.shadowColor = '#f64';
    ctx.shadowBlur = 8;
    ctx.fillRect(px - s / 2, LINE_Y - s / 2, s, s);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - s / 2, LINE_Y - s / 2, s, s);
  }

  for (const b of movingBlocks) {
    if (!b.alive) continue;
    const px = b.pos * PIXELS_PER_UNIT;
    const s = BLOCK_SIZE;
    ctx.fillStyle = '#88aaff';
    ctx.shadowColor = '#8af';
    ctx.shadowBlur = 6;
    ctx.fillRect(px - s / 2, LINE_Y - s / 2, s, s);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - s / 2, LINE_Y - s / 2, s, s);
  }

  if (testSpace && stationaryBlock) {
    const aliveCount = movingBlocks.filter(b => b.alive).length;
    const info = `${stationaryBlock ? 'target' : ''} pos=${stationaryBlock.pos.toFixed(2)}  moving=${aliveCount}  speed=${testSpeed.toFixed(1)}`;
    ctx.fillStyle = '#8af';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(info, 8, 4);
  }
}

function startTest(multiBlock) {
  if (testRunning) stopTest();

  blocks = [];
  selectedBlockId = null;

  testSpace = createSpace();
  spaces = [testSpace];

  stationaryBlock = spawnBlock(testSpace.id, MAX_X / 2);
  stationaryBlock.vel = 0;

  movingBlocks = [];

  if (multiBlock) {
    for (let i = 0; i < MULTI_COUNT; i++) {
      const b = spawnBlock(testSpace.id, 1.5 + i * BLOCK_COLLISION_DIST);
      b.vel = testSpeed;
      b.dir = 1;
      movingBlocks.push(b);
    }
  } else {
    const b = spawnBlock(testSpace.id, 1.5);
    b.vel = testSpeed;
    b.dir = 1;
    movingBlocks.push(b);
  }

  savedGravity = globalGravity;
  savedDrag = globalDrag;
  globalGravity = 0;
  globalDrag = 0;

  testMultiBlock = multiBlock;
  testRunning = true;
  testFrame = 0;
  logEl.innerHTML = '';

  const label = multiBlock ? `${MULTI_COUNT}-Block` : 'Single Block';
  addResult(`--- ${label} Test Started ---`, 'summary');
  addResult(`Testing speed: ${testSpeed.toFixed(1)}`);
  updateStatus(`Running ${label} test — speed ${testSpeed.toFixed(1)}`);
}

function updateTest(dt) {
  if (!testRunning) return;

  testFrame++;

  for (const mb of movingBlocks) {
    if (!mb.alive) continue;
    if (mb.pos > stationaryBlock.pos) {
      addResult(`speed=${testSpeed.toFixed(1)} → TUNNELED (frame ${testFrame})`, 'tunneled');
      nextSpeed();
      return;
    }
  }

  const allStopped = movingBlocks.every(b => !b.alive || Math.abs(b.vel) < 0.01);
  if (allStopped) {
    addResult(`speed=${testSpeed.toFixed(1)} → no tunnel (stopped, frame ${testFrame})`, 'safe');
    nextSpeed();
    return;
  }

  if (testFrame > TEST_MAX_FRAMES) {
    addResult(`speed=${testSpeed.toFixed(1)} → no tunnel (timeout, frame ${testFrame})`, 'safe');
    nextSpeed();
    return;
  }

  updateStatus(`Running — speed ${testSpeed.toFixed(1)} frame ${testFrame}`);
}

function nextSpeed() {
  if (testSpeed >= SPEED_MAX) {
    addResult(`Max speed ${SPEED_MAX} reached — no tunneling detected`, 'summary');
    stopTest();
    return;
  }

  testSpeed = Math.round((testSpeed + SPEED_INCREMENT) * 10) / 10;
  testFrame = 0;

  blocks = [];
  selectedBlockId = null;

  stationaryBlock = spawnBlock(testSpace.id, MAX_X / 2);
  stationaryBlock.vel = 0;

  movingBlocks = [];
  if (testMultiBlock) {
    for (let i = 0; i < MULTI_COUNT; i++) {
      const b = spawnBlock(testSpace.id, 1.5 + i * BLOCK_COLLISION_DIST);
      b.vel = testSpeed;
      b.dir = 1;
      movingBlocks.push(b);
    }
  } else {
    const b = spawnBlock(testSpace.id, 1.5);
    b.vel = testSpeed;
    b.dir = 1;
    movingBlocks.push(b);
  }

  addResult(`Testing speed: ${testSpeed.toFixed(1)}`);
  updateStatus(`Running — speed ${testSpeed.toFixed(1)}`);
}

function stopTest() {
  testRunning = false;
  globalGravity = savedGravity;
  globalDrag = savedDrag;
  addResult(`--- Test Stopped ---`, 'summary');
  updateStatus('Stopped');
}

function addResult(text, cls) {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = text;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function updateStatus(html) {
  statusEl.innerHTML = html;
}

document.getElementById('btn-start-single').addEventListener('click', () => startTest(false));
document.getElementById('btn-start-multi').addEventListener('click', () => startTest(true));
document.getElementById('btn-stop-test').addEventListener('click', stopTest);

let lastTime = performance.now();
function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  if (testRunning) {
    updateBlocks(dt);
    updateTest(dt);
  }

  renderTest();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
