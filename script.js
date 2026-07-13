// ---- state ----
let spaces = [];
let nextId = 1;

const PIXELS_PER_UNIT = 28;
const CANVAS_W = 700, CANVAS_H = 60;
const LINE_Y = CANVAS_H / 2;
const MAX_X = CANVAS_W / PIXELS_PER_UNIT;

let globalGravity = 0;
let globalDrag = 0.02;
let activeSpaceId = null;

const SEGMENT_COUNT = 6;
const CHAIN_LINK_DIST = 0.35;
const CHAIN_MIN_DIST = 0.12;
const CHAIN_MAX_DIST = 0.6;
const CHAIN_BREAK_DIST = 0.85;
const CHAIN_SPRING_K = 40;
const CHAIN_DAMP = 6;
const HEAD_RADIUS = 8;
const BODY_RADIUS = 5;

const chain = {
  spaceId: null,
  headPos: MAX_X / 2,
  headVel: 0,
  headDir: 1,
  segments: [],
  segmentVels: [],
  alive: true,
};

function resetChain() {
  chain.headPos = MAX_X / 2;
  chain.headVel = 0;
  chain.headDir = 1;
  chain.segments = [];
  chain.segmentVels = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    chain.segments.push(chain.headPos - i * chain.headDir * CHAIN_LINK_DIST);
    chain.segmentVels.push(0);
  }
  chain.alive = true;
  if (spaces.length > 0) {
    chain.spaceId = spaces[0].id;
    activeSpaceId = spaces[0].id;
  }
}

const connections = new Map();
const fallen = [];
let pendingConnection = null;

// ---- connection helpers ----
function epKey(spaceId, side) { return `${spaceId}:${side}`; }

function parseEpKey(key) {
  const [s, side] = key.split(':');
  return { spaceId: parseInt(s), side };
}

function setConnection(aKey, bKey) {
  if (aKey === bKey) { connections.set(aKey, aKey); return; }
  connections.set(aKey, bKey);
  connections.set(bKey, aKey);
}

function disconnectEndpoint(key) {
  const other = connections.get(key);
  if (other && other !== key) connections.delete(other);
  connections.delete(key);
}

function getConnection(key) {
  return connections.has(key) ? connections.get(key) : null;
}

function isEndpointOpen(key) {
  return !connections.has(key);
}

// ---- spaces ----
function createSpace() {
  const id = nextId++;
  connections.set(epKey(id, 'left'), epKey(id, 'left'));
  connections.set(epKey(id, 'right'), epKey(id, 'right'));
  if (chain.spaceId === null) chain.spaceId = id;
  if (activeSpaceId === null) activeSpaceId = id;
  return { id, label: `Space ${id}`, canvas: null, ctx: null, card: null, removed: false };
}

// ---- death ----
function dieByFalling(side) {
  if (!chain.alive) return;
  chain.alive = false;

  const space = spaces.find(s => s.id === chain.spaceId);
  if (!space) return;
  const canvas = space.canvas;
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;

  for (let i = 0; i < chain.segments.length; i++) {
    const segPos = chain.segments[i];
    const canvasPx = segPos * PIXELS_PER_UNIT;
    const screenX = rect.left + canvasPx / scaleX;
    const screenY = rect.top + LINE_Y / scaleY;

    const el = document.createElement('div');
    el.className = 'fallen-cube';
    el.style.background = i === 0 ? '#f88' : `hsl(${200 + i * 20}, 80%, 60%)`;
    el.style.border = '1px solid #fff';
    el.style.borderRadius = i === 0 ? '50%' : '0';
    el.style.left = screenX + 'px';
    el.style.top = screenY + 'px';
    document.body.appendChild(el);

    fallen.push({
      el, x: screenX, y: screenY,
      vy: -Math.random() * 200 - 100,
      vx: (Math.random() - 0.5) * 200 + chain.headVel * 10,
    });
  }
}

