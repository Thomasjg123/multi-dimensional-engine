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

  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const px = (e.clientX - rect.left) * scaleX;
    const worldPos = Math.max(0, Math.min(MAX_X, px / PIXELS_PER_UNIT));
    spawnBlock(space.id, worldPos);
    activeSpaceId = space.id;
  });

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const px = (e.clientX - rect.left) * scaleX;
    const worldPos = Math.max(0, Math.min(MAX_X, px / PIXELS_PER_UNIT));
    const b = getBlock(selectedBlockId);
    if (b && b.alive) {
      b.spaceId = space.id;
      activeSpaceId = space.id;
      b.pos = worldPos;
      b.vel = 0;
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
          for (const b of getAliveBlocks()) {
            dieBySmashed(b, key);
          }
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
