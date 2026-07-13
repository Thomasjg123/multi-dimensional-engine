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
