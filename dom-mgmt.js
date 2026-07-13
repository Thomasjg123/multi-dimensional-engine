function removeSpace(id) {
  const space = spaces.find(s => s.id === id);
  if (!space) return;
  space.removed = true;

  if (chain.spaceId === id) {
    const remaining = spaces.filter(s => s.id !== id);
    if (remaining.length > 0) {
      chain.spaceId = remaining[0].id;
      activeSpaceId = remaining[0].id;
    } else {
      chain.spaceId = null;
      activeSpaceId = null;
    }
    chain.headPos = MAX_X / 2; chain.headVel = 0;
    for (let i = 0; i < chain.segments.length; i++) {
      chain.segments[i] = chain.headPos - i * chain.headDir * CHAIN_LINK_DIST;
      chain.segmentVels[i] = 0;
    }
  }
  if (activeSpaceId === id) {
    const remaining = spaces.filter(s => s.id !== id);
    activeSpaceId = remaining.length > 0 ? remaining[0].id : null;
  }

  for (const [key, val] of [...connections]) {
    const { spaceId } = parseEpKey(key);
    if (spaceId === id) {
      connections.delete(key);
      if (val && val !== key) connections.delete(val);
    }
  }

  space.card.remove();
  spaces = spaces.filter(s => s.id !== id);
  updateAllConnLabels();
}