function dieBySmashed(endpointKey) {
  if (!chain.alive) return;
  const target = parseEpKey(endpointKey);
  if (chain.spaceId !== target.spaceId) return;

  const epWorldPos = target.side === 'left' ? 0 : MAX_X;
  let near = false;
  for (const seg of chain.segments) {
    if (Math.abs(seg - epWorldPos) < 0.6) { near = true; break; }
  }
  if (!near) return;

  chain.alive = false;

  const space = spaces.find(s => s.id === chain.spaceId);
  if (!space) return;
  const canvas = space.canvas;
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;

  for (let i = 0; i < chain.segments.length; i++) {
    const segPos = chain.segments[i];
    const canvasPx = segPos * PIXELS_PER_UNIT;
    const screenX = rect.left + canvasPx / scaleX;
    const screenY = rect.top + LINE_Y / scaleY;

    const el = document.createElement('div');
    el.className = 'fallen-cube';
    el.style.background = i === 0 ? '#f88' : `hsl(${200 + i * 20}, 80%, 60%)`;
    el.style.border = '1px solid #fff';
    el.style.borderRadius = i === 0 ? '50%' : '0';
    el.style.left = screenX + 'px';
    el.style.top = screenY + 'px';
    document.body.appendChild(el);

    fallen.push({
      el, x: screenX, y: screenY,
      vy: -Math.random() * 150 - 50,
      vx: (Math.random() - 0.5) * 300,
    });
  }
}

// ---- simulation ----
function updateChain(dt) {
  if (!chain.alive) return;

  let acc = globalGravity - globalDrag * chain.headVel;
  if (heldKeys.forward) acc += 3 * chain.headDir;

  chain.headVel += acc * dt;
  if (chain.headDir > 0) {
    chain.headVel = Math.max(0, chain.headVel);
  } else {
    chain.headVel = Math.min(0, chain.headVel);
  }
  chain.headPos += chain.headVel * dt;
  chain.segments[0] = chain.headPos;

  // body segments: spring + min/max/break
  for (let i = 1; i < chain.segments.length; i++) {
    const prev = chain.segments[i - 1];
    const curr = chain.segments[i];
    const offset = curr - prev;
    const dist = Math.abs(offset);
    const sign = offset >= 0 ? 1 : -1;

    // spring toward natural link distance behind previous segment
    const targetDist = CHAIN_LINK_DIST;
    const springForce = -CHAIN_SPRING_K * (dist - targetDist);
    const dampForce = -CHAIN_DAMP * chain.segmentVels[i] * sign;
    chain.segmentVels[i] += (springForce + dampForce) * dt;
    chain.segments[i] += chain.segmentVels[i] * dt;

    // enforce min/max
    const newOffset = chain.segments[i] - prev;
    const newDist = Math.abs(newOffset);
    const newSign = newOffset >= 0 ? 1 : -1;

    if (newDist > CHAIN_MAX_DIST) {
      chain.segments[i] = prev + newSign * CHAIN_MAX_DIST;
      chain.segmentVels[i] = 0;
    } else if (newDist < CHAIN_MIN_DIST) {
      chain.segments[i] = prev + newSign * CHAIN_MIN_DIST;
      chain.segmentVels[i] = 0;
    }

    // break check
    if (Math.abs(chain.segments[i] - prev) > CHAIN_BREAK_DIST) {
      dieByFalling(chain.headDir > 0 ? 'right' : 'left');
      return;
    }
  }

  // head boundary check
  const sid = chain.spaceId;
  const space = spaces.find(s => s.id === sid);
  if (!space) { chain.headVel = 0; return; }

  if (chain.headPos < 0) {
    const conn = getConnection(epKey(sid, 'left'));
    handleBoundary(conn, 'left');
  } else if (chain.headPos > MAX_X) {
    const conn = getConnection(epKey(sid, 'right'));
    handleBoundary(conn, 'right');
  }
}

function handleBoundary(conn, side) {
  const sid = chain.spaceId;

  if (conn === null) {
    dieByFalling(side);
    return;
  }

  if (conn === epKey(sid, side)) {
    chain.headPos = Math.max(0, Math.min(MAX_X, chain.headPos));
    chain.headVel = 0;
    return;
  }

  const target = parseEpKey(conn);
  const spaceExists = spaces.some(s => s.id === target.spaceId);
  if (!spaceExists) {
    chain.headPos = Math.max(0, Math.min(MAX_X, chain.headPos));
    chain.headVel = 0;
    return;
  }

  // move entire chain to new space
  chain.spaceId = target.spaceId;
  activeSpaceId = target.spaceId;

  const entryPos = target.side === 'left' ? 0 : MAX_X;
  const delta = entryPos - chain.headPos;
  chain.headPos = entryPos;
  for (let i = 0; i < chain.segments.length; i++) {
    chain.segments[i] += delta;
    chain.segmentVels[i] = 0;
  }

  if (target.side === 'left') {
    chain.headVel = Math.abs(chain.headVel);
    chain.headDir = 1;
  } else {
    chain.headVel = -Math.abs(chain.headVel);
    chain.headDir = -1;
  }
}

