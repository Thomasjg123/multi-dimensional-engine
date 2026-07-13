const heldKeys = { forward: false };

document.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'ArrowUp') { heldKeys.forward = true; e.preventDefault(); }
});
document.addEventListener('keyup', e => {
  if (e.key === ' ' || e.key === 'ArrowUp') { heldKeys.forward = false; e.preventDefault(); }
});

const container = document.getElementById('spaces-container');

function update(dt) {
  if (chain.alive) updateChain(dt);
  updateFallen(dt);
}

function render() {
  for (const space of spaces) {
    if (!space.removed) renderSpace(space);
  }
}

let lastTime = performance.now();
function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function init() {
  const space = createSpace();
  spaces.push(space);
  addSpaceCard(space);
  resetChain();

  document.getElementById('btn-add-space').addEventListener('click', () => {
    const s = createSpace();
    spaces.push(s);
    addSpaceCard(s);
  });

  document.getElementById('btn-stop-all').addEventListener('click', () => { chain.headVel = 0; });

  document.getElementById('btn-reset-all').addEventListener('click', () => {
    resetChain();
  });

  document.getElementById('gravity').addEventListener('input', function() {
    globalGravity = parseFloat(this.value);
    document.getElementById('gravity-val').textContent = globalGravity.toFixed(1);
  });

  document.getElementById('drag').addEventListener('input', function() {
    globalDrag = parseFloat(this.value);
    document.getElementById('drag-val').textContent = globalDrag.toFixed(3);
  });

  requestAnimationFrame(loop);
}

init();
