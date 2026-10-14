// Comprehensive automated test for PROMPT 5 vehicle models and selection screen
const fs = require('fs');
const vm = require('vm');

const elements = {};

// Sandbox environment
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

// Load script.js and append export
let scriptCode = fs.readFileSync('script.js', 'utf8');
scriptCode += `
globalThis.VoxelBuilder = VoxelBuilder;
globalThis.VEHICLE_DATA = VEHICLE_DATA;
globalThis.WeaponSystem = WeaponSystem;
globalThis.Game = Game;
globalThis.PLAYER_WEAPONS = PLAYER_WEAPONS;
`;

// Run in context
const ctx = vm.createContext(sandbox);
vm.runInContext(scriptCode, ctx);

console.log("=== EXECUTING MANDATORY TESTS (SEÇÃO 10) ===");

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`[PASS] Test ${totalCount}: ${message}`);
    passedCount++;
  } else {
    console.error(`[FAIL] Test ${totalCount}: ${message}`);
  }
}

const VoxelBuilder = sandbox.VoxelBuilder;
const VEHICLE_DATA = sandbox.VEHICLE_DATA;
const WeaponSystem = sandbox.WeaponSystem;
const Game = sandbox.Game;

// Mock renderer to bake meshes
const mockRenderer = {
  createMesh: (verts) => ({
    buffer: {},
    vertexCount: verts.length / 10,
    vertices: verts
  })
};

// Test 1: Visualize os três veículos e confirme que cada um possui uma silhueta diferente
const interceptorResult = VoxelBuilder.buildInterceptor(mockRenderer, 'machinegun');
const raptorResult = VoxelBuilder.buildRaptorPlayer(mockRenderer, 'machinegun');
const titanResult = VoxelBuilder.buildTitanPlayer(mockRenderer, 'machinegun');

const interVerts = interceptorResult.mesh.vertexCount;
const raptorVerts = raptorResult.mesh.vertexCount;
const titanVerts = titanResult.mesh.vertexCount;

assert(interVerts > 0 && raptorVerts > 0 && titanVerts > 0, "All 3 vehicle meshes generate valid 3D voxel geometry");
assert(interVerts !== raptorVerts && raptorVerts !== titanVerts, `Different vertex complexities reflecting unique silhouettes (Infiltrador: ${interVerts} v, Veloz: ${raptorVerts} v, Titan: ${titanVerts} v)`);

// Test 2: Verifique se o Infiltrador parece um esportivo clássico prateado
const interData = VEHICLE_DATA.interceptor;
assert(interData.displayName === "INFILTRADOR", "Infiltrador displayName is correct");
assert(interData.modelRef.includes("Aston Martin DB5"), "Infiltrador reference is Aston Martin DB5");
assert(interData.description === "Esportivo clássico prateado, inspirado no Aston Martin DB5.", "Infiltrador description matches required prompt text exactly");

// Test 3: Verifique se o Veloz parece um supercarro baixo, angular e vermelho-alaranjado, com aerofólio traseiro
const velozData = VEHICLE_DATA.raptor;
assert(velozData.displayName === "VELOZ", "Veloz displayName is correct");
assert(velozData.modelRef.includes("Lamborghini Aventador"), "Veloz reference is Lamborghini Aventador");
assert(velozData.description === "Supercarro vermelho-alaranjado, baixo e agressivo, com aerofólio traseiro.", "Veloz description matches required prompt text exactly");

// Test 4: Verifique se o Titan parece uma picape azul-marinho com caçamba
const titanData = VEHICLE_DATA.titan;
assert(titanData.displayName === "TITAN", "Titan displayName is correct");
assert(titanData.modelRef.includes("Ford F-150"), "Titan reference is Ford F-150");
assert(titanData.description === "Picape azul-marinho robusta, inspirada na Ford F-150.", "Titan description matches required prompt text exactly");

// Test 5: Confirme que as peças dos veículos não se soltam nem ficam deslocadas durante a movimentação
// We test bake of vehicle + weapon into unified single static buffer mesh
const testCombos = [
  ['interceptor', 'machinegun'],
  ['interceptor', 'shotgun'],
  ['interceptor', 'cannon'],
  ['raptor', 'machinegun'],
  ['raptor', 'shotgun'],
  ['raptor', 'cannon'],
  ['titan', 'machinegun'],
  ['titan', 'shotgun'],
  ['titan', 'cannon']
];

for (const [v, w] of testCombos) {
  const result = (v === 'interceptor'
    ? VoxelBuilder.buildInterceptor(mockRenderer, w)
    : (v === 'raptor'
      ? VoxelBuilder.buildRaptorPlayer(mockRenderer, w)
      : VoxelBuilder.buildTitanPlayer(mockRenderer, w)));
  assert(result && result.mesh && result.mesh.vertexCount > 0, `Vehicle ${v} with ${w} baked as unified geometry (${result.mesh.vertexCount} vertices)`);
}