// ---- rendering ----
function renderSpace(space) {
  const ctx = space.ctx;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // grid
  ctx.strokeStyle = '#1a1a3a';
  ctx.lineWidth = 1;
  for (let u = 0; u <= MAX_X; u += 1) {
    const x = u * PIXELS_PER_UNIT;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }

  // axis
  ctx.strokeStyle = '#446';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, LINE_Y); ctx.lineTo(CANVAS_W, LINE_Y); ctx.stroke();

  // active highlight
  if (activeSpaceId === space.id && chain.alive && chain.spaceId === space.id) {
    ctx.strokeStyle = '#8af';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
    ctx.setLineDash([]);
  }

  drawEndpoint(ctx, 0, 'left', space.id);
  drawEndpoint(ctx, CANVAS_W, 'right', space.id);

  // chain
  if (chain.alive && chain.spaceId === space.id) {
    const segs = chain.segments;

    // connecting lines
    ctx.strokeStyle = 'rgba(136, 170, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < segs.length; i++) {
      const px = segs[i] * PIXELS_PER_UNIT;
      if (i === 0) ctx.moveTo(px, LINE_Y);
      else ctx.lineTo(px, LINE_Y);
    }
    ctx.stroke();

    // body segments (tail to head, so head draws on top)
    for (let i = segs.length - 1; i >= 0; i--) {
      const px = segs[i] * PIXELS_PER_UNIT;
      const t = i / (segs.length - 1);
      const alpha = 0.4 + 0.6 * (1 - t);

      if (i === 0) {
        // head
        const dir = chain.headDir;
        const tipX = px + dir * HEAD_RADIUS;
        ctx.fillStyle = `rgba(136, 200, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(tipX, LINE_Y);
        ctx.lineTo(px - dir * HEAD_RADIUS * 0.6, LINE_Y - HEAD_RADIUS * 0.8);
        ctx.lineTo(px - dir * HEAD_RADIUS * 0.6, LINE_Y + HEAD_RADIUS * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        // eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px + dir * 2, LINE_Y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // body
        const r = BODY_RADIUS * (1 - t * 0.4);
        ctx.fillStyle = `rgba(100, 160, 255, ${alpha * 0.7})`;
        ctx.shadowColor = '#8af';
        ctx.shadowBlur = 4;
        ctx.fillRect(px - r, LINE_Y - r, r * 2, r * 2);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px - r, LINE_Y - r, r * 2, r * 2);
      }
    }
  }

  const info = space.card.querySelector('.cube-info');
  if (chain.alive && chain.spaceId === space.id) {
    info.innerHTML = `head: <span>${chain.headPos.toFixed(2)}</span>  vel: <span>${chain.headVel.toFixed(2)}</span>  length: <span>${chain.segments.length}</span>`;
  } else {
    info.innerHTML = chain.alive ? `&nbsp;` : `<span style="color:#f88;">DEAD</span>`;
  }

  const leftLabel = space.card.querySelector('.conn-l-status .status');
  const rightLabel = space.card.querySelector('.conn-r-status .status');
  leftLabel.textContent = formatConn(epKey(space.id, 'left'));
  leftLabel.className = 'status ' + connClass(epKey(space.id, 'left'));
  rightLabel.textContent = formatConn(epKey(space.id, 'right'));
  rightLabel.className = 'status ' + connClass(epKey(space.id, 'right'));
}

function drawEndpoint(ctx, x, side, spaceId) {
  const conn = getConnection(epKey(spaceId, side));
  const isSelf = conn === epKey(spaceId, side);
  const isOpen = conn === null;

  if (isSelf) {
    ctx.strokeStyle = '#f88';
    ctx.lineWidth = 3;
    const lx = side === 'left' ? x + 1 : x - 1;
    ctx.beginPath(); ctx.moveTo(lx, LINE_Y - 12); ctx.lineTo(lx, LINE_Y + 12); ctx.stroke();
    ctx.strokeStyle = '#f44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx - 4, LINE_Y - 4); ctx.lineTo(lx + 4, LINE_Y + 4);
    ctx.moveTo(lx + 4, LINE_Y - 4); ctx.lineTo(lx - 4, LINE_Y + 4);
    ctx.stroke();
  } else if (isOpen) {
    ctx.strokeStyle = '#fa8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    const lx = side === 'left' ? x + 1 : x - 1;
    ctx.beginPath(); ctx.moveTo(lx, LINE_Y - 12); ctx.lineTo(lx, LINE_Y + 12); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fa8';
    ctx.font = '9px monospace';
    ctx.textAlign = side === 'left' ? 'right' : 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('OPEN', side === 'left' ? x - 4 : x + 4, LINE_Y - 14);
  } else {
    const dest = parseEpKey(conn);
    ctx.fillStyle = '#8f8';
    ctx.font = '10px monospace';
    ctx.textAlign = side === 'left' ? 'right' : 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${dest.spaceId}:${dest.side === 'left' ? '\u25C0' : '\u25B6'}`,
      side === 'left' ? x - 4 : x + 4, LINE_Y - 14);
    ctx.strokeStyle = '#8f8';
    ctx.lineWidth = 2;
    const dir = side === 'left' ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(x, LINE_Y - 8); ctx.lineTo(x + dir * 10, LINE_Y - 8); ctx.stroke();
  }
}

