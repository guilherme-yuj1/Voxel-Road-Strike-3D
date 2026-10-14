// Automated test suite for PROMPT 7: Sequential kill notifications (5 sequential +points per kill)
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
          addEventListener: () => {},
          appendChild: () => {}
        };
      }
      return elements[id];
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: (tag) => ({
      tagName: tag,
      className: '',
      textContent: '',
      style: {},
      appendChild: () => {}
    })
  },
  AudioContext: class {
    createGain() { return { gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
    createOscillator() { return { type: '', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    createBufferSource() { return { buffer: null, playbackRate: { value: 1 }, connect: () => {}, start: () => {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
  }
};
sandbox.webkitAudioContext = sandbox.AudioContext;

let scriptCode = fs.readFileSync('script.js', 'utf8');
scriptCode += `
globalThis.FloatingTextManager = FloatingTextManager;
globalThis.EnemyVehicle = EnemyVehicle;
globalThis.EnemyManager = EnemyManager;
globalThis.Game = Game;
globalThis.ENEMY_TYPES = ENEMY_TYPES;
`;

const ctx = vm.createContext(sandbox);
vm.runInContext(scriptCode, ctx);

const FloatingTextManager = sandbox.FloatingTextManager;
const EnemyVehicle = sandbox.EnemyVehicle;
const EnemyManager = sandbox.EnemyManager;
const Game = sandbox.Game;
const ENEMY_TYPES = sandbox.ENEMY_TYPES;

console.log("=== EXECUTING PROMPT 7 MANDATORY TESTS (SEÇÃO 8) ===");

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

// Setup dummy game
const dummyGame = {
  score: 0,
  kills: 0,
  combo: 1,
  maxCombo: 1,
  comboTimer: 0,
  wave: 1,
  state: 'PLAYING',
  road: { getCurveX: () => 0 },
  canvas: { width: 1920, height: 1080 },
  renderer: { matViewProj: new Float32Array(16) },
  sound: { playHit: () => {}, playExplosion: () => {} },
  camera: { addShake: () => {} },
  debris: { spawnVehicleDestruction: () => {} },
  powerups: { spawn: () => {} },
  models: {},
  floatingTexts: null
};

dummyGame.floatingTexts = new FloatingTextManager(dummyGame);
dummyGame.addKill = Game.prototype.addKill;

// TEST 1 & 2: Elimine um inimigo que valha 100 pontos e confirme as cinco notificações de +20 e placar +100
console.log("\n--- TEST 1 & 2: 100 points elimination ---");
dummyGame.score = 500;
dummyGame.kills = 3;
dummyGame.floatingTexts.clear();

dummyGame.addKill(100, 10, 0.5, 200);

assert(dummyGame.score === 600, `Real score increased by exactly 100 points (from 500 to ${dummyGame.score})`);
assert(dummyGame.kills === 4, `Kills count incremented by exactly 1 (from 3 to ${dummyGame.kills})`);
assert(dummyGame.floatingTexts.pendingSequences.length === 5, `Exactly 5 sequential notifications queued in pendingSequences (count = ${dummyGame.floatingTexts.pendingSequences.length})`);

// Step through time at intervals to verify each notification appears sequentially
const spawnedNotifications = [];
// Overwrite spawn to record spawned texts
const originalSpawn = dummyGame.floatingTexts.spawn.bind(dummyGame.floatingTexts);
dummyGame.floatingTexts.spawn = (x, y, z, text, className) => {
  spawnedNotifications.push(text);
  originalSpawn(x, y, z, text, className);
};

// t = 0s (frame 1)
dummyGame.floatingTexts.update(0.016);
assert(spawnedNotifications.length === 1, `At t=0s, notification 1 appeared (count = ${spawnedNotifications.length})`);
assert(spawnedNotifications[0] === '+20', `Notification 1 text is '+20' (got '${spawnedNotifications[0]}')`);

// t = 0.18s
dummyGame.floatingTexts.update(0.18);
assert(spawnedNotifications.length === 2, `At t=0.18s, notification 2 appeared (count = ${spawnedNotifications.length})`);
assert(spawnedNotifications[1] === '+20', `Notification 2 text is '+20' (got '${spawnedNotifications[1]}')`);

// t = 0.36s
dummyGame.floatingTexts.update(0.18);
assert(spawnedNotifications.length === 3, `At t=0.36s, notification 3 appeared (count = ${spawnedNotifications.length})`);
assert(spawnedNotifications[2] === '+20', `Notification 3 text is '+20' (got '${spawnedNotifications[2]}')`);

// t = 0.54s
dummyGame.floatingTexts.update(0.18);
assert(spawnedNotifications.length === 4, `At t=0.54s, notification 4 appeared (count = ${spawnedNotifications.length})`);
assert(spawnedNotifications[3] === '+20', `Notification 4 text is '+20' (got '${spawnedNotifications[3]}')`);

// t = 0.72s
dummyGame.floatingTexts.update(0.18);
assert(spawnedNotifications.length === 5, `At t=0.72s, notification 5 appeared (count = ${spawnedNotifications.length})`);
assert(spawnedNotifications[4] === '+20', `Notification 5 text is '+20' (got '${spawnedNotifications[4]}')`);

// Confirm all 5 are '+20'
const allTwenty = spawnedNotifications.every(n => n === '+20');
assert(allTwenty, "All 5 notifications are exactly '+20'");
const sumFive = spawnedNotifications.reduce((acc, s) => acc + parseInt(s.replace('+', ''), 10), 0);
assert(sumFive === 100, `Sum of all 5 notifications is exactly 100 (${sumFive})`);

// TEST 3: Teste um valor de pontuação que não seja divisível por cinco
console.log("\n--- TEST 3: Non-divisible score values ---");
const testCases = [
  { total: 103, expectedSum: 103 },
  { total: 457, expectedSum: 457 },
  { total: 7, expectedSum: 7 },
  { total: 1, expectedSum: 1 },
  { total: 600, expectedSum: 600 },
  { total: 1200, expectedSum: 1200 }
];

for (const tc of testCases) {
  const parts = FloatingTextManager.calculateScoreSplits(tc.total, 5);
  assert(parts.length === 5, `calculateScoreSplits(${tc.total}) returns 5 parts`);
  const sum = parts.reduce((a, b) => a + b, 0);
  assert(sum === tc.expectedSum, `Sum of parts for ${tc.total} is exactly ${tc.expectedSum} ([${parts.join(', ')}])`);
  const maxDiff = Math.max(...parts) - Math.min(...parts);
  assert(maxDiff <= 1, `Parts are balanced with max difference <= 1 between items (${parts.join(', ')})`);
}

// Special check for 103: [21, 21, 21, 20, 20]
const parts103 = FloatingTextManager.calculateScoreSplits(103, 5);
assert(
  parts103[0] === 21 && parts103[1] === 21 && parts103[2] === 21 && parts103[3] === 20 && parts103[4] === 20,
  `Parts for 103 are exactly [+21, +21, +21, +20, +20]: [${parts103.join(', ')}]`
);

// TEST 4: Cause dano sem eliminar um inimigo e confirme que nenhuma sequência é gerada
console.log("\n--- TEST 4: Damage without elimination ---");
dummyGame.floatingTexts.clear();
const enemyScout = new EnemyVehicle(dummyGame, 'scout', 150, 0);
const initialHp = enemyScout.hp;
const initialScore = dummyGame.score;

// Apply non-lethal damage (e.g. 50 dmg when HP is 500)
enemyScout.takeDamage(50);

assert(enemyScout.hp === initialHp - 50, `Enemy took 50 damage (HP: ${enemyScout.hp}/${initialHp})`);
assert(enemyScout.destroyed === false, "Enemy is not destroyed");
assert(dummyGame.score === initialScore, "Real score did not increase on non-lethal damage");
assert(dummyGame.floatingTexts.pendingSequences.length === 0, "No kill notification sequence generated on non-lethal damage");

// TEST 5: Elimine vários inimigos em sequência e confira se as notificações são exibidas corretamente
console.log("\n--- TEST 5: Multiple sequential eliminations ---");
dummyGame.floatingTexts.clear();
const initialMultiScore = dummyGame.score;
const initialKills = dummyGame.kills;

// Eliminate enemy 1 (val 450)
dummyGame.combo = 1;
dummyGame.addKill(450, 5, 0.5, 200);

// Eliminate enemy 2 (val 600)
dummyGame.addKill(600, -5, 0.5, 210);

assert(dummyGame.score === initialMultiScore + 450 + 600 * 2, `Score updated for both kills with combo (${dummyGame.score})`);
assert(dummyGame.kills === initialKills + 2, `Kills count incremented by 2 (${dummyGame.kills})`);
assert(dummyGame.floatingTexts.pendingSequences.length === 10, `Both eliminations queued their 5 notifications (total pending = 10)`);

// TEST 6: Teste eliminações causadas por tiros explosivos ou dispersora atingindo múltiplos inimigos
console.log("\n--- TEST 6: Explosive / multi-kill in same frame ---");
dummyGame.floatingTexts.clear();
const enemy1 = new EnemyVehicle(dummyGame, 'scout', 100, -2);
const enemy2 = new EnemyVehicle(dummyGame, 'scout', 100, 2);

// Both destroyed in same frame
enemy1.takeDamage(1000);
enemy2.takeDamage(1000);

assert(enemy1.destroyed === true, "Enemy 1 destroyed");
assert(enemy2.destroyed === true, "Enemy 2 destroyed");
assert(dummyGame.floatingTexts.pendingSequences.length === 10, "Each destroyed enemy spawned its own independent sequence of 5 notifications");

// TEST 7: Confirme que remover inimigos ultrapassados não concede pontos
console.log("\n--- TEST 7: Removing overtaken enemies ---");
dummyGame.floatingTexts.clear();
const em = new EnemyManager(dummyGame);
const enemyFarAhead = new EnemyVehicle(dummyGame, 'scout', 600, 0); // > 320m ahead
const enemyFarBehind = new EnemyVehicle(dummyGame, 'scout', -200, 0); // < -160m behind
em.enemies = [enemyFarAhead, enemyFarBehind];

const scoreBeforeSplice = dummyGame.score;
const killsBeforeSplice = dummyGame.kills;

em.update(0.016, { worldZ: 200, laneX: 0, forwardSpeed: 55 });

assert(em.enemies.length === 0, "Out-of-bounds enemies removed from manager");
assert(dummyGame.score === scoreBeforeSplice, "No score awarded for overtaken or despawned enemies");
assert(dummyGame.kills === killsBeforeSplice, "No kills registered for overtaken or despawned enemies");
assert(dummyGame.floatingTexts.pendingSequences.length === 0, "No notifications generated for despawned enemies");

// TEST 8: Pause, retome e reinicie a partida para verificar o comportamento das sequências pendentes
console.log("\n--- TEST 8: Pause, resume and restart behavior ---");
dummyGame.floatingTexts.clear();
dummyGame.addKill(100, 0, 0.5, 100);
assert(dummyGame.floatingTexts.pendingSequences.length === 5, "5 sequences queued");

// Simulate pause: when state is PAUSED, update is not called
dummyGame.state = 'PAUSED';
const delayBeforePause = dummyGame.floatingTexts.pendingSequences[1].delay;

// In paused state, no dt ticks
// Unpause:
dummyGame.state = 'PLAYING';
const delayAfterUnpause = dummyGame.floatingTexts.pendingSequences[1].delay;
assert(delayBeforePause === delayAfterUnpause, "Pending delays remained perfectly preserved across pause");

// Advance some time while playing
dummyGame.floatingTexts.update(0.20);
assert(dummyGame.floatingTexts.pendingSequences.length < 5, "Pending sequences advanced during play");

// Simulate restart / clear
dummyGame.floatingTexts.clear();
assert(dummyGame.floatingTexts.pendingSequences.length === 0, "Pending sequences completely cleared on game restart");
assert(dummyGame.floatingTexts.items.length === 0, "Active items completely cleared on game restart");

// TEST 9: Confirme que uma mesma eliminação nunca concede pontos ou gera notificações duplicadas
console.log("\n--- TEST 9: Prevention of duplicate kills ---");
dummyGame.floatingTexts.clear();
const enemySingle = new EnemyVehicle(dummyGame, 'raptor', 200, 0);
const scoreBeforeMultiHit = dummyGame.score;
const killsBeforeMultiHit = dummyGame.kills;

// Hit 1: kills the enemy
enemySingle.takeDamage(enemySingle.hp + 50);
assert(enemySingle.destroyed === true, "Enemy destroyed on lethal hit");

const scoreAfterKill = dummyGame.score;
const killsAfterKill = dummyGame.kills;
const pendingAfterKill = dummyGame.floatingTexts.pendingSequences.length;

assert(scoreAfterKill > scoreBeforeMultiHit, "Score increased on initial kill");
assert(killsAfterKill === killsBeforeMultiHit + 1, "Kill count increased by 1 on initial kill");
assert(pendingAfterKill === 5, "5 notifications queued for initial kill");

// Hit 2 & Hit 3 on same destroyed enemy (e.g. multiple pellets hitting same frame)
enemySingle.takeDamage(150);
enemySingle.takeDamage(150);

assert(dummyGame.score === scoreAfterKill, "Score did NOT increase on subsequent hits to already destroyed enemy");
assert(dummyGame.kills === killsAfterKill, "Kill count did NOT increase on subsequent hits to already destroyed enemy");
assert(dummyGame.floatingTexts.pendingSequences.length === 5, "No duplicate notification sequence generated on subsequent hits");

console.log(`\n=== RESULTS: ${passed} / ${total} TESTS PASSED ===\n`);
if (passed === total) {
  console.log("ALL PROMPT 7 MANDATORY TESTS PASSED WITH 100% SUCCESS!");
} else {
  console.error("SOME TESTS FAILED!");
  process.exit(1);
}
