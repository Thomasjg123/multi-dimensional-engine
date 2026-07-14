function logDebug(msg) {
  if (!debugRecording) return;
  console.log(`[F${debugFrame}] ${msg}`);
}

function resolveCollisions(dt) {
  const groups = {};
  for (const b of blocks) {
    if (!b.alive) continue;
    (groups[b.spaceId] || (groups[b.spaceId] = [])).push(b);
  }

  for (const sid in groups) {
    const group = groups[sid];
    if (group.length < 2) continue;
    group.sort((a, b) => a.pos - b.pos);

    for (let i = 0; i < group.length - 1; i++) {
      const a = group[i];
      const b = group[i + 1];
      const gap = b.pos - a.pos;
      const overlap = BLOCK_COLLISION_DIST - gap;
      if (overlap <= 0) continue;

      const force = overlap * REPULSION_STIFFNESS;
      a.vel -= force * dt;
      b.vel += force * dt;

      const shift = overlap * POSITION_CORRECTION / 2;
      a.pos -= shift;
      b.pos += shift;
    }

    for (const b of group) {
      if (b.pos < BLOCK_COLLISION_DIST) {
        const conn = getConnection(epKey(sid, 'left'));
        if (conn && conn !== epKey(sid, 'left')) {
          const target = parseEpKey(conn);
          const tg = groups[target.spaceId];
          if (tg) {
            for (const o of tg) {
              const eff = b.pos + (MAX_X - o.pos);
              const ov = BLOCK_COLLISION_DIST - eff;
              if (ov <= 0) continue;
              const f = ov * REPULSION_STIFFNESS;
              b.vel += f * dt;
              o.vel -= f * dt;
              const s = ov * POSITION_CORRECTION / 2;
              b.pos += s;
              o.pos -= s;
            }
          }
        }
      }
      if (b.pos > MAX_X - BLOCK_COLLISION_DIST) {
        const conn = getConnection(epKey(sid, 'right'));
        if (conn && conn !== epKey(sid, 'right')) {
          const target = parseEpKey(conn);
          const tg = groups[target.spaceId];
          if (tg) {
            for (const o of tg) {
              const eff = (MAX_X - b.pos) + o.pos;
              const ov = BLOCK_COLLISION_DIST - eff;
              if (ov <= 0) continue;
              const f = ov * REPULSION_STIFFNESS;
              b.vel -= f * dt;
              o.vel += f * dt;
              const s = ov * POSITION_CORRECTION / 2;
              b.pos -= s;
              o.pos += s;
            }
          }
        }
      }
    }
  }
}

function updateBlocks(dt) {
  for (const b of blocks) {
    if (!b.alive) continue;

    const prevPos = b.pos;
    const prevSpace = b.spaceId;

    let acc = globalGravity - globalDrag * b.vel;
    if (heldKeys.forward) acc += 3 * b.dir;

    b.vel += acc * dt;
    if (b.dir > 0) {
      b.vel = Math.max(0, b.vel);
    } else {
      b.vel = Math.min(0, b.vel);
    }
    b.pos += b.vel * dt;

    const sid = b.spaceId;
    const space = spaces.find(s => s.id === sid);
    if (!space) { b.vel = 0; continue; }

    if (b.pos < 0) {
      const conn = getConnection(epKey(sid, 'left'));
      logDebug(`BOUNDARY [${b.id}] space=${sid} pos=${b.pos.toFixed(3)} vel=${b.vel.toFixed(3)} -> left  conn=${conn}`);
      handleBoundary(b, conn, 'left');
      if (b.spaceId !== prevSpace) logDebug(`  TELEPORT [${b.id}] space ${prevSpace} -> ${b.spaceId}  pos=${b.pos.toFixed(3)} vel=${b.vel.toFixed(3)} dir=${b.dir}`);
    } else if (b.pos > MAX_X) {
      const conn = getConnection(epKey(sid, 'right'));
      logDebug(`BOUNDARY [${b.id}] space=${sid} pos=${b.pos.toFixed(3)} vel=${b.vel.toFixed(3)} -> right  conn=${conn}`);
      handleBoundary(b, conn, 'right');
      if (b.spaceId !== prevSpace) logDebug(`  TELEPORT [${b.id}] space ${prevSpace} -> ${b.spaceId}  pos=${b.pos.toFixed(3)} vel=${b.vel.toFixed(3)} dir=${b.dir}`);
    }
  }

  resolveCollisions(dt);

  if (debugRecording) {
    const snapshot = blocks.filter(b => b.alive).map(b => `[${b.id}] s=${b.spaceId} p=${b.pos.toFixed(2)} v=${b.vel.toFixed(2)}`).join('  ');
    logDebug(`STATE ${snapshot || '(none)'}`);
    debugFrame++;
  }
}