function connClass(key) {
  const conn = getConnection(key);
  if (conn === null) return 'open';
  if (conn === key) return 'deadend';
  const a = parseEpKey(key);
  const b = parseEpKey(conn);
  if (a.spaceId === b.spaceId) return 'selfloop';
  return 'connected';
}

function formatConn(key) {
  const conn = getConnection(key);
  if (conn === null) return 'OPEN';
  if (conn === key) return 'self (wall)';
  const t = parseEpKey(conn);
  return `\u2192 ${t.spaceId}:${t.side === 'left' ? 'L' : 'R'}`;
}

// ---- fallen cubes ----
function updateFallen(dt) {
  const grav = 600;
  for (let i = fallen.length - 1; i >= 0; i--) {
    const f = fallen[i];
    f.vy += grav * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.el.style.left = f.x + 'px';
    f.el.style.top = f.y + 'px';
    if (f.y > window.innerHeight + 200 || f.x < -200 || f.x > window.innerWidth + 200) {
      f.el.remove();
      fallen.splice(i, 1);
    }
  }
}

// ---- input ----
const heldKeys = { forward: false };

document.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'ArrowUp') { heldKeys.forward = true; e.preventDefault(); }
});
document.addEventListener('keyup', e => {
  if (e.key === ' ' || e.key === 'ArrowUp') { heldKeys.forward = false; e.preventDefault(); }
});

// ---- DOM ----
const container = document.getElementById('spaces-container');

function clearPending() {
  pendingConnection = null;
  document.querySelectorAll('.conn-btn.pending').forEach(el => el.classList.remove('pending'));
}

function updateAllConnLabels() {
  for (const space of spaces) {
    const leftLabel = space.card.querySelector('.conn-l-status .status');
    const rightLabel = space.card.querySelector('.conn-r-status .status');
    leftLabel.textContent = formatConn(epKey(space.id, 'left'));
    leftLabel.className = 'status ' + connClass(epKey(space.id, 'left'));
    rightLabel.textContent = formatConn(epKey(space.id, 'right'));
    rightLabel.className = 'status ' + connClass(epKey(space.id, 'right'));
  }
}

