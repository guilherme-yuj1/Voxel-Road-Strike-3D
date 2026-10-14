// Automated test suite for PROMPT 6: Synchronize aim lines with weapons & correct Dispersora trajectory
const fs = require('fs');
const vm = require('vm');

const elements = {};
const sandbox = {
  console: console,
  Math: Math,
  Float32Array: Float32Array,
  Uint16Array: Uint16Array,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date,
  Set: Set,
  Map: Map,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  isFinite: isFinite,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  window: {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  document: {
    getElementById: (id) => {
      if (!elements[id]) {
        elements[id] = {
          id,
          textContent: '',
          innerHTML: '',
          className: '',
          style: {},
          classList: {
            contains: () => false,
            add: () => {},
            remove: () => {},
            toggle: () => {}
          },
          querySelectorAll: () => [],
          querySelector: () => null,
          addEventListener: () => {}
        };
      }
      return elements[id];
    },
    querySelectorAll: (selector) => [],
    addEventListener: () => {}
  },
  AudioContext: class {
    createGain() { return { gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
    createOscillator() { return { type: '', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    createBufferSource() { return { buffer: null, playbackRate: { value: 1 }, connect: () => {}, start: () => {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
  }
};
sandbox.webkitAudioContext = sandbox.AudioContext;

// Load script.js and expose globals
let scriptCode = fs.readFileSync('script.js', 'utf8');
scriptCode += `
globalThis.VoxelBuilder = VoxelBuilder;
globalThis.VEHICLE_DATA = VEHICLE_DATA;
globalThis.WeaponSystem = WeaponSystem;
globalThis.Game = Game;
globalThis.PLAYER_WEAPONS = PLAYER_WEAPONS;
globalThis.PlayerVehicle = PlayerVehicle;
globalThis.Projectile = Projectile;
globalThis.RoadManager = RoadManager;
`;

const ctx = vm.createContext(sandbox);
vm.runInContext(scriptCode, ctx);

const VoxelBuilder = sandbox.VoxelBuilder;
const VEHICLE_DATA = sandbox.VEHICLE_DATA;
const WeaponSystem = sandbox.WeaponSystem;
const Game = sandbox.Game;
const PLAYER_WEAPONS = sandbox.PLAYER_WEAPONS;
const PlayerVehicle = sandbox.PlayerVehicle;
const Projectile = sandbox.Projectile;
const Road = sandbox.Road;

console.log("=== EXECUTING PROMPT 6 MANDATORY TESTS (SEÇÃO 8) ===");

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    console.log(`[PASS] Test ${total}: ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] Test ${total}: ${msg}`);
  }
}

// Mock Road with curvature
const mockRoad = {
  getCurveX: (z) => Math.sin(z * 0.0035) * 28.0 + Math.sin(z * 0.008) * 12.0,
  getTangentAngle: (z) => {
    const dz = 1.0;
    const x0 = Math.sin(z * 0.0035) * 28.0 + Math.sin(z * 0.008) * 12.0;
    const x1 = Math.sin((z + dz) * 0.0035) * 28.0 + Math.sin((z + dz) * 0.008) * 12.0;
    return Math.atan2(x1 - x0, dz);
  }
};

const dummyGame = {
  road: mockRoad,
  selectedWeapon: 'machinegun',
  player: { type: 'interceptor', worldX: 0, worldY: 0.5, worldZ: 100, destroyed: false },
  state: 'PLAYING',
  inputs: {},
  sound: {
    playPlayerMachinegun: () => {},
    playPlayerShotgun: () => {},
    playPlayerCannon: () => {},
    playHit: () => {},
    playClick: () => {}
  },
  camera: { addShake: () => {} },
  debris: { spawnHitSparks: () => {} }
};

const ws = new WeaponSystem(dummyGame);

// TEST 1: Teste cada arma individualmente e confira se a linha de mira corresponde à cor do projétil
for (const wKey of ['machinegun', 'shotgun', 'cannon']) {
  const trajs = ws.getTrajectories(wKey, 0, 0, 0, 0, { forAim: true });
  const weaponCfg = PLAYER_WEAPONS[wKey];
  for (const t of trajs) {
    assert(
      t.color[0] === weaponCfg.color[0] &&
      t.color[1] === weaponCfg.color[1] &&
      t.color[2] === weaponCfg.color[2],
      `Aim line color for ${wKey} matches projectile color [${weaponCfg.color.join(', ')}] without duplication`
    );
  }
}

// TEST 2: Troque de arma e verifique se a mira é atualizada imediatamente
dummyGame.setWeapon = Game.prototype.setWeapon;
dummyGame.updateSelectionDetails = Game.prototype.updateSelectionDetails;
dummyGame.selectedWeapon = 'machinegun';

dummyGame.setWeapon('shotgun');
assert(dummyGame.selectedWeapon === 'shotgun', "Weapon switched to shotgun");
let activeTrajs = ws.getTrajectories(dummyGame.selectedWeapon, 0, 0, 0, 0, { forAim: true });
assert(activeTrajs.length === 3, "Aim trajectories updated immediately to 3 for shotgun");
assert(activeTrajs[0].color[1] === PLAYER_WEAPONS.shotgun.color[1], "Aim color updated immediately to shotgun cyan");

dummyGame.setWeapon('cannon');
assert(dummyGame.selectedWeapon === 'cannon', "Weapon switched to cannon");
activeTrajs = ws.getTrajectories(dummyGame.selectedWeapon, 0, 0, 0, 0, { forAim: true });
assert(activeTrajs.length === 1, "Aim trajectory updated immediately to 1 for cannon");
assert(activeTrajs[0].color[0] === PLAYER_WEAPONS.cannon.color[0], "Aim color updated immediately to cannon orange");

dummyGame.setWeapon('machinegun');
assert(dummyGame.selectedWeapon === 'machinegun', "Weapon switched to machinegun");
activeTrajs = ws.getTrajectories(dummyGame.selectedWeapon, 0, 0, 0, 0, { forAim: true });
assert(activeTrajs.length === 2, "Aim trajectories updated immediately to 2 for machinegun");
assert(activeTrajs[0].color[0] === PLAYER_WEAPONS.machinegun.color[0], "Aim color updated immediately to machinegun yellow");

// TEST 3: Confirme que cada linha começa na origem correta
for (const vKey of ['interceptor', 'raptor', 'titan']) {
  dummyGame.player.type = vKey;
  
  // Metralhadora: Paralamas esquerdo e direito
  const mg = ws.getTrajectories('machinegun', 0, 0, 0, 0, { forAim: true });
  assert(mg.length === 2, `Metralhadora on ${vKey} has 2 symmetric origins`);
  assert(mg[0].originX > 0 && mg[1].originX < 0, `Metralhadora on ${vKey} left fender X > 0 (${mg[0].originX}) and right fender X < 0 (${mg[1].originX})`);
  assert(mg[0].originZ > 1.8, `Metralhadora on ${vKey} nozzle tip is at front fender (+Z = ${mg[0].originZ})`);

  // Dispersora: Boca do canhão frontal
  const sg = ws.getTrajectories('shotgun', 0, 0, 0, 0, { forAim: true });
  assert(sg.length === 3, `Dispersora on ${vKey} has 3 trajectories originating from front cannon nozzle`);
  assert(Math.abs(sg[0].originX) < 0.0001 && Math.abs(sg[1].originX) < 0.0001 && Math.abs(sg[2].originX) < 0.0001, `Dispersora on ${vKey} is centered on grille (X=0)`);
  assert(sg[0].originZ >= 2.35, `Dispersora on ${vKey} nozzle tip is at front bumper (+Z = ${sg[0].originZ})`);

  // Canhão Pesado: Boca do canhão no topo
  const cn = ws.getTrajectories('cannon', 0, 0, 0, 0, { forAim: true });
  assert(cn.length === 1, `Canhão Pesado on ${vKey} has 1 origin`);
  assert(Math.abs(cn[0].originX) < 0.0001, `Canhão Pesado on ${vKey} is centered on roof (X=0)`);
  assert(cn[0].originY >= 0.95, `Canhão Pesado on ${vKey} is on top of cabin (+Y = ${cn[0].originY})`);
}

// TEST 4: Teste a Metralhadora durante curvas
dummyGame.player.type = 'interceptor';
const curveZ = 250;
const roadAngleAtCurve = mockRoad.getTangentAngle(curveZ);
const curveCenterX = mockRoad.getCurveX(curveZ);
const playerXOnCurve = curveCenterX + 2.0; // 2.0m à direita do centro

const mgCurveTrajs = ws.getTrajectories('machinegun', playerXOnCurve, 0.5, curveZ, roadAngleAtCurve, { forAim: true });
assert(mgCurveTrajs.length === 2, "Metralhadora on curve has 2 trajectories");
// Check that origin rotates with roadAngle
const expectedLeftX = playerXOnCurve + 0.74 * Math.cos(roadAngleAtCurve) + 1.96 * Math.sin(roadAngleAtCurve);
assert(Math.abs(mgCurveTrajs[0].originX - expectedLeftX) < 0.001, "Left barrel origin correctly rotated with vehicle on curve");

// Step along curve and verify it follows the road
for (let s = 10; s <= 50; s += 20) {
  const pt = ws.computeTrajectoryPoint(mgCurveTrajs[0].originZ, mgCurveTrajs[0].initialOffset, mgCurveTrajs[0].spreadAngle, mgCurveTrajs[0].originY, s, mockRoad);
  const roadCurveAtPoint = mockRoad.getCurveX(pt.z);
  const expectedOffset = mgCurveTrajs[0].initialOffset;
  assert(Math.abs((pt.x - roadCurveAtPoint) - expectedOffset) < 0.001, `Metralhadora aim point at s=${s} stays locked to road curvature`);
}

// TEST 5: Teste as três trajetórias da Dispersora e confira se acompanham a estrada
const sgCurveTrajs = ws.getTrajectories('shotgun', playerXOnCurve, 0.5, curveZ, roadAngleAtCurve, { forAim: true });
assert(sgCurveTrajs.length === 3, "Dispersora has 3 distinct trajectories on curve");
assert(sgCurveTrajs[0].spreadAngle < 0, "Left pellet spread angle is negative (-0.045)");
assert(sgCurveTrajs[1].spreadAngle === 0, "Center pellet spread angle is 0");
assert(sgCurveTrajs[2].spreadAngle > 0, "Right pellet spread angle is positive (+0.045)");

for (let s = 10; s <= 40; s += 15) {
  const ptCenter = ws.computeTrajectoryPoint(sgCurveTrajs[1].originZ, sgCurveTrajs[1].initialOffset, sgCurveTrajs[1].spreadAngle, sgCurveTrajs[1].originY, s, mockRoad);
  const ptLeft = ws.computeTrajectoryPoint(sgCurveTrajs[0].originZ, sgCurveTrajs[0].initialOffset, sgCurveTrajs[0].spreadAngle, sgCurveTrajs[0].originY, s, mockRoad);
  const ptRight = ws.computeTrajectoryPoint(sgCurveTrajs[2].originZ, sgCurveTrajs[2].initialOffset, sgCurveTrajs[2].spreadAngle, sgCurveTrajs[2].originY, s, mockRoad);

  assert(ptLeft.x < ptCenter.x && ptRight.x > ptCenter.x, `Dispersora spreads outward fan at distance s=${s} (Left: ${ptLeft.x.toFixed(2)}, Center: ${ptCenter.x.toFixed(2)}, Right: ${ptRight.x.toFixed(2)})`);
  assert(Math.abs(ptCenter.x - (mockRoad.getCurveX(ptCenter.z) + sgCurveTrajs[1].initialOffset)) < 0.001, `Center pellet follows road curvature at s=${s}`);
}

// TEST 6: Dispare com a Dispersora e compare os caminhos reais com os caminhos previstos
dummyGame.player.type = 'interceptor';
ws.projectiles = [];
ws.cooldown = 0;
ws.firePlayer('shotgun', playerXOnCurve, 0.5, curveZ, roadAngleAtCurve, false, false, false, false);
assert(ws.projectiles.length === 3, "Dispersora fired exactly 3 projectiles");

// Simulate 0.25 seconds of flight for both projectiles and aim formula
const flightDt = 0.25;
for (let step = 0; step < 5; step++) {
  ws.update(flightDt / 5);
}

for (let i = 0; i < 3; i++) {
  const p = ws.projectiles[i];
  const predicted = ws.computeTrajectoryPoint(sgCurveTrajs[i].originZ, sgCurveTrajs[i].initialOffset, sgCurveTrajs[i].spreadAngle, sgCurveTrajs[i].originY, p.traveled, mockRoad);
  assert(Math.abs(p.x - predicted.x) < 0.001, `Projectile ${i} X position matches aim line prediction at traveled=${p.traveled.toFixed(2)}`);
  assert(Math.abs(p.z - predicted.z) < 0.001, `Projectile ${i} Z position matches aim line prediction at traveled=${p.traveled.toFixed(2)}`);
  assert(Math.abs(p.y - predicted.y) < 0.001, `Projectile ${i} Y position matches aim line prediction`);
}

// TEST 7: Teste o Canhão Pesado e confira se a mira corresponde à trajetória real do projétil
ws.projectiles = [];
ws.cooldown = 0;
ws.firePlayer('cannon', playerXOnCurve, 0.5, curveZ, roadAngleAtCurve, false, false, false, false);
assert(ws.projectiles.length === 1, "Canhão Pesado fired 1 projectile");
const cannonP = ws.projectiles[0];
const cannonTraj = ws.getTrajectories('cannon', playerXOnCurve, 0.5, curveZ, roadAngleAtCurve)[0];

for (let step = 0; step < 6; step++) {
  ws.update(flightDt / 6);
}
const predictedCannon = ws.computeTrajectoryPoint(cannonTraj.originZ, cannonTraj.initialOffset, cannonTraj.spreadAngle, cannonTraj.originY, cannonP.traveled, mockRoad);
assert(Math.abs(cannonP.x - predictedCannon.x) < 0.001, "Canhão Pesado X matches aim trajectory");
assert(Math.abs(cannonP.z - predictedCannon.z) < 0.001, "Canhão Pesado Z matches aim trajectory");
assert(cannonP.isCannon === true, "Canhão Pesado cubic projectile flag preserved");

// TEST 8: Teste os veículos em diferentes orientações
for (const testAngle of [-0.25, -0.1, 0, 0.1, 0.25, 0.5]) {
  const vTrajs = ws.getTrajectories('shotgun', 10, 0.5, 300, testAngle);
  assert(vTrajs.length === 3, `Trajectories generated for yaw angle ${testAngle}`);
  const expectedZ = 300 + 2.39 * Math.cos(testAngle);
  const expectedX = 10 + 2.39 * Math.sin(testAngle);
  assert(Math.abs(vTrajs[1].originX - expectedX) < 0.001, `Origin X at angle ${testAngle} correctly yaw-transformed`);
  assert(Math.abs(vTrajs[1].originZ - expectedZ) < 0.001, `Origin Z at angle ${testAngle} correctly yaw-transformed`);
}

// TEST 9: Verifique se as linhas desaparecem ou são atualizadas corretamente quando a mira não deve estar visível
let mockVerts = [];
const mockRenderer = {
  drawDynamicBatch: (floatArray, count) => {
    mockVerts = floatArray;
  }
};

// When player is destroyed (clear projectiles so only aim lines are checked):
ws.projectiles = [];
dummyGame.player.destroyed = true;
dummyGame.state = 'PLAYING';
ws.render(mockRenderer, dummyGame.player, mockRoad);
assert(mockVerts.length === 0, "Aim lines not rendered when player is destroyed");

// When game state is MENU or GAMEOVER:
dummyGame.player.destroyed = false;
dummyGame.state = 'GAMEOVER';
mockVerts = [];
ws.render(mockRenderer, dummyGame.player, mockRoad);
assert(mockVerts.length === 0, "Aim lines not rendered when state is GAMEOVER");

dummyGame.state = 'SELECT';
mockVerts = [];
ws.render(mockRenderer, dummyGame.player, mockRoad);
assert(mockVerts.length === 0, "Aim lines not rendered when state is SELECT");

// When playing normally:
dummyGame.state = 'PLAYING';
mockVerts = [];
ws.render(mockRenderer, dummyGame.player, mockRoad);
assert(mockVerts.length > 0, `Aim lines successfully rendered when state is PLAYING (${mockVerts.length} floats generated)`);

// TEST 10: Confirme que o dano, o alcance e a quantidade de projéteis permanecem inalterados
assert(PLAYER_WEAPONS.machinegun.damage === 60, "Metralhadora damage preserved at 60");
assert(PLAYER_WEAPONS.machinegun.range === 330.0, "Metralhadora range preserved at 330.0");
assert(PLAYER_WEAPONS.machinegun.fireRate === 8.0, "Metralhadora fireRate preserved at 8.0");

assert(PLAYER_WEAPONS.shotgun.damage === 150, "Dispersora damage preserved at 150");
assert(PLAYER_WEAPONS.shotgun.range === 184.0, "Dispersora range preserved at 184.0");
assert(PLAYER_WEAPONS.shotgun.pellets === 3, "Dispersora pellets preserved at 3");

assert(PLAYER_WEAPONS.cannon.damage === 450, "Canhão Pesado damage preserved at 450");
assert(PLAYER_WEAPONS.cannon.range === 440.0, "Canhão Pesado range preserved at 440.0");
assert(PLAYER_WEAPONS.cannon.fireRate === 1.2, "Canhão Pesado fireRate preserved at 1.2");

console.log(`\n=== RESULTS: ${passed} / ${total} TESTS PASSED ===\n`);
if (passed === total) {
  console.log("ALL PROMPT 6 TESTS PASSED WITH 100% SUCCESS!");
} else {
  console.error("SOME TESTS FAILED!");
  process.exit(1);
}
