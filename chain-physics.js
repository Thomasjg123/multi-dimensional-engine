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
