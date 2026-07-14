function spawnBlock(spaceId, pos) {
  const b = {
    id: nextBlockId++,
    spaceId,
    pos: pos ?? MAX_X / 2,
    vel: 0,
    dir: 1,
    alive: true,
  };
  blocks.push(b);
  selectedBlockId = b.id;
  return b;
}

function getBlock(id) {
  return blocks.find(b => b.id === id);
}

function getAliveBlocks() {
  return blocks.filter(b => b.alive);
}

const BOUNDARY_MARGIN = BLOCK_COLLISION_DIST / 2;

function handleBoundary(b, conn, side) {
  const sid = b.spaceId;

  if (conn === null) {
    dieByFalling(b, side);
    return;
  }

  if (conn === epKey(sid, side)) {
    b.pos = Math.max(BOUNDARY_MARGIN, Math.min(MAX_X - BOUNDARY_MARGIN, b.pos));
    b.vel = 0;
    return;
  }

  const target = parseEpKey(conn);
  const spaceExists = spaces.some(s => s.id === target.spaceId);
  if (!spaceExists) {
    b.pos = Math.max(BOUNDARY_MARGIN, Math.min(MAX_X - BOUNDARY_MARGIN, b.pos));
    b.vel = 0;
    return;
  }

  b.spaceId = target.spaceId;

  const entryPos = target.side === 'left' ? BOUNDARY_MARGIN : MAX_X - BOUNDARY_MARGIN;
  b.pos = entryPos;

  if (target.side === 'left') {
    b.vel = Math.abs(b.vel);
    b.dir = 1;
  } else {
    b.vel = -Math.abs(b.vel);
    b.dir = -1;
  }
}
