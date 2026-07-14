function removeSpace(id) {
  const space = spaces.find(s => s.id === id);
  if (!space) return;
  space.removed = true;

  for (const b of blocks) {
    if (b.spaceId === id && b.alive) {
      const remaining = spaces.filter(s => s.id !== id);
      if (remaining.length > 0) {
        b.spaceId = remaining[0].id;
        activeSpaceId = remaining[0].id;
      } else {
        b.spaceId = null;
        activeSpaceId = null;
      }
      b.pos = MAX_X / 2;
      b.vel = 0;
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
