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
