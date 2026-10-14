/**
 * Suíte de Testes Automatizada - PROMPT 8
 * Gerenciamento de Inimigos: Remoção de Ultrapassados e Geração à Frente
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

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
  performance: { now: () => 1000 },
  requestAnimationFrame: () => {},
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
globalThis.EnemyVehicle = EnemyVehicle;
globalThis.EnemyManager = EnemyManager;
globalThis.WeaponSystem = WeaponSystem;
globalThis.Projectile = Projectile;
globalThis.FloatingTextManager = FloatingTextManager;
globalThis.Game = Game;
globalThis.ENEMY_TYPES = ENEMY_TYPES;
globalThis.ENEMY_COMBAT_REAR_RANGE = ENEMY_COMBAT_REAR_RANGE;
globalThis.ENEMY_CULLING_BEHIND_DIST = ENEMY_CULLING_BEHIND_DIST;
globalThis.ENEMY_CULLING_AHEAD_DIST = ENEMY_CULLING_AHEAD_DIST;
globalThis.ENEMY_MIN_SPAWN_AHEAD = ENEMY_MIN_SPAWN_AHEAD;
`;

const ctx = vm.createContext(sandbox);
vm.runInContext(scriptCode, ctx);

const EnemyVehicle = sandbox.EnemyVehicle;
const EnemyManager = sandbox.EnemyManager;
const WeaponSystem = sandbox.WeaponSystem;
const FloatingTextManager = sandbox.FloatingTextManager;

console.log('=== INICIANDO TESTES DO PROMPT 8 ===\n');

let testsPassed = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] Teste ${totalTests}: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`❌ [FAIL] Teste ${totalTests}: ${name}`);
    console.error(err);
  }
}

// Configuração mock do jogo
function createMockGame(wave = 1) {
  const roadMock = {
    roadWidth: 20.0,
    getCurveX: (z) => Math.sin(z * 0.005) * 25.0, // Curvas pronunciadas na pista
    getTangentAngle: (z) => Math.atan2(Math.cos(z * 0.005) * 0.125, 1)
  };

  const soundMock = {
    playHit() {},
    playCrash() {},
    playExplosion() {},
    playPlayerShotgun() {},
    playPlayerCannon() {},
    playPlayerMachinegun() {},
    playEnemyMachinegun() {},
    playEnemyShotgun() {},
    playEnemyCannon() {}
  };

  const debrisMock = {
    debrisList: [],
    particleList: [],
    spawnHitSparks() {},
    spawnVehicleDestruction() {}
  };

  const cameraMock = {
    addShake() {}
  };

  const powerupsMock = {
    items: [],
    spawn() {}
  };

  const floatingTextsMock = {
    notifications: [],
    spawnKillScoreSequence(score, x, y, z) {
      this.notifications.push({ score, x, y, z });
    },
    spawn() {}
  };

  const game = {
    wave: wave,
    score: 0,
    kills: 0,
    combo: 1,
    maxCombo: 1,
    road: roadMock,
    sound: soundMock,
    debris: debrisMock,
    camera: cameraMock,
    powerups: powerupsMock,
    floatingTexts: floatingTextsMock,
    models: {},
    selectedMap: 'desert',
    addKill(basePts, x, y, z) {
      this.kills++;
      const added = basePts * this.combo;
      this.score += added;
      this.floatingTexts.spawnKillScoreSequence(added, x, y, z);
    }
  };

  game.weapons = new WeaponSystem(game);
  game.obstacles = { obstacles: [] };
  game.enemies = new EnemyManager(game);

  return game;
}

// -------------------------------------------------------------
// TESTE 1: Inimigo à frente continua ativo
runTest('Inimigo à frente do jogador permanece ativo', () => {
  const game = createMockGame(1);
  const player = { worldZ: 100.0, worldX: 0, laneX: 0, forwardSpeed: 50.0 };
  const enemy = new EnemyVehicle(game, 'scout', 140.0, 2.5); // 40m à frente
  game.enemies.enemies.push(enemy);

  assert.strictEqual(game.enemies.getRelativeDistanceZ(enemy, player), 40.0);
  assert.strictEqual(game.enemies.isEnemyBehindAndOutOfCombat(enemy, player), false);
  assert.strictEqual(game.enemies.isEnemyInRearCombat(enemy, player), false);

  game.enemies.update(0.1, player);
  assert.strictEqual(game.enemies.enemies.length, 1);
  assert.strictEqual(game.enemies.enemies[0].destroyed, false);
});

// TESTE 2: Inimigo ultrapassado mas próximo (-15m) permanece ativo em combate traseiro
runTest('Inimigo ultrapassado próximo (-15m) continua ativo na perseguição traseira', () => {
  const game = createMockGame(1);
  const player = { worldZ: 200.0, worldX: 0, laneX: 0, forwardSpeed: 50.0 };
  const enemy = new EnemyVehicle(game, 'scout', 185.0, 2.5); // 15m atrás
  game.enemies.enemies.push(enemy);

  const distZ = game.enemies.getRelativeDistanceZ(enemy, player);
  assert.strictEqual(distZ, -15.0);
  assert.strictEqual(game.enemies.isEnemyInRearCombat(enemy, player), true);
  assert.strictEqual(game.enemies.isEnemyBehindAndOutOfCombat(enemy, player), false);

  game.enemies.update(0.1, player);
  assert.strictEqual(game.enemies.enemies.length, 1);
  assert.strictEqual(game.enemies.enemies[0].destroyed, false);
});

// TESTE 3: Inimigo que ficou suficientemente para trás (distZ < -48m) é removido
runTest('Inimigo suficientemente para trás (distZ < -48m) é removido do jogo', () => {
  const game = createMockGame(1);
  const player = { worldZ: 300.0, worldX: 0, laneX: 0, forwardSpeed: 60.0 };
  const enemy = new EnemyVehicle(game, 'scout', 245.0, 2.5); // 55m atrás (além de -48m)
  game.enemies.enemies.push(enemy);

  assert.strictEqual(game.enemies.isEnemyBehindAndOutOfCombat(enemy, player), true);

  game.enemies.update(0.1, player);
  assert.strictEqual(game.enemies.enemies.length, 0, 'Inimigo deve ser removido do array');
});

// TESTE 4: Remoção por ultrapassagem NÃO concede pontos, notificações ou kills
runTest('Remoção por ultrapassagem NÃO concede pontos, notificações ou kills', () => {
  const game = createMockGame(1);
  const initialScore = game.score;
  const initialKills = game.kills;
  const initialNotifications = game.floatingTexts.notifications.length;

  const player = { worldZ: 400.0, worldX: 0, laneX: 0, forwardSpeed: 60.0 };
  const enemy = new EnemyVehicle(game, 'titan', 340.0, -2.5); // 60m atrás
  game.enemies.enemies.push(enemy);

  game.enemies.update(0.1, player);

  assert.strictEqual(game.enemies.enemies.length, 0);
  assert.strictEqual(game.score, initialScore, 'Pontuação não deve mudar na ultrapassagem');
  assert.strictEqual(game.kills, initialKills, 'Kills não devem aumentar na ultrapassagem');
  assert.strictEqual(game.floatingTexts.notifications.length, initialNotifications, 'Não deve gerar notificações');
});

// TESTE 5: Inimigo eliminado pelo jogador CONCEDE pontos, kills e notificações
runTest('Inimigo eliminado por dano concede pontos, kills e notificações', () => {
  const game = createMockGame(1);
  const player = { worldZ: 100.0, worldX: 0, laneX: 0, forwardSpeed: 50.0 };
  const enemy = new EnemyVehicle(game, 'raptor', 120.0, 0);
  game.enemies.enemies.push(enemy);

  // Jogador destrói o inimigo
  enemy.takeDamage(enemy.hp + 50);
  assert.strictEqual(enemy.destroyed, true);
  assert.strictEqual(game.kills, 1, 'Eliminação deve ser contabilizada');
  assert.ok(game.score > 0, 'Pontuação deve ser concedida');
  assert.strictEqual(game.floatingTexts.notifications.length, 1, 'Deve gerar notificação sequencial de kill');

  // Próximo update remove o inimigo destruído
  game.enemies.update(0.1, player);
  assert.strictEqual(game.enemies.enemies.length, 0);
});

// TESTE 6: Vaga liberada por ultrapassagem permite gerar novo inimigo à frente
runTest('Vaga liberada por ultrapassagem permite gerar novo inimigo à frente', () => {
  const game = createMockGame(1); // maxActive = 3 na wave 1
  const player = { worldZ: 500.0, worldX: 0, laneX: 0, forwardSpeed: 60.0 };

  // Preenche as 3 vagas
  const e1 = new EnemyVehicle(game, 'scout', 550.0, -7.0);
  const e2 = new EnemyVehicle(game, 'raptor', 570.0, 2.5);
  const e3 = new EnemyVehicle(game, 'hauler', 440.0, 7.0); // 60m atrás (ultrapassado!)
  game.enemies.enemies.push(e1, e2, e3);

  assert.strictEqual(game.enemies.canSpawnEnemy(), false, 'Limite estava cheio com 3');

  // Update remove o ultrapassado e libera a vaga
  game.enemies.spawnTimer = 0; // força spawn
  game.enemies.update(0.1, player);

  // e3 foi removido e um novo inimigo deve ter surgido à frente
  assert.strictEqual(game.enemies.enemies.includes(e3), false, 'e3 foi despawnado');
  assert.ok(game.enemies.enemies.length <= game.enemies.getMaxActiveEnemies(), 'Respeita o teto');

  // Todos os inimigos ativos estão vivos
  for (const e of game.enemies.enemies) {
    assert.strictEqual(e.destroyed, false);
  }
});

// TESTE 7: Inimigos recém-gerados SEMPRE surgem à frente do jogador
runTest('Inimigos gerados sempre surgem com Z bem à frente do jogador (nunca atrás)', () => {
  const game = createMockGame(1);
  const playerZ = 850.0;

  for (let i = 0; i < 20; i++) {
    game.enemies.enemies = []; // limpa
    const spawned = game.enemies.spawnNextWaveEnemy(playerZ);
    assert.ok(spawned, 'Inimigo deve ser gerado');
    assert.ok(spawned.worldZ >= playerZ + 100.0, `Spawn Z (${spawned.worldZ}) deve ser >= playerZ + 100 (${playerZ + 100})`);
    assert.ok(spawned.worldZ > playerZ, 'Nunca deve surgir atrás');
  }
});

// TESTE 8: Detecção funciona com precisão na estrada curva
runTest('Cálculo de distância longitudinal funciona com precisão em trechos curvos', () => {
  const game = createMockGame(1);
  const player = { worldZ: 1000.0, worldX: game.road.getCurveX(1000.0), laneX: 0, forwardSpeed: 60.0 };

  // Em z=1000 vs z=945 (55m atrás ao longo da curva da estrada)
  const enemyBehind = new EnemyVehicle(game, 'scout', 945.0, 0);
  assert.strictEqual(game.enemies.getRelativeDistanceZ(enemyBehind, player), -55.0);
  assert.strictEqual(game.enemies.isEnemyBehindAndOutOfCombat(enemyBehind, player), true);

  // Em z=1000 vs z=1060 (60m à frente ao longo da curva da estrada)
  const enemyAhead = new EnemyVehicle(game, 'scout', 1060.0, 0);
  assert.strictEqual(game.enemies.getRelativeDistanceZ(enemyAhead, player), 60.0);
  assert.strictEqual(game.enemies.isEnemyBehindAndOutOfCombat(enemyAhead, player), false);
});

// TESTE 9: Respeito absoluto ao limite de inimigos ativos simultâneos
runTest('Limite máximo de inimigos ativos nunca é ultrapassado', () => {
  const game = createMockGame(2); // Wave 2: maxActive = 4
  const maxAllowed = game.enemies.getMaxActiveEnemies();
  assert.strictEqual(maxAllowed, 4);

  const playerZ = 1200.0;
  // Tenta invocar 15 vezes seguidas
  for (let i = 0; i < 15; i++) {
    game.enemies.spawnNextWaveEnemy(playerZ);
  }

  assert.strictEqual(game.enemies.enemies.length, maxAllowed, `Deve parar exatamente em ${maxAllowed}`);
  assert.strictEqual(game.enemies.canSpawnEnemy(), false);
});

// TESTE 10: Inimigos não surgem na mesma posição ou dentro de obstáculos
runTest('Novo inimigo não sobrepõe obstáculo na mesma faixa', () => {
  const game = createMockGame(1);
  const playerZ = 2000.0;

  // Cria um obstáculo na faixa 2.5 exatamente na distância típica de spawn (playerZ + 120m)
  game.obstacles.obstacles.push({
    worldZ: playerZ + 120.0,
    laneX: 2.5,
    destroyed: false
  });

  // Gera inimigos e verifica que não colidem com o obstáculo na mesma faixa
  for (let i = 0; i < 5; i++) {
    game.enemies.enemies = [];
    const enemy = game.enemies.spawnNextWaveEnemy(playerZ);
    if (Math.abs(enemy.laneX - 2.5) < 1.0) {
      const diffZ = Math.abs(enemy.worldZ - (playerZ + 120.0));
      assert.ok(diffZ >= 18.0, `Inimigo na mesma faixa (${enemy.laneX}) deve manter distância de segurança do obstáculo: diffZ=${diffZ}`);
    }
  }
});

// TESTE 11: Projéteis em voo de inimigo removido continuam existindo autonomamente
runTest('Projéteis de inimigo ultrapassado continuam em voo sem causar erros', () => {
  const game = createMockGame(1);
  const player = { worldZ: 500.0, worldX: 0, worldY: 0.5, laneX: 0, forwardSpeed: 50.0 };
  const enemy = new EnemyVehicle(game, 'scout', 430.0, 2.5); // 70m atrás (bem além de -48m)
  game.enemies.enemies.push(enemy);

  // Inimigo dispara antes de ser removido
  game.weapons.fireEnemy(enemy.worldX, enemy.worldY, enemy.worldZ, player.worldX, player.worldZ, 'machinegun');
  assert.strictEqual(game.weapons.projectiles.length, 1);

  // Update despawna o inimigo por ultrapassagem
  game.enemies.update(0.1, player);
  assert.strictEqual(game.enemies.enemies.length, 0, 'Inimigo foi despawnado');

  // Projétil continua vivo e se movendo normalmente sem referências quebradas
  assert.strictEqual(game.weapons.projectiles.length, 1);
  assert.doesNotThrow(() => {
    game.weapons.update(0.1);
  });
});

// TESTE 12: Simulação de partida prolongada (estabilidade e sem vazamento)
runTest('Simulação de partida prolongada (600 quadros) mantém contagem estável', () => {
  const game = createMockGame(3); // Wave 3: maxActive = 5
  const player = { worldZ: 0, worldX: 0, worldY: 0.5, laneX: 0, forwardSpeed: 70.0 };

  const dt = 0.05;
  for (let frame = 0; frame < 600; frame++) {
    player.worldZ += player.forwardSpeed * dt;
    game.enemies.update(dt, player);

    // Ocasionalmente destrói um inimigo à frente
    if (frame % 45 === 0 && game.enemies.enemies.length > 0) {
      const target = game.enemies.enemies.find(e => e.worldZ > player.worldZ && !e.destroyed);
      if (target) {
        target.takeDamage(target.hp + 10);
      }
    }

    // Verifica que nunca ultrapassa o limite
    assert.ok(game.enemies.getActiveEnemyCount() <= game.enemies.getMaxActiveEnemies());
  }

  // Ao final de 600 frames, a contagem de inimigos é perfeitamente controlada
  assert.ok(game.enemies.enemies.length <= game.enemies.getMaxActiveEnemies());
  console.log(`   (Após 600 quadros: ${game.enemies.enemies.length} inimigos ativos, ${game.kills} eliminados, score=${Math.round(game.score)})`);
});

console.log(`\n=== RESULTADOS: ${testsPassed}/${totalTests} TESTES PASSARAM ===`);
if (testsPassed === totalTests) {
  console.log('🎉 TODOS OS TESTES DO PROMPT 8 PASSARAM COM SUCESSO!');
} else {
  process.exit(1);
}
