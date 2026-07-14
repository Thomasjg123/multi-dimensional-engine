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
  if (activeSpaceId === space.id) {
    ctx.strokeStyle = '#8af';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
    ctx.setLineDash([]);
  }

  drawEndpoint(ctx, 0, 'left', space.id);
  drawEndpoint(ctx, CANVAS_W, 'right', space.id);

  // blocks
  const spaceBlocks = blocks.filter(b => b.alive && b.spaceId === space.id);
  for (const b of spaceBlocks) {
    const px = b.pos * PIXELS_PER_UNIT;
    const s = BLOCK_SIZE;
    const selected = b.id === selectedBlockId;
    ctx.fillStyle = selected ? '#aaccff' : '#88aaff';
    ctx.shadowColor = '#8af';
    ctx.shadowBlur = selected ? 12 : 6;
    ctx.fillRect(px - s / 2, LINE_Y - s / 2, s, s);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = selected ? '#fff' : 'rgba(255,255,255,0.6)';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(px - s / 2, LINE_Y - s / 2, s, s);
  }

  const info = space.card.querySelector('.cube-info');
  const aliveInSpace = spaceBlocks.length;
  const anyAlive = blocks.some(b => b.alive);
  if (aliveInSpace > 0) {
    info.innerHTML = `cubes: <span>${aliveInSpace}</span>`;
  } else {
    info.innerHTML = anyAlive ? `&nbsp;` : `<span style="color:#f88;">ALL DEAD</span>`;
  }

  const leftLabel = space.card.querySelector('.conn-l-status .status');
  const rightLabel = space.card.querySelector('.conn-r-status .status');
  leftLabel.textContent = formatConn(epKey(space.id, 'left'));
  leftLabel.className = 'status ' + connClass(epKey(space.id, 'left'));
  rightLabel.textContent = formatConn(epKey(space.id, 'right'));
  rightLabel.className = 'status ' + connClass(epKey(space.id, 'right'));
}
