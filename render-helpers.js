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
