let spaces = [];
let nextId = 1;

const PIXELS_PER_UNIT = 28;
const CANVAS_W = 700, CANVAS_H = 60;
const LINE_Y = CANVAS_H / 2;
const MAX_X = CANVAS_W / PIXELS_PER_UNIT;

let globalGravity = 0;
let globalDrag = 0.02;
let activeSpaceId = null;

const SEGMENT_COUNT = 6;
const CHAIN_LINK_DIST = 0.35;
const CHAIN_MIN_DIST = 0.12;
const CHAIN_MAX_DIST = 0.6;
const CHAIN_BREAK_DIST = 0.85;
const CHAIN_SPRING_K = 40;
const CHAIN_DAMP = 6;
const HEAD_RADIUS = 8;
const BODY_RADIUS = 5;

const chain = {
  spaceId: null,
  headPos: MAX_X / 2,
  headVel: 0,
  headDir: 1,
  segments: [],
  segmentVels: [],
  alive: true,
};
