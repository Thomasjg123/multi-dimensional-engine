function dieByFalling(b, side) {
  if (!b.alive) return;
  b.alive = false;

  const space = spaces.find(s => s.id === b.spaceId);
  if (!space) return;
  const canvas = space.canvas;
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;

  const canvasPx = b.pos * PIXELS_PER_UNIT;
  const screenX = rect.left + canvasPx / scaleX;
  const screenY = rect.top + LINE_Y / scaleY;

  const el = document.createElement('div');
  el.className = 'fallen-cube';
  el.style.background = '#f88';
  el.style.border = '1px solid #fff';
  el.style.left = screenX + 'px';
  el.style.top = screenY + 'px';
  document.body.appendChild(el);

  fallen.push({
    el, x: screenX, y: screenY,
    vy: -Math.random() * 200 - 100,
    vx: (Math.random() - 0.5) * 200 + b.vel * 10,
  });

  if (selectedBlockId === b.id) {
    selectedBlockId = null;
  }
}

function dieBySmashed(b, endpointKey) {
  if (!b.alive) return;
  const target = parseEpKey(endpointKey);
  if (b.spaceId !== target.spaceId) return;

  const epWorldPos = target.side === 'left' ? 0 : MAX_X;
  if (Math.abs(b.pos - epWorldPos) >= 0.6) return;

  b.alive = false;

  const space = spaces.find(s => s.id === b.spaceId);
  if (!space) return;
  const canvas = space.canvas;
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;

  const canvasPx = b.pos * PIXELS_PER_UNIT;
  const screenX = rect.left + canvasPx / scaleX;
  const screenY = rect.top + LINE_Y / scaleY;

  const el = document.createElement('div');
  el.className = 'fallen-cube';
  el.style.background = '#f88';
  el.style.border = '1px solid #fff';
  el.style.left = screenX + 'px';
  el.style.top = screenY + 'px';
  document.body.appendChild(el);

  fallen.push({
    el, x: screenX, y: screenY,
    vy: -Math.random() * 150 - 50,
    vx: (Math.random() - 0.5) * 300,
  });

  if (selectedBlockId === b.id) {
    selectedBlockId = null;
  }
}

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