function addSpaceCard(space) {
  const card = document.createElement('div');
  card.className = 'space-card';
  card.dataset.spaceId = space.id;

  card.innerHTML = `
    <div class="space-header">
      <span class="label">${space.label}</span>
      <button class="btn-remove-space danger" data-id="${space.id}">✕</button>
    </div>
    <div class="space-body">
      <button class="conn-btn conn-l" data-ep="${epKey(space.id, 'left')}">L</button>
      <canvas id="canvas-${space.id}" width="${CANVAS_W}" height="${CANVAS_H}"
              data-space-id="${space.id}"></canvas>
      <button class="conn-btn conn-r" data-ep="${epKey(space.id, 'right')}">R</button>
    </div>
    <div class="space-footer">
      <div class="conn-status">
        <span class="conn-l-status">L: <span class="status deadend">self (wall)</span></span>
        <span class="conn-r-status">R: <span class="status deadend">self (wall)</span></span>
      </div>
      <button class="btn-forward" data-id="${space.id}">▶ Forward</button>
    </div>
    <div class="cube-info">pos: <span>0.00</span>  vel: <span>0.00</span></div>
  `;

  container.appendChild(card);

  const canvas = card.querySelector('canvas');
  space.canvas = canvas;
  space.ctx = canvas.getContext('2d');
  space.card = card;

  canvas.addEventListener('click', e => {
    if (!chain.alive) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const px = (e.clientX - rect.left) * scaleX;
    const worldPos = Math.max(0, Math.min(MAX_X, px / PIXELS_PER_UNIT));
    chain.spaceId = space.id;
    activeSpaceId = space.id;
    chain.headPos = worldPos;
    chain.headVel = 0;
    for (let i = 0; i < chain.segments.length; i++) {
      chain.segments[i] = worldPos - i * chain.headDir * CHAIN_LINK_DIST;
      chain.segmentVels[i] = 0;
    }
  });

  card.querySelector('.btn-remove-space').addEventListener('click', () => removeSpace(space.id));

  const btnF = card.querySelector('.btn-forward');
  btnF.addEventListener('mousedown', () => { heldKeys.forward = true; });
  btnF.addEventListener('mouseup', () => { heldKeys.forward = false; });
  btnF.addEventListener('mouseleave', () => { heldKeys.forward = false; });

  card.querySelectorAll('.conn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.ep;
      const conn = getConnection(key);

      if (pendingConnection === null) {
        if (conn && conn !== key) {
          dieBySmashed(key);
          disconnectEndpoint(key);
          updateAllConnLabels();
        } else {
          pendingConnection = key;
          btn.classList.add('pending');
        }
      } else if (pendingConnection === key) {
        pendingConnection = null;
        btn.classList.remove('pending');
      } else {
        setConnection(pendingConnection, key);
        clearPending();
        updateAllConnLabels();
      }
    });
  });

  return card;
}

function removeSpace(id) {
  const space = spaces.find(s => s.id === id);
  if (!space) return;
  space.removed = true;

  if (chain.spaceId === id) {
    const remaining = spaces.filter(s => s.id !== id);
    if (remaining.length > 0) {
      chain.spaceId = remaining[0].id;
      activeSpaceId = remaining[0].id;
    } else {
      chain.spaceId = null;
      activeSpaceId = null;
    }
    chain.headPos = MAX_X / 2; chain.headVel = 0;
    for (let i = 0; i < chain.segments.length; i++) {
      chain.segments[i] = chain.headPos - i * chain.headDir * CHAIN_LINK_DIST;
      chain.segmentVels[i] = 0;
    }
  }
  if (activeSpaceId === id) {
    const remaining = spaces.filter(s => s.id !== id);
    activeSpaceId = remaining.length > 0 ? remaining[0].id : null;
  }

  for (const [key, val] of [...connections]) {
    const { spaceId } = parseEpKey(key);
    if (spaceId === id) {
      connections.delete(key);
      if (val && val !== key) connections.delete(val);
    }
  }

  space.card.remove();
  spaces = spaces.filter(s => s.id !== id);
  updateAllConnLabels();
}

// ---- main loop ----
function update(dt) {
  if (chain.alive) updateChain(dt);
  updateFallen(dt);
}

function render() {
  for (const space of spaces) {
    if (!space.removed) renderSpace(space);
  }
}

let lastTime = performance.now();
function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ---- init ----
function init() {
  const space = createSpace();
  spaces.push(space);
  addSpaceCard(space);
  resetChain();

  document.getElementById('btn-add-space').addEventListener('click', () => {
    const s = createSpace();
    spaces.push(s);
    addSpaceCard(s);
  });

  document.getElementById('btn-stop-all').addEventListener('click', () => { chain.headVel = 0; });

  document.getElementById('btn-reset-all').addEventListener('click', () => {
    resetChain();
  });

  document.getElementById('gravity').addEventListener('input', function() {
    globalGravity = parseFloat(this.value);
    document.getElementById('gravity-val').textContent = globalGravity.toFixed(1);
  });

  document.getElementById('drag').addEventListener('input', function() {
    globalDrag = parseFloat(this.value);
    document.getElementById('drag-val').textContent = globalDrag.toFixed(3);
  });

  requestAnimationFrame(loop);
}

init();
