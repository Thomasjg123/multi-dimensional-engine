const connections = new Map();
const fallen = [];
let pendingConnection = null;

function epKey(spaceId, side) { return `${spaceId}:${side}`; }

function parseEpKey(key) {
  const [s, side] = key.split(':');
  return { spaceId: parseInt(s), side };
}

function setConnection(aKey, bKey) {
  if (aKey === bKey) { connections.set(aKey, aKey); return; }
  connections.set(aKey, bKey);
  connections.set(bKey, aKey);
}

function disconnectEndpoint(key) {
  const other = connections.get(key);
  if (other && other !== key) connections.delete(other);
  connections.delete(key);
}

function getConnection(key) {
  return connections.has(key) ? connections.get(key) : null;
}

function isEndpointOpen(key) {
  return !connections.has(key);
}

// ---- spaces ----
function createSpace() {
  const id = nextId++;
  connections.set(epKey(id, 'left'), epKey(id, 'left'));
  connections.set(epKey(id, 'right'), epKey(id, 'right'));
  if (activeSpaceId === null) activeSpaceId = id;
  return { id, label: `Space ${id}`, canvas: null, ctx: null, card: null, removed: false };
}
