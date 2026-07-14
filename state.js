let spaces = [];
let nextId = 1;
let nextBlockId = 1;

const PIXELS_PER_UNIT = 28;
const CANVAS_W = 700, CANVAS_H = 60;
const LINE_Y = CANVAS_H / 2;
const MAX_X = CANVAS_W / PIXELS_PER_UNIT;

let globalGravity = 0;
let globalDrag = 0.02;
let activeSpaceId = null;

const BLOCK_SIZE = 10;
const BLOCK_COLLISION_DIST = BLOCK_SIZE / PIXELS_PER_UNIT;
const REPULSION_STIFFNESS = 50.0;
const POSITION_CORRECTION = 0.5;

let blocks = [];
let selectedBlockId = null;
const heldKeys = { forward: false };

let debugRecording = false;
let debugFrame = 0;
