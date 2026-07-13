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