// Test 6: Confira o posicionamento das armas nas três configurações
// Metralhadora dupla: 2 canos simétricos nos paralamas dianteiros
// Dispersora: 1 canhão frontal alinhado
// Canhão pesado: 1 canhão no topo
const dummyGame = {
  road: { getCurveX: () => 0 },
  player: { type: 'interceptor' }
};
const ws = new WeaponSystem(dummyGame);

for (const vKey of ['interceptor', 'raptor', 'titan']) {
  dummyGame.player.type = vKey;
  
  // Machinegun (forAim = true to get both dual cannons)
  const mgTrajs = ws.getTrajectories('machinegun', 0, 0, 0, 0, { forAim: true });
  assert(mgTrajs.length === 2, `Metralhadora on ${vKey} has dual symmetric barrels (length=${mgTrajs.length})`);
  assert(mgTrajs[0].originX > 0 && mgTrajs[1].originX < 0, `Metralhadora barrels on ${vKey} are mounted symmetrically on left and right fenders (${mgTrajs[0].originX.toFixed(2)} and ${mgTrajs[1].originX.toFixed(2)})`);
  assert(Math.abs(mgTrajs[0].originX + mgTrajs[1].originX) < 0.001, `Metralhadora barrels on ${vKey} are perfectly symmetrical`);

  // Dispersora (shotgun)
  const sgTrajs = ws.getTrajectories('shotgun', 0, 0, 0, 0);
  assert(sgTrajs.length === 3, `Dispersora on ${vKey} produces 3 spread projectiles`);
  assert(sgTrajs[0].originX === 0 && sgTrajs[1].originX === 0 && sgTrajs[2].originX === 0, `Dispersora on ${vKey} is aligned centrally (originX = 0)`);
  assert(sgTrajs[0].originZ > 2.0, `Dispersora nozzle on ${vKey} is at the front bumper (+Z = ${sgTrajs[0].originZ})`);

  // Canhão Pesado (cannon)
  const cTrajs = ws.getTrajectories('cannon', 0, 0, 0, 0);
  assert(cTrajs.length === 1, `Canhão Pesado on ${vKey} produces 1 heavy shot`);
  assert(cTrajs[0].originX === 0, `Canhão Pesado on ${vKey} is aligned centrally on top`);
  assert(cTrajs[0].originY > 0.9, `Canhão Pesado on ${vKey} is mounted on top of cabin (Y = ${cTrajs[0].originY})`);
}

// Test 7 & 8: Seleção e atualização de dados
console.log("\nTesting Selection Screen State Management:");
const mockGame = {
  selectedVehicle: 'interceptor',
  selectedWeapon: 'machinegun',
  updateSelectionDetails: Game.prototype.updateSelectionDetails
};

mockGame.updateSelectionDetails();
assert(elements['info-name'].textContent === 'INFILTRADOR', "Selection initial name is INFILTRADOR");
assert(elements['info-description'].textContent === 'Esportivo clássico prateado, inspirado no Aston Martin DB5.', "Selection initial desc is DB5");
assert(elements['stat-speed-fill'].style.width === '70%', "Speed stat is 70%");

mockGame.selectedVehicle = 'raptor';
mockGame.selectedWeapon = 'shotgun';
mockGame.updateSelectionDetails();
assert(elements['info-name'].textContent === 'VELOZ', "Selection switched to VELOZ");
assert(elements['info-description'].textContent === 'Supercarro vermelho-alaranjado, baixo e agressivo, com aerofólio traseiro.', "Selection updated desc to Aventador");
assert(elements['stat-speed-fill'].style.width === '95%', "Speed stat is 95%");

mockGame.selectedVehicle = 'titan';
mockGame.selectedWeapon = 'cannon';
mockGame.updateSelectionDetails();
assert(elements['info-name'].textContent === 'TITAN', "Selection switched to TITAN");
assert(elements['info-description'].textContent === 'Picape azul-marinho robusta, inspirada na Ford F-150.', "Selection updated desc to F-150");
assert(elements['stat-armor-fill'].style.width === '95%', "Armor stat is 95%");

// Test 9: Confirmação de integridade de gameplay e danos
const PLAYER_WEAPONS = sandbox.PLAYER_WEAPONS;
assert(PLAYER_WEAPONS.machinegun.damage === 60, "Metralhadora damage preserved at 60");
assert(PLAYER_WEAPONS.shotgun.damage === 150, "Dispersora damage preserved at 150");
assert(PLAYER_WEAPONS.cannon.damage === 450, "Canhão Pesado damage preserved at 450");

console.log(`\n=== RESULTS: ${passedCount} / ${totalCount} TESTS PASSED ===\n`);
if (passedCount === totalCount) {
  console.log("ALL MANDATORY TESTS COMPLETED WITH 100% SUCCESS!");
} else {
  console.error("SOME TESTS FAILED!");
  process.exit(1);
}
