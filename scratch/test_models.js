
/**
 * ============================================================================
 * VOXEL ROAD STRIKE 3D
 * Jogo Completo de Combate Veicular Arcade em WebGL Nativo & JavaScript Puro
 * Sem bibliotecas externas (Three.js, Babylon.js, etc.)
 * ============================================================================
 */

'use strict';

/* ============================================================================
   1. MATEMÁTICA 3D (VETORES, MATRIZES 4x4 E UTILITÁRIOS)
   ============================================================================ */

const Math3D = {
  // Cria matriz identidade 4x4
  createMat4() {
    const out = new Float32Array(16);
    out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
    return out;
  },

  // Matriz de projeção perspectiva
  perspective(out, fovyRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovyRad / 2);
    const nf = 1 / (near - far);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = (2 * far * near) * nf;
    return out;
  },

  // Matriz de Câmera LookAt
  lookAt(out, eye, center, up) {
    let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
    let eyex = eye[0], eyey = eye[1], eyez = eye[2];
    let upx = up[0], upy = up[1], upz = up[2];
    let centerx = center[0], centery = center[1], centerz = center[2];

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;
    len = 1 / Math.hypot(z0, z1, z2);
    z0 *= len; z1 *= len; z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.hypot(x0, x1, x2);
    if (!len) {
      x0 = 0; x1 = 0; x2 = 0;
    } else {
      len = 1 / len;
      x0 *= len; x1 *= len; x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    len = Math.hypot(y0, y1, y2);
    if (!len) {
      y0 = 0; y1 = 0; y2 = 0;
    } else {
      len = 1 / len;
      y0 *= len; y1 *= len; y2 *= len;
    }

    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;
    return out;
  },

  // Multiplicação de matrizes 4x4: out = a * b
  multiplyMat4(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  },

  // Translação de matriz
  translateMat4(out, a, v) {
    const x = v[0], y = v[1], z = v[2];
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      out.set(a);
      this.translateMat4(out, out, v);
    }
    return out;
  },

  // Rotação Y
  rotateY(out, a, rad) {
    const s = Math.sin(rad), c = Math.cos(rad);
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    if (a !== out) out.set(a);
    out[0] = c * a00 - s * a20;
    out[1] = c * a01 - s * a21;
    out[2] = c * a02 - s * a22;
    out[3] = c * a03 - s * a23;
    out[8] = s * a00 + c * a20;
    out[9] = s * a01 + c * a21;
    out[10] = s * a02 + c * a22;
    out[11] = s * a03 + c * a23;
    return out;
  },

  // Rotação X
  rotateX(out, a, rad) {
    const s = Math.sin(rad), c = Math.cos(rad);
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    if (a !== out) out.set(a);
    out[4] = c * a10 + s * a20;
    out[5] = c * a11 + s * a21;
    out[6] = c * a12 + s * a22;
    out[7] = c * a13 + s * a23;
    out[8] = c * a20 - s * a10;
    out[9] = c * a21 - s * a11;
    out[10] = c * a22 - s * a12;
    out[11] = c * a23 - s * a13;
    return out;
  },

  // Rotação Z
  rotateZ(out, a, rad) {
    const s = Math.sin(rad), c = Math.cos(rad);
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    if (a !== out) out.set(a);
    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;
    out[3] = c * a03 + s * a13;
    out[4] = c * a10 - s * a00;
    out[5] = c * a11 - s * a01;
    out[6] = c * a12 - s * a02;
    out[7] = c * a13 - s * a03;
    return out;
  },

  // Escala
  scaleMat4(out, a, v) {
    const x = v[0], y = v[1], z = v[2];
    out[0] = a[0] * x; out[1] = a[1] * x; out[2] = a[2] * x; out[3] = a[3] * x;
    out[4] = a[4] * y; out[5] = a[5] * y; out[6] = a[6] * y; out[7] = a[7] * y;
    out[8] = a[8] * z; out[9] = a[9] * z; out[10] = a[10] * z; out[11] = a[11] * z;
    out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
    return out;
  },

  // Projeção de ponto 3D para espaço de tela (X, Y 2D e profundidade)
  projectToScreen(point3D, viewProjMatrix, width, height) {
    const x = point3D[0], y = point3D[1], z = point3D[2];
    const w = x * viewProjMatrix[3] + y * viewProjMatrix[7] + z * viewProjMatrix[11] + viewProjMatrix[15];
    if (w <= 0.05) return null; // Atrás da câmera

    const clipX = (x * viewProjMatrix[0] + y * viewProjMatrix[4] + z * viewProjMatrix[8] + viewProjMatrix[12]) / w;
    const clipY = (x * viewProjMatrix[1] + y * viewProjMatrix[5] + z * viewProjMatrix[9] + viewProjMatrix[13]) / w;

    return {
      x: (clipX * 0.5 + 0.5) * width,
      y: (-clipY * 0.5 + 0.5) * height,
      depth: w
    };
  }
};


/* ============================================================================
   2. CONFIGURAÇÕES CENTRAIS (INIMIGOS, ARMAS, MAPAS)
   ============================================================================ */

// Identidade central e balanceamento dos tipos de veículos inimigos
const ENEMY_TYPES = {
  raptor: {
    name: 'Raptor',
    modelKey: 'enemy_raptor',
    baseHp: 800, // 800 HP obrigatório
    weapon: 'machinegun', // sempre metralhadora
    score: 600,
    cruiseSpeed: 52.0,
    maxSpeed: 68.0,
    accel: 14.0,
    lateralSpeed: 6.0,
    width: 2.2, height: 1.2, depth: 3.4,
    fireInterval: 1.1,
    isTruck: false,
    aiType: 'align'
  },
  titan: {
    name: 'Titan',
    modelKey: 'enemy_titan',
    baseHp: 1200, // 1200 HP obrigatório
    weapon: 'cannon', // sempre canhão
    score: 1200,
    cruiseSpeed: 40.0,
    maxSpeed: 54.0,
    accel: 8.0,
    lateralSpeed: 3.2,
    width: 3.2, height: 1.8, depth: 4.2,
    fireInterval: 2.2,
    isTruck: true,
    aiType: 'heavy'
  },
  scout: {
    name: 'Scout Buggy',
    modelKey: 'enemy_scout',
    baseHp: 500,
    weapon: 'machinegun', // metralhadora leve
    score: 450,
    cruiseSpeed: 55.0,
    maxSpeed: 72.0,
    accel: 16.0,
    lateralSpeed: 7.0,
    width: 2.0, height: 1.1, depth: 3.0,
    fireInterval: 1.4,
    isTruck: false,
    aiType: 'evasive'
  },
  hauler: {
    name: 'Caminhão Hauler',
    modelKey: 'enemy_hauler',
    baseHp: 1500,
    weapon: 'shotgun', // sempre dispersora / torreta pesada
    score: 1500,
    cruiseSpeed: 38.0,
    maxSpeed: 50.0,
    accel: 7.0,
    lateralSpeed: 2.8,
    width: 3.4, height: 2.4, depth: 5.8,
    fireInterval: 1.9,
    isTruck: true,
    aiType: 'steady'
  }
};

// Especificações Visuais e Atributos dos Veículos Jogáveis
const VEHICLE_DATA = {
  interceptor: {
    displayName: 'INFILTRADOR',
    subtitle: 'Aston Martin DB5',
    badge: 'ESPORTIVO CLÁSSICO',
    badgeClass: 'badge-bal',
    description: 'Esportivo clássico prateado, inspirado no Aston Martin DB5.',
    modelRef: 'Inspirado no Aston Martin DB5 prateado',
    speedPct: '70%',
    agilityPct: '75%',
    armorPct: '60%',
    weaponNotes: {
      machinegun: 'Duas metralhadoras embutidas nos paralamas dianteiros.',
      shotgun: 'Canhão frontal de dispersão integrado à grade cromada.',
      cannon: 'Canhão pesado montado sobre o teto da cabine.'
    }
  },
  raptor: {
    displayName: 'VELOZ',
    subtitle: 'Lamborghini Aventador',
    badge: 'SUPERCARRO & AEROFÓLIO',
    badgeClass: 'badge-spd',
    description: 'Supercarro vermelho-alaranjado, baixo e agressivo, com aerofólio traseiro.',
    modelRef: 'Inspirado no Lamborghini Aventador vermelho-alaranjado',
    speedPct: '95%',
    agilityPct: '95%',
    armorPct: '45%',
    weaponNotes: {
      machinegun: 'Metralhadoras duplas aerodinâmicas nos paralamas dianteiros.',
      shotgun: 'Canhão frontal integrado ao bico angular em cunha.',
      cannon: 'Canhão pesado montado sobre o teto baixo aerodinâmico.'
    }
  },
  titan: {
    displayName: 'TITAN',
    subtitle: 'Ford F-150',
    badge: 'PICAPE ROBUSTA',
    badgeClass: 'badge-arm',
    description: 'Picape azul-marinho robusta, inspirada na Ford F-150.',
    modelRef: 'Inspirada na Ford F-150 azul-marinho',
    speedPct: '55%',
    agilityPct: '50%',
    armorPct: '95%',
    weaponNotes: {
      machinegun: 'Metralhadoras reforçadas sobre os paralamas dianteiros.',
      shotgun: 'Canhão frontal maciço acoplado na grade cromada.',
      cannon: 'Canhão pesado de artilharia montado no teto da cabine.'
    }
  }
};

// Armas do Jogador
const PLAYER_WEAPONS = {
  machinegun: {
    name: 'Metralhadora',
    fireRate: 8.0, // 8 tiros por segundo obrigatório
    damage: 60,    // 60 de dano por tiro (triplicado)
    range: 330.0,  // 330.0 de alcance (dobrado de 165.0)
    speed: 150.0,
    color: [1.0, 0.9, 0.15],
    size: 0.28
  },
  shotgun: {
    name: 'Dispersora',
    fireRate: 2.4,
    damage: 150,   // 150 de dano por projétil (triplicado)
    pellets: 3,    // Exatamente 3 balas obrigatório
    spreadAngles: [-0.045, 0.0, 0.045], // Ângulos precisos do leque da Dispersora
    range: 184.0,  // 184.0 de alcance (dobrado de 92.0)
    speed: 120.0,
    color: [0.0, 0.95, 1.0],
    size: 0.32
  },
  cannon: {
    name: 'Canhão Pesado',
    fireRate: 1.2, // Cadência menor que a metralhadora
    damage: 450,   // 450 de dano por tiro (triplicado)
    range: 440.0,  // 440.0 de alcance (dobrado de 220.0)
    speed: 125.0,
    color: [1.0, 0.25, 0.05],
    size: 0.75
  }
};

// Configurações de Ambientação e Mapas 3D
const MAP_CONFIGS = {
  desert: {
    name: 'Deserto',
    fogColor: [0.38, 0.28, 0.18],
    ambientColor: [0.55, 0.45, 0.35],
    sunColor: [1.0, 0.92, 0.75],
    lightDir: [0.5, 0.85, 0.2],
    roadAsphalt: [0.22, 0.20, 0.18],
    roadShoulder: [0.65, 0.50, 0.30],
    terrainColor: [0.78, 0.58, 0.32],
    weather: 'none',
    obstacles: ['desert_rock', 'barrier', 'wreck']
  },
  snow: {
    name: 'Floresta Nevada',
    fogColor: [0.28, 0.35, 0.45],
    ambientColor: [0.48, 0.52, 0.62],
    sunColor: [0.90, 0.95, 1.0],
    lightDir: [0.3, 0.9, 0.3],
    roadAsphalt: [0.15, 0.17, 0.22],
    roadShoulder: [0.85, 0.90, 0.95],
    terrainColor: [0.92, 0.95, 0.98],
    weather: 'snow',
    obstacles: ['snow_boulder', 'pine_log', 'frozen_crate']
  },
  japan_rural: {
    name: 'Japão Rural',
    fogColor: [0.24, 0.32, 0.28],
    ambientColor: [0.45, 0.52, 0.45],
    sunColor: [0.98, 0.95, 0.85],
    lightDir: [0.4, 0.8, 0.35],
    roadAsphalt: [0.18, 0.20, 0.20],
    roadShoulder: [0.35, 0.45, 0.30],
    terrainColor: [0.28, 0.52, 0.24],
    weather: 'sakura',
    obstacles: ['stone_lantern', 'wooden_gate_beam', 'rural_crate']
  }
};


/* ============================================================================
   3. SHADERS GLSL E RENDERIZADOR WEBGL COM SUPORTE A 3D
   ============================================================================ */

const VS_SOURCE = `
  attribute vec3 a_position;
  attribute vec3 a_normal;
  attribute vec4 a_color;

  uniform mat4 u_viewProjection;
  uniform mat4 u_model;
  uniform vec3 u_lightDir;
  uniform vec3 u_ambientColor;
  uniform vec3 u_sunColor;
  uniform vec4 u_tint;
  uniform vec3 u_cameraPos;
  uniform float u_fogNear;
  uniform float u_fogFar;

  varying vec4 v_color;
  varying float v_fogFactor;

  void main() {
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    gl_Position = u_viewProjection * worldPos;

    vec3 normal = normalize(mat3(u_model) * a_normal);
    float diff = max(dot(normal, normalize(u_lightDir)), 0.0);
    vec3 lighting = u_ambientColor + u_sunColor * diff;

    vec3 col = a_color.rgb * lighting;
    if (u_tint.a > 0.0) {
      col = mix(col, u_tint.rgb, u_tint.a);
    }
    v_color = vec4(col, a_color.a);

    float dist = length(worldPos.xyz - u_cameraPos);
    v_fogFactor = clamp((dist - u_fogNear) / (u_fogFar - u_fogNear), 0.0, 1.0);
  }
`;

const FS_SOURCE = `
  precision mediump float;
  varying vec4 v_color;
  varying float v_fogFactor;
  uniform vec3 u_fogColor;

  void main() {
    vec3 finalColor = mix(v_color.rgb, u_fogColor, v_fogFactor);
    gl_FragColor = vec4(finalColor, v_color.a);
  }
`;

class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true });
    if (!this.gl) {
      alert('WebGL não suportado pelo seu navegador.');
      throw new Error('WebGL not supported');
    }

    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.program = this.createProgram(VS_SOURCE, FS_SOURCE);
    gl.useProgram(this.program);

    this.attribs = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      normal: gl.getAttribLocation(this.program, 'a_normal'),
      color: gl.getAttribLocation(this.program, 'a_color')
    };

    this.uniforms = {
      viewProjection: gl.getUniformLocation(this.program, 'u_viewProjection'),
      model: gl.getUniformLocation(this.program, 'u_model'),
      lightDir: gl.getUniformLocation(this.program, 'u_lightDir'),
      ambientColor: gl.getUniformLocation(this.program, 'u_ambientColor'),
      sunColor: gl.getUniformLocation(this.program, 'u_sunColor'),
      tint: gl.getUniformLocation(this.program, 'u_tint'),
      cameraPos: gl.getUniformLocation(this.program, 'u_cameraPos'),
      fogColor: gl.getUniformLocation(this.program, 'u_fogColor'),
      fogNear: gl.getUniformLocation(this.program, 'u_fogNear'),
      fogFar: gl.getUniformLocation(this.program, 'u_fogFar')
    };

    // Parâmetros de iluminação atmosférica inicial
    this.lightDir = [0.4, 0.85, 0.3];
    this.ambientColor = [0.45, 0.48, 0.55];
    this.sunColor = [0.85, 0.82, 0.75];
    this.fogColor = [0.08, 0.10, 0.18];
    this.fogNear = 60.0;
    this.fogFar = 260.0;

    this.matProj = Math3D.createMat4();
    this.matView = Math3D.createMat4();
    this.matViewProj = Math3D.createMat4();
    this.matModel = Math3D.createMat4();

    // Buffer Dinâmico Compartilhado para Detritos, Projéteis e Partículas
    this.dynamicBuffer = gl.createBuffer();
    this.dynamicCapacity = 80000;
    this.dynamicArray = new Float32Array(this.dynamicCapacity * 10);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.dynamicArray.byteLength, gl.DYNAMIC_DRAW);

    this.resize();
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgram(vsSource, fsSource) {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  resize() {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.gl.viewport(0, 0, displayWidth, displayHeight);
    }
  }

  createMesh(vertexData) {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    return {
      buffer: buffer,
      vertexCount: vertexData.length / 10
    };
  }

  beginFrame(camera) {
    this.resize();
    const gl = this.gl;
    gl.clearColor(this.fogColor[0], this.fogColor[1], this.fogColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = this.canvas.width / this.canvas.height;
    Math3D.perspective(this.matProj, (65 * Math.PI) / 180, aspect, 0.5, 450.0);
    Math3D.lookAt(this.matView, camera.eye, camera.target, camera.up);
    Math3D.multiplyMat4(this.matViewProj, this.matProj, this.matView);

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uniforms.viewProjection, false, this.matViewProj);
    gl.uniform3fv(this.uniforms.lightDir, this.lightDir);
    gl.uniform3fv(this.uniforms.ambientColor, this.ambientColor);
    gl.uniform3fv(this.uniforms.sunColor, this.sunColor);
    gl.uniform3fv(this.uniforms.fogColor, this.fogColor);
    gl.uniform1f(this.uniforms.fogNear, this.fogNear);
    gl.uniform1f(this.uniforms.fogFar, this.fogFar);
    gl.uniform3fv(this.uniforms.cameraPos, camera.eye);
    gl.uniform4f(this.uniforms.tint, 0, 0, 0, 0);
  }

  bindMeshAttributes(buffer) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const stride = 10 * 4;
    gl.enableVertexAttribArray(this.attribs.position);
    gl.vertexAttribPointer(this.attribs.position, 3, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(this.attribs.normal);
    gl.vertexAttribPointer(this.attribs.normal, 3, gl.FLOAT, false, stride, 3 * 4);

    gl.enableVertexAttribArray(this.attribs.color);
    gl.vertexAttribPointer(this.attribs.color, 4, gl.FLOAT, false, stride, 6 * 4);
  }

  drawMesh(mesh, modelMatrix, tint = null) {
    if (!mesh || mesh.vertexCount === 0) return;
    const gl = this.gl;
    this.bindMeshAttributes(mesh.buffer);
    gl.uniformMatrix4fv(this.uniforms.model, false, modelMatrix);
    if (tint) {
      gl.uniform4f(this.uniforms.tint, tint[0], tint[1], tint[2], tint[3]);
    } else {
      gl.uniform4f(this.uniforms.tint, 0, 0, 0, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
  }

  drawDynamicBatch(floatData, count) {
    if (count === 0) return;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, floatData.subarray(0, count * 10));
    this.bindMeshAttributes(this.dynamicBuffer);

    const identity = Math3D.createMat4();
    gl.uniformMatrix4fv(this.uniforms.model, false, identity);
    gl.uniform4f(this.uniforms.tint, 0, 0, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, count);
  }
}


/* ============================================================================
   4. GERADOR DE MODELOS VOXEL PROCEDURAIS 3D REALISTAS
   ============================================================================ */

const VoxelBuilder = {
  // Adiciona feixe 3D contínuo, reto e sem quebras entre dois pontos (linha contínua pura)
  addContinuousBeam(vertices, x0, y0, z0, x1, y1, z1, thickness, r, g, b, a = 1.0) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dy, dz) || 1.0;
    const ux = dx / len, uy = dy / len, uz = dz / len;

    // Vetor perpendicular horizontal no plano XZ
    let rx = -uz, rz = ux;
    const rLen = Math.hypot(rx, rz) || 1.0;
    rx /= rLen; rz /= rLen;

    const h = thickness * 0.5;
    const rxH = rx * h, rzH = rz * h;

    // 4 vértices do perfil na origem P0
    const p00 = [x0 - rxH, y0 - h, z0 - rzH];
    const p01 = [x0 + rxH, y0 - h, z0 + rzH];
    const p02 = [x0 + rxH, y0 + h, z0 + rzH];
    const p03 = [x0 - rxH, y0 + h, z0 - rzH];

    // 4 vértices do perfil no destino P1
    const p10 = [x1 - rxH, y1 - h, z1 - rzH];
    const p11 = [x1 + rxH, y1 - h, z1 + rzH];
    const p12 = [x1 + rxH, y1 + h, z1 + rzH];
    const p13 = [x1 - rxH, y1 + h, z1 - rzH];

    const faces = [
      // Topo (+Y)
      { norm: [0, 1, 0], quad: [ p03, p02, p12, p03, p12, p13 ] },
      // Base (-Y)
      { norm: [0, -1, 0], quad: [ p00, p10, p11, p00, p11, p01 ] },
      // Lado Direito (+R)
      { norm: [rx, 0, rz], quad: [ p01, p11, p12, p01, p12, p02 ] },
      // Lado Esquerdo (-R)
      { norm: [-rx, 0, -rz], quad: [ p00, p03, p13, p00, p13, p10 ] },
      // Frente (Extremidade P1)
      { norm: [ux, uy, uz], quad: [ p10, p13, p12, p10, p12, p11 ] },
      // Trás (Extremidade P0)
      { norm: [-ux, -uy, -uz], quad: [ p00, p01, p02, p00, p02, p03 ] }
    ];

    for (let f = 0; f < 6; f++) {
      const face = faces[f];
      const nx = face.norm[0], ny = face.norm[1], nz = face.norm[2];
      for (let v = 0; v < 6; v++) {
        const p = face.quad[v];
        vertices.push(p[0], p[1], p[2], nx, ny, nz, r, g, b, a);
      }
    }
  },

  // Adiciona cubo / bloco 3D orientado com rotação Y
  addOrientedBox(vertices, cx, cy, cz, sx, sy, sz, angle, r, g, b, a = 1.0) {
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;

    const transformPoint = (lx, ly, lz) => [
      cx + lx * cosA + lz * sinA,
      cy + ly,
      cz - lx * sinA + lz * cosA
    ];

    const p000 = transformPoint(-hx, -hy, -hz);
    const p100 = transformPoint(hx, -hy, -hz);
    const p110 = transformPoint(hx, hy, -hz);
    const p010 = transformPoint(-hx, hy, -hz);
    const p001 = transformPoint(-hx, -hy, hz);
    const p101 = transformPoint(hx, -hy, hz);
    const p111 = transformPoint(hx, hy, hz);
    const p011 = transformPoint(-hx, hy, hz);

    const normFront = [sinA, 0, cosA];
    const normBack = [-sinA, 0, -cosA];
    const normRight = [cosA, 0, -sinA];
    const normLeft = [-cosA, 0, sinA];

    const faces = [
      // Frente (+Z local)
      { norm: normFront, quad: [ p001, p101, p111, p001, p111, p011 ] },
      // Trás (-Z local)
      { norm: normBack, quad: [ p100, p000, p010, p100, p010, p110 ] },
      // Topo (+Y)
      { norm: [0, 1, 0], quad: [ p011, p111, p110, p011, p110, p010 ] },
      // Base (-Y)
      { norm: [0, -1, 0], quad: [ p000, p100, p101, p000, p101, p001 ] },
      // Direita (+X local)
      { norm: normRight, quad: [ p101, p100, p110, p101, p110, p111 ] },
      // Esquerda (-X local)
      { norm: normLeft, quad: [ p000, p001, p011, p000, p011, p010 ] }
    ];

    for (let f = 0; f < 6; f++) {
      const face = faces[f];
      const nx = face.norm[0], ny = face.norm[1], nz = face.norm[2];
      for (let v = 0; v < 6; v++) {
        const p = face.quad[v];
        vertices.push(p[0], p[1], p[2], nx, ny, nz, r, g, b, a);
      }
    }
  },

  // Adiciona cilindro 3D orientado ao longo de uma direção angular (raio, comprimento e rotação)
  addOrientedCylinder(vertices, cx, cy, cz, radius, length, angle, r, g, b, a = 1.0) {
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const ux = sinA, uy = 0, uz = cosA;
    const rx = cosA, ry = 0, rz = -sinA;

    const segments = 16;
    const halfLen = length * 0.5;
    const centerBack = [cx - ux * halfLen, cy, cz - uz * halfLen];
    const centerFront = [cx + ux * halfLen, cy, cz + uz * halfLen];

    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0);
      const c1 = Math.cos(a1), s1 = Math.sin(a1);

      const off0 = [rx * (radius * c0), radius * s0, rz * (radius * c0)];
      const off1 = [rx * (radius * c1), radius * s1, rz * (radius * c1)];

      const n0 = [rx * c0, s0, rz * c0];
      const n1 = [rx * c1, s1, rz * c1];

      const b0 = [centerBack[0] + off0[0], centerBack[1] + off0[1], centerBack[2] + off0[2]];
      const b1 = [centerBack[0] + off1[0], centerBack[1] + off1[1], centerBack[2] + off1[2]];
      const f0 = [centerFront[0] + off0[0], centerFront[1] + off0[1], centerFront[2] + off0[2]];
      const f1 = [centerFront[0] + off1[0], centerFront[1] + off1[1], centerFront[2] + off1[2]];

      // Lateral cilíndrica 3D
      vertices.push(b0[0], b0[1], b0[2], n0[0], n0[1], n0[2], r, g, b, a);
      vertices.push(f0[0], f0[1], f0[2], n0[0], n0[1], n0[2], r, g, b, a);
      vertices.push(f1[0], f1[1], f1[2], n1[0], n1[1], n1[2], r, g, b, a);

      vertices.push(b0[0], b0[1], b0[2], n0[0], n0[1], n0[2], r, g, b, a);
      vertices.push(f1[0], f1[1], f1[2], n1[0], n1[1], n1[2], r, g, b, a);
      vertices.push(b1[0], b1[1], b1[2], n1[0], n1[1], n1[2], r, g, b, a);

      // Tampa frontal (círculo com normal frontal)
      vertices.push(centerFront[0], centerFront[1], centerFront[2], ux, uy, uz, r, g, b, a);
      vertices.push(f0[0], f0[1], f0[2], ux, uy, uz, r, g, b, a);
      vertices.push(f1[0], f1[1], f1[2], ux, uy, uz, r, g, b, a);

      // Tampa traseira (círculo com normal traseira)
      vertices.push(centerBack[0], centerBack[1], centerBack[2], -ux, -uy, -uz, r, g, b, a);
      vertices.push(b1[0], b1[1], b1[2], -ux, -uy, -uz, r, g, b, a);
      vertices.push(b0[0], b0[1], b0[2], -ux, -uy, -uz, r, g, b, a);
    }
  },

  addBox(vertices, cx, cy, cz, sx, sy, sz, r, g, b, a = 1.0) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const x0 = cx - hx, x1 = cx + hx;
    const y0 = cy - hy, y1 = cy + hy;
    const z0 = cz - hz, z1 = cz + hz;

    const faces = [
      // Frente (+Z)
      { norm: [0, 0, 1], quad: [ [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y0, z1], [x1, y1, z1], [x0, y1, z1] ] },
      // Trás (-Z)
      { norm: [0, 0, -1], quad: [ [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0] ] },
      // Topo (+Y)
      { norm: [0, 1, 0], quad: [ [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z1], [x1, y1, z0], [x0, y1, z0] ] },
      // Base (-Y)
      { norm: [0, -1, 0], quad: [ [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z0], [x1, y0, z1], [x0, y0, z1] ] },
      // Direita (+X)
      { norm: [1, 0, 0], quad: [ [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y0, z1], [x1, y1, z0], [x1, y1, z1] ] },
      // Esquerda (-X)
      { norm: [-1, 0, 0], quad: [ [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y0, z0], [x0, y1, z1], [x0, y1, z0] ] }
    ];

    for (let f = 0; f < 6; f++) {
      const face = faces[f];
      const nx = face.norm[0], ny = face.norm[1], nz = face.norm[2];
      for (let v = 0; v < 6; v++) {
        const p = face.quad[v];
        vertices.push(p[0], p[1], p[2], nx, ny, nz, r, g, b, a);
      }
    }
  },

  // Adiciona esfera / cápsula facetada 3D para tiros com iluminação e shading
  addFacetedSphere(vertices, cx, cy, cz, radius, lengthZ, r, g, b, a = 1.0) {
    const segments = 8;
    const rings = 4;
    for (let i = 0; i < rings; i++) {
      const v0 = i / rings;
      const v1 = (i + 1) / rings;
      const phi0 = (v0 - 0.5) * Math.PI;
      const phi1 = (v1 - 0.5) * Math.PI;
      const cosP0 = Math.cos(phi0), sinP0 = Math.sin(phi0);
      const cosP1 = Math.cos(phi1), sinP1 = Math.sin(phi1);

      for (let j = 0; j < segments; j++) {
        const u0 = j / segments;
        const u1 = (j + 1) / segments;
        const theta0 = u0 * Math.PI * 2;
        const theta1 = u1 * Math.PI * 2;

        const p0 = [cx + Math.cos(theta0) * cosP0 * radius, cy + sinP0 * radius, cz + Math.sin(theta0) * cosP0 * radius + (phi0 > 0 ? lengthZ * 0.5 : -lengthZ * 0.5)];
        const p1 = [cx + Math.cos(theta1) * cosP0 * radius, cy + sinP0 * radius, cz + Math.sin(theta1) * cosP0 * radius + (phi0 > 0 ? lengthZ * 0.5 : -lengthZ * 0.5)];
        const p2 = [cx + Math.cos(theta1) * cosP1 * radius, cy + sinP1 * radius, cz + Math.sin(theta1) * cosP1 * radius + (phi1 > 0 ? lengthZ * 0.5 : -lengthZ * 0.5)];
        const p3 = [cx + Math.cos(theta0) * cosP1 * radius, cy + sinP1 * radius, cz + Math.sin(theta0) * cosP1 * radius + (phi1 > 0 ? lengthZ * 0.5 : -lengthZ * 0.5)];

        // Normal do primeiro triângulo
        const n0 = [Math.cos(theta0) * cosP0, sinP0, Math.sin(theta0) * cosP0];
        const n1 = [Math.cos(theta1) * cosP0, sinP0, Math.sin(theta1) * cosP0];
        const n2 = [Math.cos(theta1) * cosP1, sinP1, Math.sin(theta1) * cosP1];
        const n3 = [Math.cos(theta0) * cosP1, sinP1, Math.sin(theta0) * cosP1];

        // Triângulo 1 (p0, p1, p2)
        vertices.push(p0[0], p0[1], p0[2], n0[0], n0[1], n0[2], r, g, b, a);
        vertices.push(p1[0], p1[1], p1[2], n1[0], n1[1], n1[2], r, g, b, a);
        vertices.push(p2[0], p2[1], p2[2], n2[0], n2[1], n2[2], r, g, b, a);

        // Triângulo 2 (p0, p2, p3)
        vertices.push(p0[0], p0[1], p0[2], n0[0], n0[1], n0[2], r, g, b, a);
        vertices.push(p2[0], p2[1], p2[2], n2[0], n2[1], n2[2], r, g, b, a);
        vertices.push(p3[0], p3[1], p3[2], n3[0], n3[1], n3[2], r, g, b, a);
      }
    }
  },

  createModelDef() {
    return {
      boxes: [],
      add(cx, cy, cz, sx, sy, sz, r, g, b, a = 1.0, type = 'body') {
        this.boxes.push({ cx, cy, cz, sx, sy, sz, r, g, b, a, type });
        return this;
      },
      bake(renderer) {
        const verts = [];
        for (const b of this.boxes) {
          VoxelBuilder.addBox(verts, b.cx, b.cy, b.cz, b.sx, b.sy, b.sz, b.r, b.g, b.b, b.a);
        }
        return {
          mesh: renderer.createMesh(verts),
          boxes: this.boxes
        };
      }
    };
  },

  // Helper para adicionar roda voxel realista
  addWheel(m, cx, cy, cz, radius = 0.45, width = 0.35) {
    // Pneu borracha cinza escura
    m.add(cx, cy, cz, width, radius * 2, radius * 2, 0.12, 0.12, 0.14, 1.0, 'wheel');
    // Calota / Roda metálica
    m.add(cx + (cx > 0 ? 0.04 : -0.04), cy, cz, 0.08, radius * 1.2, radius * 1.2, 0.75, 0.78, 0.82, 1.0, 'wheel');
  },

  /* ================= JOGADOR (MODELOS INSPIRADOS EM CARROS REAIS) ================= */

  // Anexa as armas na geometria do veículo com simetria, alinhamento e precisão anatômica
  addWeaponToVehicle(m, vehicleType, weaponType = 'machinegun') {
    const gunMetal = [0.22, 0.24, 0.28];
    const darkSteel = [0.15, 0.16, 0.18];
    const barrelTip = [0.35, 0.38, 0.42];
    const energyGlow = [0.0, 0.92, 1.0];
    const heavyDark = [0.12, 0.13, 0.15];

    if (weaponType === 'machinegun') {
      // Metralhadora: Duas armas simétricas nos paralamas dianteiros apontadas para a frente (+Z)
      if (vehicleType === 'interceptor') {
        const fenderX = 0.74, fenderY = 0.58, fenderZ = 1.15;
        m.add(-fenderX, fenderY, fenderZ, 0.16, 0.14, 1.30, gunMetal[0], gunMetal[1], gunMetal[2], 1.0, 'weapon');
        m.add(fenderX, fenderY, fenderZ, 0.16, 0.14, 1.30, gunMetal[0], gunMetal[1], gunMetal[2], 1.0, 'weapon');
        m.add(-fenderX, fenderY, fenderZ + 0.72, 0.18, 0.16, 0.18, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
        m.add(fenderX, fenderY, fenderZ + 0.72, 0.18, 0.16, 0.18, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
      } else if (vehicleType === 'raptor') {
        const fenderX = 0.82, fenderY = 0.48, fenderZ = 1.18;
        m.add(-fenderX, fenderY, fenderZ, 0.15, 0.13, 1.35, gunMetal[0], gunMetal[1], gunMetal[2], 1.0, 'weapon');
        m.add(fenderX, fenderY, fenderZ, 0.15, 0.13, 1.35, gunMetal[0], gunMetal[1], gunMetal[2], 1.0, 'weapon');
        m.add(-fenderX, fenderY, fenderZ + 0.74, 0.17, 0.15, 0.16, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
        m.add(fenderX, fenderY, fenderZ + 0.74, 0.17, 0.15, 0.16, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
      } else { // titan
        const fenderX = 0.98, fenderY = 0.96, fenderZ = 1.25;
        m.add(-fenderX, fenderY, fenderZ, 0.20, 0.18, 1.45, gunMetal[0], gunMetal[1], gunMetal[2], 1.0, 'weapon');
        m.add(fenderX, fenderY, fenderZ, 0.20, 0.18, 1.45, gunMetal[0], gunMetal[1], gunMetal[2], 1.0, 'weapon');
        m.add(-fenderX, fenderY, fenderZ + 0.78, 0.22, 0.20, 0.18, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
        m.add(fenderX, fenderY, fenderZ + 0.78, 0.22, 0.20, 0.18, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
      }

    } else if (weaponType === 'shotgun') {
      // Dispersora: Um único canhão na parte frontal do veículo, alinhado ao centro e conectado à grade/para-choque
      if (vehicleType === 'interceptor') {
        m.add(0, 0.44, 1.75, 0.48, 0.32, 0.55, gunMetal[0], gunMetal[1], gunMetal[2], 1.0, 'weapon');
        m.add(0, 0.44, 2.12, 0.38, 0.26, 0.40, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
        m.add(0, 0.44, 2.34, 0.42, 0.30, 0.10, energyGlow[0], energyGlow[1], energyGlow[2], 1.0, 'weapon');
      } else if (vehicleType === 'raptor') {
        m.add(0, 0.36, 1.82, 0.46, 0.28, 0.52, gunMetal[0], gunMetal[1], gunMetal[2], 1.0, 'weapon');
        m.add(0, 0.36, 2.18, 0.36, 0.22, 0.38, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
        m.add(0, 0.36, 2.39, 0.40, 0.26, 0.08, energyGlow[0], energyGlow[1], energyGlow[2], 1.0, 'weapon');
      } else { // titan
        m.add(0, 0.74, 2.02, 0.58, 0.38, 0.58, gunMetal[0], gunMetal[1], gunMetal[2], 1.0, 'weapon');
        m.add(0, 0.74, 2.42, 0.46, 0.32, 0.42, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
        m.add(0, 0.74, 2.65, 0.50, 0.36, 0.10, energyGlow[0], energyGlow[1], energyGlow[2], 1.0, 'weapon');
      }

    } else if (weaponType === 'cannon') {
      // Canhão Pesado: Um único canhão montado sobre o topo do veículo, preso à carroceria e acompanhando a movimentação
      if (vehicleType === 'interceptor') {
        m.add(0, 0.96, -0.15, 0.72, 0.18, 0.85, darkSteel[0], darkSteel[1], darkSteel[2], 1.0, 'weapon');
        m.add(0, 1.08, 0.75, 0.30, 0.30, 2.10, heavyDark[0], heavyDark[1], heavyDark[2], 1.0, 'weapon');
        m.add(0, 1.08, 1.88, 0.44, 0.44, 0.26, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
      } else if (vehicleType === 'raptor') {
        m.add(0, 0.84, -0.15, 0.68, 0.16, 0.80, darkSteel[0], darkSteel[1], darkSteel[2], 1.0, 'weapon');
        m.add(0, 0.95, 0.68, 0.28, 0.26, 2.05, heavyDark[0], heavyDark[1], heavyDark[2], 1.0, 'weapon');
        m.add(0, 0.95, 1.78, 0.40, 0.38, 0.24, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
      } else { // titan
        m.add(0, 1.58, 0.15, 0.95, 0.22, 0.95, darkSteel[0], darkSteel[1], darkSteel[2], 1.0, 'weapon');
        m.add(0, 1.74, 0.95, 0.38, 0.38, 2.45, heavyDark[0], heavyDark[1], heavyDark[2], 1.0, 'weapon');
        m.add(0, 1.74, 2.24, 0.52, 0.52, 0.30, barrelTip[0], barrelTip[1], barrelTip[2], 1.0, 'weapon');
      }
    }
  },

  // Infiltrador: Esportivo clássico prateado inspirado no Aston Martin DB5
  buildInterceptor(renderer, weaponType = 'machinegun') {
    const m = this.createModelDef();
    
    // Cores Aston Martin DB5 Silver Birch
    const silver = [0.77, 0.80, 0.83];
    const silverHighlight = [0.85, 0.88, 0.91];
    const silverDark = [0.65, 0.68, 0.72];
    const chrome = [0.88, 0.90, 0.94];
    const glass = [0.55, 0.78, 0.82, 0.85];
    const interior = [0.22, 0.16, 0.12];
    const lights = [1.0, 1.0, 0.92];
    const tailLights = [0.92, 0.12, 0.12];
    const darkGrille = [0.20, 0.22, 0.25];

    // 1. Chassi e assoalho inferior
    m.add(0, 0.26, 0, 1.45, 0.16, 3.4, 0.15, 0.15, 0.18, 1.0, 'chassis');

    // 2. 4 Rodas clássicas com aros metálicos e pneus de borracha
    this.addWheel(m, -0.86, 0.35, 1.05, 0.36, 0.25);
    this.addWheel(m, 0.86, 0.35, 1.05, 0.36, 0.25);
    this.addWheel(m, -0.86, 0.35, -1.05, 0.36, 0.25);
    this.addWheel(m, 0.86, 0.35, -1.05, 0.36, 0.25);

    // 3. Carroceria principal inferior (prateada)
    m.add(0, 0.44, 0, 1.62, 0.28, 3.5, silver[0], silver[1], silver[2], 1.0, 'body');

    // 4. Paralamas clássicos contornando as rodas
    m.add(-0.84, 0.44, 1.05, 0.14, 0.26, 1.1, silver[0], silver[1], silver[2], 1.0, 'fender');
    m.add(0.84, 0.44, 1.05, 0.14, 0.26, 1.1, silver[0], silver[1], silver[2], 1.0, 'fender');
    m.add(-0.84, 0.44, -1.05, 0.14, 0.26, 1.1, silver[0], silver[1], silver[2], 1.0, 'fender');
    m.add(0.84, 0.44, -1.05, 0.14, 0.26, 1.1, silver[0], silver[1], silver[2], 1.0, 'fender');

    // 5. Saídas de ar laterais cromadas clássicas do DB5 (side strakes nos paralamas)
    m.add(-0.86, 0.48, 0.45, 0.08, 0.08, 0.35, chrome[0], chrome[1], chrome[2], 1.0, 'trim');
    m.add(0.86, 0.48, 0.45, 0.08, 0.08, 0.35, chrome[0], chrome[1], chrome[2], 1.0, 'trim');

    // 6. Capô alongado clássico do DB5
    m.add(0, 0.54, 1.0, 1.48, 0.16, 1.6, silverHighlight[0], silverHighlight[1], silverHighlight[2], 1.0, 'hood');
    // Entrada de ar central no capô (hood scoop)
    m.add(0, 0.63, 1.05, 0.35, 0.06, 0.55, silverDark[0], silverDark[1], silverDark[2], 1.0, 'scoop');

    // 7. Dianteira arredondada clássica com grade em arco
    m.add(0, 0.48, 1.82, 1.40, 0.24, 0.25, silver[0], silver[1], silver[2], 1.0, 'nose');
    // Grade cromada DB5 com aletas escuras
    m.add(0, 0.44, 1.95, 0.75, 0.24, 0.08, chrome[0], chrome[1], chrome[2], 1.0, 'grille_frame');
    m.add(0, 0.44, 1.97, 0.65, 0.18, 0.06, darkGrille[0], darkGrille[1], darkGrille[2], 1.0, 'grille');
    // Faróis redondos clássicos salientes com aros cromados
    m.add(-0.58, 0.50, 1.92, 0.25, 0.22, 0.12, chrome[0], chrome[1], chrome[2], 1.0, 'light_rim');
    m.add(0.58, 0.50, 1.92, 0.25, 0.22, 0.12, chrome[0], chrome[1], chrome[2], 1.0, 'light_rim');
    m.add(-0.58, 0.50, 1.97, 0.18, 0.18, 0.06, lights[0], lights[1], lights[2], 1.0, 'light');
    m.add(0.58, 0.50, 1.97, 0.18, 0.18, 0.06, lights[0], lights[1], lights[2], 1.0, 'light');
    // Para-choque dianteiro cromado com batentes verticais
    m.add(0, 0.34, 1.98, 1.55, 0.12, 0.16, chrome[0], chrome[1], chrome[2], 1.0, 'bumper');
    m.add(-0.45, 0.36, 2.04, 0.10, 0.20, 0.08, chrome[0], chrome[1], chrome[2], 1.0, 'bumper_rider');
    m.add(0.45, 0.36, 2.04, 0.10, 0.20, 0.08, chrome[0], chrome[1], chrome[2], 1.0, 'bumper_rider');

    // 8. Cabine compacta recuada com para-brisa inclinado
    m.add(0, 0.68, -0.25, 1.25, 0.32, 1.45, interior[0], interior[1], interior[2], 1.0, 'cabin');
    // Para-brisa dianteiro inclinado com moldura cromada
    m.add(0, 0.72, 0.35, 1.20, 0.34, 0.18, glass[0], glass[1], glass[2], glass[3], 'windshield');
    // Teto baixo arredondado prateado
    m.add(0, 0.87, -0.30, 1.15, 0.08, 1.25, silverHighlight[0], silverHighlight[1], silverHighlight[2], 1.0, 'roof');
    // Vidros laterais
    m.add(-0.62, 0.72, -0.30, 0.06, 0.26, 1.10, glass[0], glass[1], glass[2], glass[3], 'side_window');
    m.add(0.62, 0.72, -0.30, 0.06, 0.26, 1.10, glass[0], glass[1], glass[2], glass[3], 'side_window');
    // Vidro traseiro fastback suave
    m.add(0, 0.72, -0.92, 1.12, 0.28, 0.18, glass[0], glass[1], glass[2], glass[3], 'rear_window');

    // 9. Traseira curta fastback clássica
    m.add(0, 0.52, -1.35, 1.50, 0.24, 0.85, silver[0], silver[1], silver[2], 1.0, 'trunk');
    // Lanternas traseiras verticais clássicas
    m.add(-0.62, 0.50, -1.76, 0.14, 0.20, 0.06, tailLights[0], tailLights[1], tailLights[2], 1.0, 'taillight');
    m.add(0.62, 0.50, -1.76, 0.14, 0.20, 0.06, tailLights[0], tailLights[1], tailLights[2], 1.0, 'taillight');
    // Para-choque traseiro cromado
    m.add(0, 0.35, -1.78, 1.52, 0.12, 0.14, chrome[0], chrome[1], chrome[2], 1.0, 'rear_bumper');
    // Escapamentos duplos cromados
    m.add(-0.35, 0.25, -1.82, 0.10, 0.10, 0.22, chrome[0], chrome[1], chrome[2], 1.0, 'exhaust');
    m.add(0.35, 0.25, -1.82, 0.10, 0.10, 0.22, chrome[0], chrome[1], chrome[2], 1.0, 'exhaust');

    // 10. Adiciona arma montada
    this.addWeaponToVehicle(m, 'interceptor', weaponType);

    return m.bake(renderer);
  },

  // Veloz: Supercarro vermelho-alaranjado, baixo e agressivo, com aerofólio traseiro inspirado no Lamborghini Aventador
  buildRaptorPlayer(renderer, weaponType = 'machinegun') {
    const m = this.createModelDef();

    // Cores Lamborghini Aventador (Arancio Argos)
    const orange = [0.95, 0.26, 0.04];
    const orangeHighlight = [1.0, 0.38, 0.08];
    const orangeDark = [0.76, 0.18, 0.02];
    const carbon = [0.10, 0.10, 0.12];
    const glass = [0.14, 0.15, 0.20, 0.90];
    const ledCyan = [0.15, 0.95, 1.0];
    const tailRed = [1.0, 0.05, 0.05];

    // 1. Chassi rebaixado com saias laterais em fibra de carbono
    m.add(0, 0.22, 0, 1.65, 0.14, 3.6, carbon[0], carbon[1], carbon[2], 1.0, 'chassis');
    m.add(-0.96, 0.24, 0, 0.18, 0.10, 3.2, carbon[0], carbon[1], carbon[2], 1.0, 'side_skirt');
    m.add(0.96, 0.24, 0, 0.18, 0.10, 3.2, carbon[0], carbon[1], carbon[2], 1.0, 'side_skirt');

    // 2. 4 Rodas esportivas de perfil baixo
    this.addWheel(m, -0.95, 0.32, 1.18, 0.34, 0.28);
    this.addWheel(m, 0.95, 0.32, 1.18, 0.34, 0.28);
    this.addWheel(m, -0.98, 0.34, -1.18, 0.36, 0.32);
    this.addWheel(m, 0.98, 0.34, -1.18, 0.36, 0.32);

    // 3. Carroceria baixa, larga e angular (vermelho-alaranjada)
    m.add(0, 0.38, 0, 1.82, 0.24, 3.5, orange[0], orange[1], orange[2], 1.0, 'body');

    // 4. Dianteira em cunha (wedge shape) agressiva e pontiaguda
    m.add(0, 0.36, 1.55, 1.62, 0.20, 1.1, orange[0], orange[1], orange[2], 1.0, 'front_wedge');
    m.add(0, 0.33, 1.95, 1.25, 0.16, 0.55, orangeHighlight[0], orangeHighlight[1], orangeHighlight[2], 1.0, 'nose');
    // Splitter frontal de fibra de carbono em ponta de flecha
    m.add(0, 0.22, 2.05, 1.45, 0.08, 0.28, carbon[0], carbon[1], carbon[2], 1.0, 'splitter');
    // Grandes entradas de ar dianteiras angulares pretas
    m.add(-0.48, 0.32, 1.92, 0.38, 0.16, 0.18, carbon[0], carbon[1], carbon[2], 1.0, 'air_intake');
    m.add(0.48, 0.32, 1.92, 0.38, 0.16, 0.18, carbon[0], carbon[1], carbon[2], 1.0, 'air_intake');
    // Faróis LED angulares afilados geométricos
    m.add(-0.55, 0.39, 1.82, 0.32, 0.08, 0.15, ledCyan[0], ledCyan[1], ledCyan[2], 1.0, 'headlight');
    m.add(0.55, 0.39, 1.82, 0.32, 0.08, 0.15, ledCyan[0], ledCyan[1], ledCyan[2], 1.0, 'headlight');

    // 5. Capô baixo com vincos angulares convergentes
    m.add(0, 0.45, 1.15, 1.35, 0.10, 1.15, orangeHighlight[0], orangeHighlight[1], orangeHighlight[2], 1.0, 'hood');

    // 6. Cabine baixa e inclinada estilo caça a jato
    // Para-brisa extremamente inclinado quase contínuo com o capô
    m.add(0, 0.60, 0.35, 1.15, 0.28, 0.45, glass[0], glass[1], glass[2], glass[3], 'windshield');
    // Teto ultra-baixo com vinco aerodinâmico duplo
    m.add(0, 0.74, -0.22, 1.05, 0.07, 0.95, orange[0], orange[1], orange[2], 1.0, 'roof');
    // Janelas laterais afiladas pretas/fumê
    m.add(-0.56, 0.60, -0.22, 0.06, 0.22, 0.85, glass[0], glass[1], glass[2], glass[3], 'side_glass');
    m.add(0.56, 0.60, -0.22, 0.06, 0.22, 0.85, glass[0], glass[1], glass[2], glass[3], 'side_glass');

    // 7. Entradas de ar laterais massivas estilo Aventador
    m.add(-0.96, 0.45, -0.45, 0.22, 0.24, 0.75, carbon[0], carbon[1], carbon[2], 1.0, 'side_intake');
    m.add(0.96, 0.45, -0.45, 0.22, 0.24, 0.75, carbon[0], carbon[1], carbon[2], 1.0, 'side_intake');

    // 8. Cobertura traseira do motor V12 com lamelas pretas
    m.add(0, 0.58, -0.85, 1.10, 0.16, 0.75, orangeDark[0], orangeDark[1], orangeDark[2], 1.0, 'engine_cover');
    m.add(0, 0.62, -0.85, 0.85, 0.08, 0.65, carbon[0], carbon[1], carbon[2], 1.0, 'slats');

    // 9. Aerofólio Traseiro de Competição (firmemente ancorado na traseira)
    // Suportes / pilares verticais robustos presos à carroceria
    m.add(-0.55, 0.75, -1.55, 0.10, 0.36, 0.18, carbon[0], carbon[1], carbon[2], 1.0, 'wing_mount');
    m.add(0.55, 0.75, -1.55, 0.10, 0.36, 0.18, carbon[0], carbon[1], carbon[2], 1.0, 'wing_mount');
    // Asa principal larga e agressiva vermelha-alaranjada
    m.add(0, 0.94, -1.62, 1.82, 0.07, 0.38, orangeHighlight[0], orangeHighlight[1], orangeHighlight[2], 1.0, 'wing_blade');
    // Aletas verticais aerodinâmicas nas pontas (endplates)
    m.add(-0.92, 0.95, -1.62, 0.06, 0.18, 0.42, carbon[0], carbon[1], carbon[2], 1.0, 'wing_end');
    m.add(0.92, 0.95, -1.62, 0.06, 0.18, 0.42, carbon[0], carbon[1], carbon[2], 1.0, 'wing_end');

    // 10. Traseira agressiva: difusor duplo preto, lanternas e escapamento central
    m.add(0, 0.42, -1.75, 1.70, 0.22, 0.22, orange[0], orange[1], orange[2], 1.0, 'rear_fascia');
    m.add(-0.62, 0.44, -1.84, 0.32, 0.08, 0.06, tailRed[0], tailRed[1], tailRed[2], 1.0, 'taillight');
    m.add(0.62, 0.44, -1.84, 0.32, 0.08, 0.06, tailRed[0], tailRed[1], tailRed[2], 1.0, 'taillight');
    m.add(0, 0.26, -1.84, 1.55, 0.16, 0.20, carbon[0], carbon[1], carbon[2], 1.0, 'diffuser');
    m.add(0, 0.38, -1.86, 0.28, 0.14, 0.10, 0.75, 0.78, 0.82, 1.0, 'exhaust');

    // 11. Adiciona arma montada
    this.addWeaponToVehicle(m, 'raptor', weaponType);

    return m.bake(renderer);
  },

  // Titan: Picape robusta azul-marinho com caçamba aberta inspirada na Ford F-150
  buildTitanPlayer(renderer, weaponType = 'machinegun') {
    const m = this.createModelDef();

    // Cores Ford F-150 (Antimatter Blue / Chrome)
    const navyBlue = [0.06, 0.14, 0.32];
    const navyHighlight = [0.10, 0.22, 0.46];
    const chrome = [0.78, 0.82, 0.86];
    const blackTrim = [0.12, 0.13, 0.15];
    const bedliner = [0.16, 0.17, 0.19];
    const glass = [0.18, 0.22, 0.28, 0.85];
    const lights = [1.0, 0.96, 0.85];
    const tailRed = [0.95, 0.10, 0.10];

    // 1. Chassi elevado de longarinas de aço e suspensão todo-terreno
    m.add(0, 0.32, 0, 1.85, 0.22, 4.0, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'chassis');
    // Estribos laterais resistentes
    m.add(-1.18, 0.34, 0, 0.22, 0.08, 2.8, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'step_bar');
    m.add(1.18, 0.34, 0, 0.22, 0.08, 2.8, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'step_bar');

    // 2. 4 Rodas Off-Road maciças com pneus largos de todo-terreno
    this.addWheel(m, -1.14, 0.46, 1.25, 0.46, 0.36);
    this.addWheel(m, 1.14, 0.46, 1.25, 0.46, 0.36);
    this.addWheel(m, -1.14, 0.46, -1.25, 0.46, 0.36);
    this.addWheel(m, 1.14, 0.46, -1.25, 0.46, 0.36);

    // 3. Carroceria volumosa e alta (azul-marinho)
    m.add(0, 0.62, 0, 2.15, 0.42, 4.1, navyBlue[0], navyBlue[1], navyBlue[2], 1.0, 'body');

    // 4. Paralamas alargados musculosos com molduras pretas
    m.add(-1.14, 0.64, 1.25, 0.20, 0.38, 1.35, navyBlue[0], navyBlue[1], navyBlue[2], 1.0, 'fender');
    m.add(1.14, 0.64, 1.25, 0.20, 0.38, 1.35, navyBlue[0], navyBlue[1], navyBlue[2], 1.0, 'fender');
    m.add(-1.14, 0.64, -1.25, 0.20, 0.38, 1.35, navyBlue[0], navyBlue[1], navyBlue[2], 1.0, 'fender');
    m.add(1.14, 0.64, -1.25, 0.20, 0.38, 1.35, navyBlue[0], navyBlue[1], navyBlue[2], 1.0, 'fender');

    // 5. Dianteira imponente e quadrada de picape com capô alto e massivo
    m.add(0, 0.88, 1.18, 1.95, 0.24, 1.45, navyHighlight[0], navyHighlight[1], navyHighlight[2], 1.0, 'hood');
    // Grade frontal imensa em barras cromadas icônicas da F-150
    m.add(0, 0.78, 1.96, 1.75, 0.58, 0.16, chrome[0], chrome[1], chrome[2], 1.0, 'grille_frame');
    m.add(0, 0.78, 2.02, 1.55, 0.44, 0.08, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'grille_mesh');
    // Barras cromadas horizontais da grade
    m.add(0, 0.84, 2.04, 1.58, 0.10, 0.06, chrome[0], chrome[1], chrome[2], 1.0, 'grille_bar');
    m.add(0, 0.72, 2.04, 1.58, 0.10, 0.06, chrome[0], chrome[1], chrome[2], 1.0, 'grille_bar');
    // Faróis verticais duplos em bloco estilo "C-clamp"
    m.add(-0.95, 0.80, 1.98, 0.28, 0.55, 0.12, lights[0], lights[1], lights[2], 1.0, 'headlight');
    m.add(0.95, 0.80, 1.98, 0.28, 0.55, 0.12, lights[0], lights[1], lights[2], 1.0, 'headlight');
    // Para-choque dianteiro maciço de aço cromado com ganchos de reboque
    m.add(0, 0.44, 2.08, 2.25, 0.38, 0.28, chrome[0], chrome[1], chrome[2], 1.0, 'front_bumper');
    m.add(-0.65, 0.36, 2.22, 0.14, 0.14, 0.10, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'tow_hook');
    m.add(0.65, 0.36, 2.22, 0.14, 0.14, 0.10, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'tow_hook');

    // 6. Cabine Dupla espaçosa e quadrada com teto alto
    m.add(0, 1.14, 0.15, 1.85, 0.65, 1.65, navyBlue[0], navyBlue[1], navyBlue[2], 1.0, 'cabin');
    // Teto plano largo azul-marinho
    m.add(0, 1.48, 0.15, 1.78, 0.08, 1.60, navyHighlight[0], navyHighlight[1], navyHighlight[2], 1.0, 'roof');
    // Para-brisa amplo dianteiro
    m.add(0, 1.20, 0.92, 1.65, 0.48, 0.20, glass[0], glass[1], glass[2], glass[3], 'windshield');
    // Vidros laterais amplos com divisórias de porta
    m.add(-0.94, 1.20, 0.15, 0.06, 0.42, 1.45, glass[0], glass[1], glass[2], glass[3], 'side_glass');
    m.add(0.94, 1.20, 0.15, 0.06, 0.42, 1.45, glass[0], glass[1], glass[2], glass[3], 'side_glass');
    // Janela traseira da cabine voltada para a caçamba
    m.add(0, 1.22, -0.66, 1.55, 0.38, 0.08, glass[0], glass[1], glass[2], glass[3], 'rear_cab_glass');
    // Retrovisores externos quadrados robustos de picape
    m.add(-1.18, 1.15, 0.65, 0.22, 0.18, 0.14, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'mirror');
    m.add(1.18, 1.15, 0.65, 0.22, 0.18, 0.14, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'mirror');

    // 7. Caçamba Traseira (Truck Bed) claramente identificável
    // Assoalho interno rebaixado texturizado com bedliner preto
    m.add(0, 0.72, -1.35, 1.65, 0.08, 1.45, bedliner[0], bedliner[1], bedliner[2], 1.0, 'bed_floor');
    // Paredes laterais altas da caçamba azul-marinho com protetores pretos no topo
    m.add(-0.95, 0.95, -1.35, 0.26, 0.45, 1.50, navyBlue[0], navyBlue[1], navyBlue[2], 1.0, 'bed_side');
    m.add(0.95, 0.95, -1.35, 0.26, 0.45, 1.50, navyBlue[0], navyBlue[1], navyBlue[2], 1.0, 'bed_side');
    m.add(-0.95, 1.18, -1.35, 0.28, 0.06, 1.52, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'bed_rail');
    m.add(0.95, 1.18, -1.35, 0.28, 0.06, 1.52, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'bed_rail');
    // Tampa traseira da caçamba (tailgate) fechada com detalhes cromados
    m.add(0, 0.94, -2.05, 1.95, 0.50, 0.14, navyBlue[0], navyBlue[1], navyBlue[2], 1.0, 'tailgate');
    m.add(0, 0.98, -2.12, 0.45, 0.10, 0.06, chrome[0], chrome[1], chrome[2], 1.0, 'tailgate_handle');
    // Lanternas traseiras verticais nas quinas da caçamba
    m.add(-0.98, 0.95, -2.08, 0.16, 0.44, 0.08, tailRed[0], tailRed[1], tailRed[2], 1.0, 'taillight');
    m.add(0.98, 0.95, -2.08, 0.16, 0.44, 0.08, tailRed[0], tailRed[1], tailRed[2], 1.0, 'taillight');
    // Para-choque traseiro de aço cromado com degrau embutido
    m.add(0, 0.46, -2.12, 2.15, 0.28, 0.22, chrome[0], chrome[1], chrome[2], 1.0, 'rear_bumper');
    m.add(0, 0.48, -2.16, 0.85, 0.12, 0.18, blackTrim[0], blackTrim[1], blackTrim[2], 1.0, 'bumper_step');

    // 8. Adiciona arma montada
    this.addWeaponToVehicle(m, 'titan', weaponType);

    return m.bake(renderer);
  },

  /* ================= INIMIGOS (COM CARROCERIA, RODAS, CABINE, PARA-CHOQUE, ARMAS) ================= */

  // Inimigo Raptor: Carro esportivo de ataque rápido com 4 rodas, para-choques e metralhadoras duplas
  buildEnemyRaptor(renderer) {
    const m = this.createModelDef();
    // Carroceria principal vermelha com listras pretas
    m.add(0, 0.45, 0, 1.5, 0.4, 3.2, 0.85, 0.12, 0.15, 1.0, 'chassis');
    m.add(0, 0.4, 1.6, 1.3, 0.35, 0.8, 0.95, 0.15, 0.2, 1.0, 'hood');
    // Para-choque dianteiro agressivo com faróis amarelos
    m.add(0, 0.35, 2.05, 1.55, 0.3, 0.25, 0.15, 0.15, 0.18, 1.0, 'bumper');
    m.add(-0.55, 0.38, 2.18, 0.25, 0.15, 0.05, 1.0, 0.85, 0.1, 1.0, 'lights');
    m.add(0.55, 0.38, 2.18, 0.25, 0.15, 0.05, 1.0, 0.85, 0.1, 1.0, 'lights');
    // Cabine esportiva com vidros fumê escuros
    m.add(0, 0.75, -0.1, 1.2, 0.35, 1.6, 0.12, 0.12, 0.16, 1.0, 'cab');
    m.add(0, 0.78, 0.6, 1.1, 0.28, 0.2, 0.1, 0.7, 0.9, 0.85, 'glass'); // Parabrisa
    // 4 Rodas esportivas com calotas
    this.addWheel(m, -0.85, 0.35, 1.0, 0.36, 0.25);
    this.addWheel(m, 0.85, 0.35, 1.0, 0.36, 0.25);
    this.addWheel(m, -0.85, 0.35, -1.0, 0.36, 0.25);
    this.addWheel(m, 0.85, 0.35, -1.0, 0.36, 0.25);
    // Metralhadoras frontais duplas nos para-lamas
    m.add(-0.7, 0.55, 0.8, 0.18, 0.18, 1.6, 0.25, 0.28, 0.32, 1.0, 'weapon');
    m.add(0.7, 0.55, 0.8, 0.18, 0.18, 1.6, 0.25, 0.28, 0.32, 1.0, 'weapon');
    // Aerofólio traseiro de competição
    m.add(0, 0.95, -1.5, 1.5, 0.1, 0.35, 0.1, 0.1, 0.12, 1.0, 'spoiler');
    m.add(-0.6, 0.75, -1.5, 0.1, 0.35, 0.2, 0.85, 0.12, 0.15, 1.0, 'spoiler');
    m.add(0.6, 0.75, -1.5, 0.1, 0.35, 0.2, 0.85, 0.12, 0.15, 1.0, 'spoiler');
    return m.bake(renderer);
  },

  // Inimigo Titan: Tanque de Assalto Blindado Pesado com 6 Rodas, Aríete e Canhão Pesado
  buildEnemyTitan(renderer) {
    const m = this.createModelDef();
    // Chassi blindado verde oliva militar
    m.add(0, 0.6, 0, 2.5, 0.6, 4.4, 0.24, 0.32, 0.22, 1.0, 'chassis');
    // Para-choque aríete frontal de aço reforçado com faixas amarelas
    m.add(0, 0.5, 2.3, 2.7, 0.7, 0.5, 0.35, 0.38, 0.42, 1.0, 'bumper');
    m.add(-0.9, 0.5, 2.56, 0.3, 0.5, 0.05, 1.0, 0.75, 0.0, 1.0, 'stripes');
    m.add(0.9, 0.5, 2.56, 0.3, 0.5, 0.05, 1.0, 0.75, 0.0, 1.0, 'stripes');
    // Cabine blindada com fendas de visão
    m.add(0, 1.05, 0.3, 1.8, 0.45, 1.8, 0.2, 0.26, 0.18, 1.0, 'cab');
    m.add(0, 1.1, 1.1, 1.5, 0.18, 0.2, 0.1, 0.8, 0.9, 0.9, 'glass');
    // 6 Rodas pesadas off-road com esteiras laterais
    this.addWheel(m, -1.35, 0.45, 1.3, 0.45, 0.35);
    this.addWheel(m, 1.35, 0.45, 1.3, 0.45, 0.35);
    this.addWheel(m, -1.35, 0.45, 0.0, 0.45, 0.35);
    this.addWheel(m, 1.35, 0.45, 0.0, 0.45, 0.35);
    this.addWheel(m, -1.35, 0.45, -1.3, 0.45, 0.35);
    this.addWheel(m, 1.35, 0.45, -1.3, 0.45, 0.35);
    // Blindagem lateral sobre as rodas
    m.add(-1.4, 0.85, 0, 0.25, 0.3, 4.2, 0.18, 0.24, 0.16, 1.0, 'armor');
    m.add(1.4, 0.85, 0, 0.25, 0.3, 4.2, 0.18, 0.24, 0.16, 1.0, 'armor');
    // Torre de Canhão Pesado giratória no teto
    m.add(0, 1.45, -0.2, 1.2, 0.45, 1.4, 0.15, 0.18, 0.2, 1.0, 'turret');
    m.add(0, 1.45, 1.2, 0.35, 0.35, 2.6, 0.1, 0.1, 0.12, 1.0, 'weapon'); // Tubo maciço do canhão
    m.add(0, 1.45, 2.5, 0.45, 0.45, 0.3, 0.2, 0.22, 0.25, 1.0, 'weapon'); // Freio de boca
    return m.bake(renderer);
  },

  // Inimigo Scout: Buggy Ágil com Gaiola de Proteção, 4 Rodas Off-road e Metralhadora
  buildEnemyScout(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.4, 0, 1.3, 0.35, 2.8, 0.95, 0.65, 0.05, 1.0, 'chassis'); // Laranja desértico
    m.add(0, 0.35, 1.5, 1.1, 0.25, 0.5, 0.2, 0.2, 0.25, 1.0, 'bumper');
    // Gaiola tubular / Santantônio
    m.add(0, 0.85, -0.2, 1.0, 0.6, 1.4, 0.15, 0.15, 0.18, 1.0, 'cage');
    m.add(0, 0.85, 0.4, 0.8, 0.4, 0.1, 0.1, 0.8, 0.9, 0.8, 'glass');
    // 4 Grandes Rodas
    this.addWheel(m, -0.85, 0.4, 0.9, 0.4, 0.3);
    this.addWheel(m, 0.85, 0.4, 0.9, 0.4, 0.3);
    this.addWheel(m, -0.85, 0.4, -0.9, 0.4, 0.3);
    this.addWheel(m, 0.85, 0.4, -0.9, 0.4, 0.3);
    // Metralhadora montada no teto
    m.add(0, 1.3, 0.1, 0.2, 0.2, 1.2, 0.25, 0.25, 0.3, 1.0, 'weapon');
    return m.bake(renderer);
  },

  // Inimigo Hauler: Caminhão Pesado com Cabine Real, 6 Rodas Duplas, Baú Blindado e Dispersora
  buildEnemyHauler(renderer) {
    const m = this.createModelDef();
    // Cabine Frontal Alta (Estilo Truck Europeu / Americano)
    m.add(0, 1.1, 2.2, 2.2, 1.4, 1.8, 0.15, 0.35, 0.75, 1.0, 'cab'); // Azul marinho
    m.add(0, 1.4, 2.9, 1.8, 0.55, 0.25, 0.1, 0.8, 0.95, 0.85, 'glass'); // Parabrisa amplo
    // Grade cromada do motor e para-choque
    m.add(0, 0.6, 3.1, 2.0, 0.6, 0.3, 0.65, 0.68, 0.72, 1.0, 'bumper');
    // Contêiner / Baú traseiro gigante blindado
    m.add(0, 1.35, -1.0, 2.4, 1.8, 4.8, 0.75, 0.76, 0.8, 1.0, 'container');
    m.add(0, 1.35, -1.0, 2.45, 1.5, 4.5, 0.15, 0.35, 0.75, 1.0, 'container'); // Listra lateral
    // 6 Rodas Duplas de Caminhão
    this.addWheel(m, -1.3, 0.5, 2.1, 0.5, 0.35);
    this.addWheel(m, 1.3, 0.5, 2.1, 0.5, 0.35);
    this.addWheel(m, -1.3, 0.5, -0.6, 0.5, 0.35);
    this.addWheel(m, 1.3, 0.5, -0.6, 0.5, 0.35);
    this.addWheel(m, -1.3, 0.5, -2.1, 0.5, 0.35);
    this.addWheel(m, 1.3, 0.5, -2.1, 0.5, 0.35);
    // Torre Dupla Dispersora no Teto
    m.add(0, 2.4, 0.2, 0.6, 0.35, 0.6, 0.2, 0.2, 0.25, 1.0, 'turret');
    m.add(-0.25, 2.4, 0.8, 0.18, 0.18, 1.4, 0.1, 0.1, 0.15, 1.0, 'weapon');
    m.add(0.25, 2.4, 0.8, 0.18, 0.18, 1.4, 0.1, 0.1, 0.15, 1.0, 'weapon');
    return m.bake(renderer);
  },

  /* ================= CENÁRIOS E MAPAS ================= */

  // Terreno e Props do Deserto
  buildDesertMesa(renderer) {
    const m = this.createModelDef();
    m.add(0, 8.0, 0, 20.0, 16.0, 20.0, 0.75, 0.52, 0.32);
    m.add(0, 16.5, 0, 16.0, 4.0, 16.0, 0.82, 0.58, 0.36);
    return m.bake(renderer);
  },

  buildDesertCactus(renderer) {
    const m = this.createModelDef();
    m.add(0, 4.0, 0, 1.0, 8.0, 1.0, 0.2, 0.65, 0.25);
    m.add(-1.8, 4.5, 0, 2.6, 0.9, 0.9, 0.2, 0.65, 0.25);
    m.add(-2.6, 6.0, 0, 0.9, 3.5, 0.9, 0.2, 0.65, 0.25);
    m.add(1.8, 3.5, 0, 2.6, 0.9, 0.9, 0.2, 0.65, 0.25);
    m.add(2.6, 5.0, 0, 0.9, 3.5, 0.9, 0.2, 0.65, 0.25);
    return m.bake(renderer);
  },

  // Terreno e Props da Floresta Nevada
  buildSnowPine(renderer) {
    const m = this.createModelDef();
    m.add(0, 3.0, 0, 1.4, 6.0, 1.4, 0.35, 0.22, 0.15); // Tronco marrom
    // Camadas de copas verdes com coberturas grossas de neve
    m.add(0, 6.0, 0, 8.0, 2.5, 8.0, 0.15, 0.35, 0.2);
    m.add(0, 7.0, 0, 7.8, 0.9, 7.8, 0.92, 0.95, 0.98); // Neve camada 1
    m.add(0, 9.0, 0, 6.0, 2.5, 6.0, 0.15, 0.35, 0.2);
    m.add(0, 10.0, 0, 5.8, 0.9, 5.8, 0.92, 0.95, 0.98); // Neve camada 2
    m.add(0, 12.0, 0, 4.0, 2.5, 4.0, 0.15, 0.35, 0.2);
    m.add(0, 13.0, 0, 3.8, 0.9, 3.8, 0.92, 0.95, 0.98); // Neve camada 3
    m.add(0, 14.5, 0, 1.8, 1.8, 1.8, 0.92, 0.95, 0.98); // Topo nevado
    return m.bake(renderer);
  },

  buildSnowMountain(renderer) {
    const m = this.createModelDef();
    m.add(0, 14.0, 0, 22.0, 28.0, 22.0, 0.3, 0.34, 0.4);
    m.add(0, 28.0, 0, 12.0, 12.0, 12.0, 0.92, 0.95, 0.98);
    return m.bake(renderer);
  },

  // Terreno e Props do Japão Rural (Tradicional, NÃO Tokyo/Neon)
  buildJapanMinka(renderer) {
    const m = this.createModelDef();
    // Casa Tradicional Japonesa Minka com paredes de madeira/shoji e telhado escuro curvado
    m.add(0, 2.2, 0, 10.0, 4.4, 7.0, 0.85, 0.82, 0.75); // Paredes claras
    m.add(0, 2.2, 0, 10.2, 4.4, 0.3, 0.35, 0.22, 0.15); // Pilares de madeira escura
    m.add(0, 2.2, 3.52, 3.0, 2.5, 0.1, 0.35, 0.22, 0.15); // Porta shoji
    // Telhado tradicional inclinado com beirais largos escuros
    m.add(0, 5.0, 0, 12.5, 1.5, 9.5, 0.18, 0.20, 0.22);
    m.add(0, 6.2, 0, 9.5, 1.4, 7.0, 0.15, 0.17, 0.19);
    m.add(0, 7.1, 0, 7.0, 0.8, 5.0, 0.12, 0.14, 0.16);
    return m.bake(renderer);
  },

  buildJapanTorii(renderer) {
    const m = this.createModelDef();
    // Portal Torii Vermelho Xintoísta Tradicional
    const red = [0.85, 0.15, 0.12];
    m.add(-3.2, 5.0, 0, 0.9, 10.0, 0.9, red[0], red[1], red[2]); // Coluna esquerda
    m.add(3.2, 5.0, 0, 0.9, 10.0, 0.9, red[0], red[1], red[2]);  // Coluna direita
    m.add(0, 8.2, 0, 8.5, 0.8, 0.8, red[0], red[1], red[2]);    // Trave horizontal intermediária
    m.add(0, 10.2, 0, 10.5, 1.1, 1.2, red[0], red[1], red[2]);  // Trave horizontal superior
    m.add(0, 10.8, 0, 11.2, 0.35, 1.4, 0.12, 0.12, 0.14);       // Topo preto do Torii
    return m.bake(renderer);
  },

  buildJapanSakura(renderer) {
    const m = this.createModelDef();
    // Cerejeira em Flor (Sakura)
    m.add(0, 3.2, 0, 1.2, 6.4, 1.2, 0.38, 0.25, 0.18); // Tronco retorcido
    // Galhos
    m.add(-1.8, 5.2, 0, 2.5, 0.7, 0.7, 0.38, 0.25, 0.18);
    m.add(1.8, 5.5, 0, 2.5, 0.7, 0.7, 0.38, 0.25, 0.18);
    // Copas volumosas de flores cor-de-rosa suave
    const pink1 = [0.98, 0.72, 0.82];
    const pink2 = [0.95, 0.60, 0.75];
    m.add(0, 7.5, 0, 7.0, 3.5, 7.0, pink1[0], pink1[1], pink1[2]);
    m.add(-2.2, 6.8, 0.5, 4.5, 2.8, 4.5, pink2[0], pink2[1], pink2[2]);
    m.add(2.2, 7.0, -0.5, 4.5, 2.8, 4.5, pink2[0], pink2[1], pink2[2]);
    m.add(0, 9.2, 0, 4.5, 2.0, 4.5, pink1[0], pink1[1], pink1[2]);
    return m.bake(renderer);
  },

  buildJapanLantern(renderer) {
    const m = this.createModelDef();
    // Lanterna de Pedra Japonesa (Ishidoro)
    const stone = [0.55, 0.58, 0.60];
    m.add(0, 0.4, 0, 1.2, 0.8, 1.2, stone[0], stone[1], stone[2]); // Base
    m.add(0, 1.6, 0, 0.6, 1.8, 0.6, stone[0], stone[1], stone[2]); // Poste
    m.add(0, 2.8, 0, 1.4, 0.6, 1.4, stone[0], stone[1], stone[2]); // Plataforma
    m.add(0, 3.5, 0, 1.0, 1.0, 1.0, 0.95, 0.85, 0.45);            // Janela com luz quente suave
    m.add(0, 4.3, 0, 1.6, 0.6, 1.6, stone[0], stone[1], stone[2]); // Telhado de pedra
    return m.bake(renderer);
  },

  /* ================= OBSTÁCULOS ================= */
  buildDesertRock(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.9, 0, 2.6, 1.8, 2.4, 0.72, 0.48, 0.28);
    m.add(0.4, 1.6, -0.2, 1.8, 1.2, 1.8, 0.65, 0.42, 0.24);
    return m.bake(renderer);
  },

  buildSnowBoulder(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.9, 0, 2.6, 1.8, 2.4, 0.45, 0.48, 0.52);
    m.add(0, 1.8, 0, 2.4, 0.6, 2.2, 0.92, 0.95, 0.98); // Cobertura de neve
    return m.bake(renderer);
  },

  buildPineLog(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.6, 0, 3.6, 0.9, 1.2, 0.35, 0.22, 0.15); // Tronco de pinheiro caído
    m.add(0, 1.1, 0, 3.4, 0.3, 0.9, 0.92, 0.95, 0.98); // Neve sobre o tronco
    return m.bake(renderer);
  },

  buildBarrier(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.45, 0, 3.0, 0.9, 0.8, 0.85, 0.85, 0.88);
    m.add(-0.7, 0.45, 0.02, 0.7, 0.5, 0.82, 0.95, 0.4, 0.05);
    m.add(0.7, 0.45, 0.02, 0.7, 0.5, 0.82, 0.95, 0.4, 0.05);
    return m.bake(renderer);
  },

  buildWreck(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.4, 0, 1.8, 0.6, 2.8, 0.22, 0.22, 0.25);
    m.add(0.3, 0.7, -0.3, 0.9, 0.5, 1.0, 0.18, 0.18, 0.2);
    m.add(-0.4, 0.35, 0.8, 0.6, 0.4, 0.7, 0.85, 0.3, 0.05);
    return m.bake(renderer);
  },

  buildWoodenBeam(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.5, 0, 3.4, 0.8, 1.0, 0.45, 0.28, 0.18);
    m.add(-1.2, 0.8, 0, 0.4, 0.6, 0.4, 0.35, 0.2, 0.12);
    m.add(1.2, 0.8, 0, 0.4, 0.6, 0.4, 0.35, 0.2, 0.12);
    return m.bake(renderer);
  },

  buildCrate(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.8, 0, 1.6, 1.6, 1.6, 0.65, 0.45, 0.22);
    m.add(0, 0.8, 0, 1.65, 0.2, 1.65, 0.35, 0.2, 0.1);
    return m.bake(renderer);
  },

  /* ================= POWER-UPS ================= */
  buildTokenHealth(renderer) {
    const m = this.createModelDef();
    // Cruz Verde com símbolo '+' nítido e luminoso
    const green = [0.08, 0.95, 0.35];
    m.add(0, 0.7, 0, 0.35, 1.1, 0.35, green[0], green[1], green[2]);
    m.add(0, 0.7, 0, 1.1, 0.35, 0.35, green[0], green[1], green[2]);
    // Núcleo branco no centro
    m.add(0, 0.7, 0, 0.4, 0.4, 0.4, 1.0, 1.0, 1.0);
    return m.bake(renderer);
  },

  buildTokenShield(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.7, 0, 0.9, 0.9, 0.3, 0.0, 0.85, 1.0);
    m.add(0, 0.7, 0.05, 0.45, 0.45, 0.25, 1.0, 1.0, 1.0);
    return m.bake(renderer);
  },

  buildTokenRapid(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.85, 0, 0.3, 0.6, 0.3, 1.0, 0.85, 0.0);
    m.add(0.2, 0.7, 0, 0.5, 0.25, 0.3, 1.0, 0.85, 0.0);
    m.add(0, 0.45, 0, 0.3, 0.6, 0.3, 1.0, 0.85, 0.0);
    return m.bake(renderer);
  },

  buildTokenDamage(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.7, 0, 0.8, 0.8, 0.3, 1.0, 0.15, 0.25);
    m.add(0, 0.7, 0, 0.4, 0.4, 0.4, 1.0, 0.85, 0.2);
    return m.bake(renderer);
  },

  buildShieldBubble(renderer) {
    const m = this.createModelDef();
    const radius = 2.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      m.add(x, 0.6, z, 0.4, 0.4, 0.4, 0.0, 0.85, 1.0, 0.75);
      m.add(x * 0.75, 1.4, z * 0.75, 0.35, 0.35, 0.35, 0.2, 0.9, 1.0, 0.75);
    }
    return m.bake(renderer);
  }
};


/* ============================================================================
   5. SISTEMA DE ÁUDIO PROCEDURAL DE ALTA QUALIDADE (WEB AUDIO API)
   ============================================================================ */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicTimer = null;
    this.isPlayingMusic = false;

    this.volumes = {
      master: 0.8,
      music: 0.65,
      sfx: 0.85
    };
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.volumes.music, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startMusic();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.volumes.master = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setMusicVolume(val) {
    this.volumes.music = val;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(val) {
    this.volumes.sfx = val;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  /* --- Sons do Jogador (Agradáveis, Rápidos, Sem agudos irritantes) --- */

  // Metralhadora do Jogador: 8 tiros/segundo limpos, encorpados e consistentes
  playPlayerMachinegun() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.07);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Dispersora do Jogador: Tiro de espingarda triplo concentrado e potente
  playPlayerShotgun() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dur = 0.16;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.linearRampToValueAtTime(180, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.48, t);
    gain.gain.linearRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Canhão Pesado do Jogador: Grave, estrondoso, com sub-bass e impacto visceral
  playPlayerCannon() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Sub-bass concussivo
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(22, t + 0.35);

    gain.gain.setValueAtTime(0.75, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);

    // Ruído de explosão de cano
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.linearRampToValueAtTime(60, t + 0.22);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.linearRampToValueAtTime(0.001, t + 0.22);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
  }

  /* --- Sons dos Inimigos (Totalmente distintos das armas do jogador) --- */

  playEnemyMachinegun() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  playEnemyCannon() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.25);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.26);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  playEnemyShotgun() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  playHit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  playExplosion(isLarge = false) {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dur = isLarge ? 0.75 : 0.45;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isLarge ? 550 : 800, t);
    filter.frequency.linearRampToValueAtTime(50, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isLarge ? 0.75 : 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  playPowerup() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.22, st);
      gain.gain.linearRampToValueAtTime(0.001, st + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.14);
    });
  }

  playCrash() {
    if (!this.ctx) return;
    this.playHit();
    this.playExplosion(false);
  }

  playClick() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  startMusic() {
    if (this.isPlayingMusic || !this.ctx) return;
    this.isPlayingMusic = true;

    let step = 0;
    const bpm = 126;
    const stepDuration = (60 / bpm) / 4;

    const bassNotes = [
      110, 110, 110, 110, 130.81, 130.81, 146.83, 146.83,
      98, 98, 98, 98, 123.47, 123.47, 110, 110
    ];

    const nextNote = () => {
      if (!this.isPlayingMusic || !this.ctx) return;
      const t = this.ctx.currentTime;
      const currentStep = step % 16;

      // Kick no 0, 4, 8, 12
      if (currentStep % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(130, t);
        kickOsc.frequency.exponentialRampToValueAtTime(32, t + 0.08);
        kickGain.gain.setValueAtTime(0.35, t);
        kickGain.gain.linearRampToValueAtTime(0.001, t + 0.09);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.1);
      }

      // Snare no 4 e 12
      if (currentStep === 4 || currentStep === 12) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(170, t);
        snareGain.gain.setValueAtTime(0.18, t);
        snareGain.gain.linearRampToValueAtTime(0.001, t + 0.08);
        snareOsc.connect(snareGain);
        snareGain.connect(this.musicGain);
        snareOsc.start(t);
        snareOsc.stop(t + 0.09);
      }

      // Bassline sintetizado
      const freq = bassNotes[currentStep];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(freq, t);
      bassGain.gain.setValueAtTime(0.12, t);
      bassGain.gain.exponentialRampToValueAtTime(0.01, t + stepDuration * 0.85);
      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(t);
      bassOsc.stop(t + stepDuration * 0.9);

      step++;
      this.musicTimer = setTimeout(nextNote, stepDuration * 1000);
    };

    nextNote();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}


/* ============================================================================
   6. GERENCIADOR DE DETRITOS VOXEL E SISTEMA DE PARTÍCULAS
   ============================================================================ */

class DebrisParticleSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this.debrisList = [];
    this.particleList = [];
    this.weatherParticles = [];
    this.maxDebris = 500;
    this.maxParticles = 600;
  }

  // Destruição Voxel Avançada com desmembramento de rodas, carroceria e armas
  spawnVehicleDestruction(vehicleX, vehicleY, vehicleZ, boxes, impulseMultiplier = 1.0) {
    const count = Math.min(boxes.length, 60);
    for (let i = 0; i < count; i++) {
      if (this.debrisList.length >= this.maxDebris) this.debrisList.shift();
      const b = boxes[i];
      const x = vehicleX + b.cx;
      const y = Math.max(0.4, vehicleY + b.cy);
      const z = vehicleZ + b.cz;

      const angle = Math.random() * Math.PI * 2;
      const isWheel = b.type === 'wheel';
      const horizSpeed = (isWheel ? (12 + Math.random() * 18) : (6 + Math.random() * 16)) * impulseMultiplier;

      this.debrisList.push({
        x: x, y: y, z: z,
        sx: b.sx, sy: b.sy, sz: b.sz,
        vx: Math.cos(angle) * horizSpeed,
        vy: (isWheel ? 14 + Math.random() * 16 : 8 + Math.random() * 18) * impulseMultiplier,
        vz: Math.sin(angle) * horizSpeed + (Math.random() * 10 - 5),
        rotX: Math.random() * 12 - 6,
        rotY: Math.random() * 12 - 6,
        rotZ: Math.random() * 12 - 6,
        r: b.r, g: b.g, b: b.b,
        life: 3.5 + Math.random() * 1.5,
        maxLife: 5.0,
        isWheel: isWheel
      });
    }

    this.spawnExplosionPuffs(vehicleX, vehicleY + 0.8, vehicleZ, 25 * impulseMultiplier);
  }

  spawnExplosionPuffs(x, y, z, count) {
    for (let i = 0; i < count; i++) {
      if (this.particleList.length >= this.maxParticles) this.particleList.shift();
      const isFire = Math.random() > 0.35;
      const speed = 4 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      this.particleList.push({
        x: x, y: y, z: z,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.cos(phi) * speed + 5,
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        size: 0.35 + Math.random() * 0.65,
        r: isFire ? 1.0 : 0.45,
        g: isFire ? 0.3 + Math.random() * 0.5 : 0.45,
        b: isFire ? 0.05 : 0.45,
        life: 0.6 + Math.random() * 0.8,
        maxLife: 1.4
      });
    }
  }

  spawnHitSparks(x, y, z, count = 8) {
    for (let i = 0; i < count; i++) {
      if (this.particleList.length >= this.maxParticles) this.particleList.shift();
      this.particleList.push({
        x: x, y: y, z: z,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * 10 + 2,
        vz: (Math.random() - 0.5) * 14,
        size: 0.18,
        r: 1.0, g: 0.9, b: 0.2,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5
      });
    }
  }

  // Partículas Climáticas por Mapa (Neve, Pétalas Sakura)
  updateWeather(dt, playerZ, weatherType) {
    if (weatherType === 'none') {
      this.weatherParticles = [];
      return;
    }

    // Mantém ~120 partículas climáticas ao redor do jogador
    while (this.weatherParticles.length < 120) {
      const zOffset = (Math.random() - 0.2) * 180;
      this.weatherParticles.push({
        x: (Math.random() - 0.5) * 45,
        y: 4 + Math.random() * 16,
        z: playerZ + zOffset,
        vx: weatherType === 'sakura' ? (Math.random() * 4 - 1) : (Math.random() * 2 - 1),
        vy: weatherType === 'sakura' ? -(1.5 + Math.random() * 2) : -(4 + Math.random() * 4),
        vz: weatherType === 'sakura' ? (Math.random() * 2) : (Math.random() * 2 - 1),
        size: weatherType === 'sakura' ? 0.22 : 0.16,
        type: weatherType
      });
    }

    for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
      const p = this.weatherParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      if (p.y <= 0.2 || p.z < playerZ - 30 || p.z > playerZ + 200) {
        // Recicla à frente do jogador
        p.x = (Math.random() - 0.5) * 45;
        p.y = 12 + Math.random() * 8;
        p.z = playerZ + 40 + Math.random() * 140;
      }
    }
  }

  update(dt) {
    const gravity = 32.0;

    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const d = this.debrisList[i];
      d.life -= dt;
      if (d.life <= 0) {
        this.debrisList.splice(i, 1);
        continue;
      }

      d.vy -= gravity * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;

      // Colisão física com o asfalto
      if (d.y <= 0.25) {
        d.y = 0.25;
        const restitution = d.isWheel ? 0.65 : 0.35;
        d.vy = -d.vy * restitution;
        d.vx *= 0.85;
        d.vz *= 0.85;
      }
    }

    for (let i = this.particleList.length - 1; i >= 0; i--) {
      const p = this.particleList[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particleList.splice(i, 1);
        continue;
      }
      p.vy -= 8.0 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.size *= 0.985;
    }
  }

  render(renderer) {
    const verts = [];

    // Detritos Voxel
    for (const d of this.debrisList) {
      const alpha = Math.min(1.0, d.life / 0.8);
      VoxelBuilder.addBox(verts, d.x, d.y, d.z, d.sx, d.sy, d.sz, d.r, d.g, d.b, alpha);
    }

    // Partículas de Fogo / Fumaça / Faíscas
    for (const p of this.particleList) {
      const alpha = Math.min(1.0, p.life / 0.4);
      VoxelBuilder.addBox(verts, p.x, p.y, p.z, p.size, p.size, p.size, p.r, p.g, p.b, alpha);
    }

    // Partículas Climáticas
    for (const wp of this.weatherParticles) {
      if (wp.type === 'snow') {
        VoxelBuilder.addBox(verts, wp.x, wp.y, wp.z, wp.size, wp.size, wp.size, 0.95, 0.98, 1.0, 0.85);
      } else if (wp.type === 'sakura') {
        VoxelBuilder.addBox(verts, wp.x, wp.y, wp.z, wp.size * 1.5, wp.size * 0.5, wp.size, 0.98, 0.65, 0.78, 0.85);
      }
    }

    if (verts.length > 0) {
      renderer.drawDynamicBatch(new Float32Array(verts), verts.length / 10);
    }
  }
}


/* ============================================================================
   7. ESTRADA 3D INFINITA, CURVAS PROCEDURAIS E CENÁRIOS
   ============================================================================ */

class RoadManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.roadWidth = 24.0;
    this.segmentLength = 10.0;
    this.currentMapKey = 'desert';

    // Malhas do asfalto e defensas
    this.roadMesh = null;
    this.guardrailMesh = null;
    this.terrainMesh = null;

    this.rebuildMeshes();
  }

  setMap(mapKey) {
    this.currentMapKey = mapKey;
    const cfg = MAP_CONFIGS[mapKey] || MAP_CONFIGS.desert;
    this.renderer.fogColor = cfg.fogColor;
    this.renderer.ambientColor = cfg.ambientColor;
    this.renderer.sunColor = cfg.sunColor;
    this.renderer.lightDir = cfg.lightDir;
    this.rebuildMeshes();
  }

  rebuildMeshes() {
    const cfg = MAP_CONFIGS[this.currentMapKey] || MAP_CONFIGS.desert;
    const len = this.segmentLength;
    const hw = this.roadWidth / 2;

    // Asfalto e Faixas
    const rVerts = [];
    const asp = cfg.roadAsphalt;
    const shld = cfg.roadShoulder;

    // Pista principal
    VoxelBuilder.addBox(rVerts, 0, 0, len / 2, this.roadWidth, 0.2, len, asp[0], asp[1], asp[2]);
    // Acostamento
    VoxelBuilder.addBox(rVerts, -hw - 1.2, 0.05, len / 2, 2.4, 0.25, len, shld[0], shld[1], shld[2]);
    VoxelBuilder.addBox(rVerts, hw + 1.2, 0.05, len / 2, 2.4, 0.25, len, shld[0], shld[1], shld[2]);
    // Faixa central amarela
    VoxelBuilder.addBox(rVerts, 0, 0.12, len / 2, 0.4, 0.05, len * 0.65, 0.95, 0.8, 0.1);
    // Linhas brancas de faixa
    VoxelBuilder.addBox(rVerts, -hw * 0.5, 0.12, len / 2, 0.25, 0.05, len, 0.85, 0.85, 0.9);
    VoxelBuilder.addBox(rVerts, hw * 0.5, 0.12, len / 2, 0.25, 0.05, len, 0.85, 0.85, 0.9);
    this.roadMesh = this.renderer.createMesh(rVerts);

    // Defensas Laterais
    const gVerts = [];
    if (this.currentMapKey === 'japan_rural') {
      // Cerca rural de madeira / bambu tradicional
      VoxelBuilder.addBox(gVerts, 0, 0.5, len / 2, 0.2, 0.2, len, 0.45, 0.28, 0.18);
      VoxelBuilder.addBox(gVerts, 0, 0.8, len / 2, 0.2, 0.2, len, 0.45, 0.28, 0.18);
      VoxelBuilder.addBox(gVerts, 0, 0.5, len * 0.2, 0.3, 1.1, 0.3, 0.35, 0.20, 0.12);
      VoxelBuilder.addBox(gVerts, 0, 0.5, len * 0.8, 0.3, 1.1, 0.3, 0.35, 0.20, 0.12);
    } else {
      // Guardrail metálico com faixas
      VoxelBuilder.addBox(gVerts, 0, 0.6, len / 2, 0.3, 0.4, len, 0.75, 0.2, 0.25);
      VoxelBuilder.addBox(gVerts, 0, 0.3, len * 0.2, 0.35, 0.6, 0.35, 0.45, 0.48, 0.52);
      VoxelBuilder.addBox(gVerts, 0, 0.3, len * 0.8, 0.35, 0.6, 0.35, 0.45, 0.48, 0.52);
    }
    this.guardrailMesh = this.renderer.createMesh(gVerts);

    // Terreno plano contínuo nas laterais da estrada
    const tVerts = [];
    const tc = cfg.terrainColor;
    const terrainWidth = 90.0;
    VoxelBuilder.addBox(tVerts, -(hw + terrainWidth * 0.5 + 2.0), -0.05, len / 2, terrainWidth, 0.1, len, tc[0], tc[1], tc[2]);
    VoxelBuilder.addBox(tVerts, (hw + terrainWidth * 0.5 + 2.0), -0.05, len / 2, terrainWidth, 0.1, len, tc[0], tc[1], tc[2]);
    this.terrainMesh = this.renderer.createMesh(tVerts);
  }

  getCurveX(z) {
    return Math.sin(z * 0.0035) * 28.0 + Math.sin(z * 0.008) * 12.0;
  }

  getTangentAngle(z) {
    const dz = 1.0;
    const x0 = this.getCurveX(z);
    const x1 = this.getCurveX(z + dz);
    return Math.atan2(x1 - x0, dz);
  }

  getRoadPositionAtDistance(z, lateralOffset = 0) {
    const cx = this.getCurveX(z);
    return {
      x: cx + lateralOffset,
      y: 0.5,
      z: z
    };
  }

  getRoadDirectionAtDistance(z) {
    const angle = this.getTangentAngle(z);
    return {
      angle: angle,
      dirX: Math.sin(angle),
      dirZ: Math.cos(angle)
    };
  }

  // Renderização da Estrada Infinita (Muito antes, embaixo e muito depois do jogador)
  render(renderer, playerZ, models) {
    const currentSegment = Math.floor(playerZ / this.segmentLength);
    // 25 segmentos atrás (-250m) e 95 segmentos à frente (+950m) = 120 segmentos contínuos
    const backSegments = 25;
    const forwardSegments = 95;
    const hw = this.roadWidth / 2;
    const m = Math3D.createMat4();

    for (let i = -backSegments; i < forwardSegments; i++) {
      const segIndex = currentSegment + i;
      const segZ = segIndex * this.segmentLength;
      const segX = this.getCurveX(segZ);
      const angle = this.getTangentAngle(segZ);

      m.fill(0);
      m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
      Math3D.translateMat4(m, m, [segX, 0, segZ]);
      Math3D.rotateY(m, m, angle);

      // Asfalto e Terreno Lateral
      renderer.drawMesh(this.roadMesh, m);
      renderer.drawMesh(this.terrainMesh, m);

      // Defensas
      const mLeft = Math3D.createMat4();
      Math3D.translateMat4(mLeft, m, [-hw - 0.2, 0, 0]);
      renderer.drawMesh(this.guardrailMesh, mLeft);

      const mRight = Math3D.createMat4();
      Math3D.translateMat4(mRight, m, [hw + 0.2, 0, 0]);
      renderer.drawMesh(this.guardrailMesh, mRight);

      // Elementos de Cenário Distribuídos nas Margens da Estrada
      if (segIndex % 4 === 0) {
        const side = (segIndex % 8 === 0) ? 1 : -1;
        let propMesh = null;
        let propOffset = 26.0;

        if (this.currentMapKey === 'desert') {
          propMesh = (segIndex % 12 === 0) ? models.desert_mesa.mesh : models.desert_cactus.mesh;
          propOffset = (segIndex % 12 === 0) ? 36.0 : 18.0;
        } else if (this.currentMapKey === 'snow') {
          propMesh = (segIndex % 12 === 0) ? models.snow_mountain.mesh : models.snow_pine.mesh;
          propOffset = (segIndex % 12 === 0) ? 38.0 : 20.0;
        } else if (this.currentMapKey === 'japan_rural') {
          if (segIndex % 16 === 0) {
            propMesh = models.japan_torii.mesh;
            propOffset = 0; // Torii sobre a pista!
          } else if (segIndex % 8 === 0) {
            propMesh = models.japan_minka.mesh;
            propOffset = 28.0;
          } else {
            propMesh = models.japan_sakura.mesh;
            propOffset = 18.0;
          }
        }

        if (propMesh) {
          const mProp = Math3D.createMat4();
          Math3D.translateMat4(mProp, m, [side * propOffset, 0, 0]);
          renderer.drawMesh(propMesh, mProp);
        }
      }
    }
  }
}


/* ============================================================================
   8. SISTEMA DE ARMAS, PROJÉTEIS 3D E LINHA DE MIRA
   ============================================================================ */

class Projectile {
  constructor(x, y, z, speed, spreadAngle, damage, isPlayer, range, color, size = 0.35, isCannon = false, initialOffset = 0, road = null, weaponType = 'machinegun') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.speed = speed;
    this.spreadAngle = spreadAngle || 0;
    this.damage = damage;
    this.isPlayer = isPlayer;
    this.traveled = 0;
    this.range = range;
    this.color = color;
    this.size = size;
    this.isCannon = (isCannon || weaponType === 'cannon' || weaponType === 'canhao');
    this.isShotgun = (weaponType === 'shotgun' || weaponType === 'dispersora');
    this.weaponType = weaponType;
    this.active = true;
    this.hasHit = false;
    this.road = road;

    // Estado da trajetória relativa à estrada
    this.roadZ = z;
    this.lateralOffset = initialOffset;
    this.lateralDriftSpeed = Math.sin(this.spreadAngle) * Math.abs(this.speed);
    this.forwardSpeed = Math.cos(this.spreadAngle) * this.speed;

    // Histórico de posição para detecção contínua de colisão (CCD anti-tunneling)
    this.prevX = x;
    this.prevY = y;
    this.prevZ = z;
    this.prevRoadZ = z;
    this.prevLateralOffset = initialOffset;
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.prevZ = this.z;
    this.prevRoadZ = this.roadZ;
    this.prevLateralOffset = this.lateralOffset;

    if (this.road) {
      this.roadZ += this.forwardSpeed * dt;
      this.lateralOffset += this.lateralDriftSpeed * dt;
      this.traveled += Math.abs(this.speed) * dt;

      // Posição 3D física real e contínua acompanhando as curvas da estrada
      const curveCenter = this.road.getCurveX(this.roadZ);
      this.x = curveCenter + this.lateralOffset;
      this.z = this.roadZ;

      if (this.traveled >= this.range) {
        this.active = false;
      }
    } else {
      const dz = this.speed * dt;
      this.z += dz;
      this.traveled += Math.abs(dz);
      if (this.traveled >= this.range) {
        this.active = false;
      }
    }
  }
}

class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.projectiles = [];
    this.cooldown = 0;
    this.mgSideAlternator = false; // Alternador determinístico (sem random) para Metralhadora
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (!p.active) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // Obtenção unificada das trajetórias reais de disparo (compartilhado entre projéteis e linhas de mira)
  getTrajectories(weaponKey, playerX, playerY, playerZ, roadAngle, options = {}) {
    const cfg = PLAYER_WEAPONS[weaponKey] || PLAYER_WEAPONS.machinegun;
    const trajectories = [];
    const road = this.game.road;

    const vType = (this.game.player ? this.game.player.type : 'interceptor');

    if (weaponKey === 'shotgun') {
      // Dispersora: EXATAMENTE 3 projéteis com spread concentrado saindo do canhão frontal
      const spreadAngles = cfg.spreadAngles || [-0.045, 0.0, 0.045];
      const originX = playerX;
      const originY = playerY + (vType === 'titan' ? 0.74 : (vType === 'raptor' ? 0.36 : 0.44));
      const originZ = playerZ + (vType === 'titan' ? 2.65 : 2.35);
      const curveCenter = road ? road.getCurveX(originZ) : 0;
      const baseOffset = originX - curveCenter;

      for (const sp of spreadAngles) {
        trajectories.push({
          originX: originX,
          originY: originY,
          originZ: originZ,
          initialOffset: baseOffset,
          spreadAngle: sp,
          speed: cfg.speed,
          range: cfg.range,
          color: cfg.color,
          size: cfg.size,
          isCannon: false
        });
      }

    } else if (weaponKey === 'cannon') {
      // Canhão Pesado: 1 projétil central de alto calibre saindo da torreta do teto
      const originX = playerX;
      const originY = playerY + (vType === 'titan' ? 1.74 : (vType === 'raptor' ? 0.95 : 1.08));
      const originZ = playerZ + (vType === 'titan' ? 2.25 : 1.85);
      const curveCenter = road ? road.getCurveX(originZ) : 0;
      const baseOffset = originX - curveCenter;

      trajectories.push({
        originX: originX,
        originY: originY,
        originZ: originZ,
        initialOffset: baseOffset,
        spreadAngle: 0,
        speed: cfg.speed,
        range: cfg.range,
        color: cfg.color,
        size: cfg.size,
        isCannon: true
      });

    } else {
      // Metralhadora: canos esquerdo e direito nos paralamas dianteiros
      const { keyQ = false, keyE = false, forAim = false, sideAlternator = false } = options;

      let fenderOffset = 0.74;
      let fenderHeight = 0.58;
      let fenderZ = 1.85;
      if (vType === 'raptor') {
        fenderOffset = 0.82;
        fenderHeight = 0.48;
        fenderZ = 1.90;
      } else if (vType === 'titan') {
        fenderOffset = 0.98;
        fenderHeight = 0.96;
        fenderZ = 2.05;
      }

      let includeLeft = false;
      let includeRight = false;

      if (forAim) {
        if (keyQ && !keyE) {
          includeLeft = true;
        } else if (keyE && !keyQ) {
          includeRight = true;
        } else {
          includeLeft = true;
          includeRight = true;
        }
      } else {
        if (keyQ && keyE) {
          includeLeft = true;
          includeRight = true;
        } else if (keyQ) {
          includeLeft = true;
        } else if (keyE) {
          includeRight = true;
        } else {
          if (sideAlternator) includeLeft = true;
          else includeRight = true;
        }
      }

      if (includeLeft) {
        const leftOffset = fenderOffset;
        const lx = playerX + Math.cos(roadAngle) * leftOffset;
        const ly = playerY + fenderHeight;
        const lz = playerZ - Math.sin(roadAngle) * leftOffset + fenderZ;
        const curveCenter = road ? road.getCurveX(lz) : 0;
        const baseOffset = lx - curveCenter;

        trajectories.push({
          originX: lx,
          originY: ly,
          originZ: lz,
          initialOffset: baseOffset,
          spreadAngle: 0,
          speed: cfg.speed,
          range: cfg.range,
          color: cfg.color,
          size: cfg.size,
          isCannon: false,
          isLeft: true,
          isRight: false
        });
      }

      if (includeRight) {
        const rightOffset = -fenderOffset;
        const rx = playerX + Math.cos(roadAngle) * rightOffset;
        const ry = playerY + fenderHeight;
        const rz = playerZ - Math.sin(roadAngle) * rightOffset + fenderZ;
        const curveCenter = road ? road.getCurveX(rz) : 0;
        const baseOffset = rx - curveCenter;

        trajectories.push({
          originX: rx,
          originY: ry,
          originZ: rz,
          initialOffset: baseOffset,
          spreadAngle: 0,
          speed: cfg.speed,
          range: cfg.range,
          color: cfg.color,
          size: cfg.size,
          isCannon: false,
          isLeft: false,
          isRight: true
        });
      }
    }
    return trajectories;
  }

  // Disparo do jogador respeitando Segurar ESPAÇO, Cadência, Q/E e Danos
  firePlayer(weaponKey, playerX, playerY, playerZ, roadAngle, hasDoubleDamage, hasRapidFire, keyQ, keyE) {
    const cfg = PLAYER_WEAPONS[weaponKey] || PLAYER_WEAPONS.machinegun;
    const fireInterval = 1.0 / (cfg.fireRate * (hasRapidFire ? 1.75 : 1.0));
    if (this.cooldown > 0) return false;

    this.cooldown = fireInterval;
    const dmg = cfg.damage * (hasDoubleDamage ? 2.0 : 1.0);

    if (weaponKey === 'shotgun') {
      // Dispersora: EXATAMENTE 3 balas por disparo em leque concentrado
      this.game.sound.playPlayerShotgun();
      const trajs = this.getTrajectories(weaponKey, playerX, playerY, playerZ, roadAngle);
      for (const t of trajs) {
        this.projectiles.push(new Projectile(
          t.originX, t.originY, t.originZ,
          t.speed, t.spreadAngle,
          dmg, true, t.range, t.color, t.size, false,
          t.initialOffset, this.game.road, 'shotgun'
        ));
      }
      this.game.debris.spawnHitSparks(playerX, playerY + 0.6, playerZ + 2.0, 10);

    } else if (weaponKey === 'cannon') {
      // Canhão Pesado: 150 dano, alto impacto, concussão visual e sonora
      this.game.sound.playPlayerCannon();
      this.game.camera.addShake(0.4);
      this.game.player.recoilZ = -0.65;
      this.game.debris.spawnHitSparks(playerX, playerY + 0.8, playerZ + 2.2, 14);

      const trajs = this.getTrajectories(weaponKey, playerX, playerY, playerZ, roadAngle);
      for (const t of trajs) {
        this.projectiles.push(new Projectile(
          t.originX, t.originY, t.originZ,
          t.speed, t.spreadAngle,
          dmg, true, t.range, t.color, t.size, true,
          t.initialOffset, this.game.road, 'cannon'
        ));
      }

    } else {
      // Metralhadora: 8 tiros/s, 20 dano
      // Controle de canos: Q = exclusivo esquerdo, E = exclusivo direito, Q+E = simultâneo
      this.game.sound.playPlayerMachinegun();

      if (!keyQ && !keyE) {
        this.mgSideAlternator = !this.mgSideAlternator;
      }

      const trajs = this.getTrajectories(weaponKey, playerX, playerY, playerZ, roadAngle, {
        keyQ,
        keyE,
        forAim: false,
        sideAlternator: this.mgSideAlternator
      });

      for (const t of trajs) {
        this.projectiles.push(new Projectile(
          t.originX, t.originY, t.originZ,
          t.speed, t.spreadAngle,
          dmg, true, t.range, t.color, t.size, false,
          t.initialOffset, this.game.road, 'machinegun'
        ));
        this.game.debris.spawnHitSparks(t.originX, t.originY, t.originZ + 0.5, 3);
      }
    }

    return true;
  }

  // Disparo dos Inimigos com armamento específico e som próprio
  fireEnemy(enemyX, enemyY, enemyZ, targetX, targetZ, weaponType = 'machinegun') {
    const curveCenter = this.game.road ? this.game.road.getCurveX(enemyZ) : 0;
    const initialOffset = enemyX - curveCenter;

    if (weaponType === 'cannon') {
      this.game.sound.playEnemyCannon();
      this.projectiles.push(new Projectile(
        enemyX, enemyY + 1.0, enemyZ - 1.5,
        -75.0, 0,
        50, false, 160.0, [1.0, 0.4, 0.1], 0.6, true,
        initialOffset, this.game.road, 'cannon'
      ));
    } else if (weaponType === 'shotgun') {
      this.game.sound.playEnemyShotgun();
      for (const sp of [-0.06, 0.0, 0.06]) {
        this.projectiles.push(new Projectile(
          enemyX, enemyY + 0.8, enemyZ - 1.5,
          -80.0, sp,
          25, false, 110.0, [1.0, 0.6, 0.1], 0.32, false,
          initialOffset, this.game.road, 'shotgun'
        ));
      }
    } else {
      // Metralhadora Inimiga
      this.game.sound.playEnemyMachinegun();
      this.projectiles.push(new Projectile(
        enemyX, enemyY + 0.6, enemyZ - 1.2,
        -85.0, 0,
        20, false, 150.0, [1.0, 0.2, 0.2], 0.35, false,
        initialOffset, this.game.road, 'machinegun'
      ));
    }
  }

  // Renderização 3D dos Projéteis e da Linha de Mira WebGL
  render(renderer, player, road) {
    const verts = [];

    // 1. Renderização 3D dos Projéteis por Tipo de Arma
    for (const p of this.projectiles) {
      let baseAngle = road ? road.getTangentAngle(p.roadZ || p.z) : 0;
      let projAngle = baseAngle + (p.spreadAngle || 0);
      if (p.speed < 0) {
        projAngle += Math.PI;
      }

      if (p.isCannon || p.weaponType === 'cannon' || p.weaponType === 'canhao') {
        // Canhão Pesado: Cubo / Bloco Voxel 3D Sólido
        const cubeSize = Math.max(0.95, p.size * 1.35);
        VoxelBuilder.addOrientedBox(
          verts,
          p.x, p.y, p.z,
          cubeSize, cubeSize, cubeSize,
          projAngle,
          p.color[0], p.color[1], p.color[2], 1.0
        );
      } else if (p.isShotgun || p.weaponType === 'shotgun' || p.weaponType === 'dispersora') {
        // Dispersora: Barra / Prisma Retangular 3D Alongado (Geometria 3D de bloco retilíneo)
        const barWidth = 0.35;
        const barHeight = 0.35;
        const barLength = 3.6;
        // Barra retangular principal
        VoxelBuilder.addOrientedBox(
          verts,
          p.x, p.y, p.z,
          barWidth, barHeight, barLength,
          projAngle,
          p.color[0], p.color[1], p.color[2], 1.0
        );
        // Núcleo energético interno em barra retangular brilhante
        VoxelBuilder.addOrientedBox(
          verts,
          p.x, p.y, p.z,
          barWidth * 0.45, barHeight * 0.45, barLength + 0.3,
          projAngle,
          0.85, 0.98, 1.0, 1.0
        );
      } else {
        // Metralhadora / Padrão: Projétil esférico / cápsula facetada 3D
        VoxelBuilder.addFacetedSphere(
          verts,
          p.x, p.y, p.z,
          p.size, p.size * 2.2,
          p.color[0], p.color[1], p.color[2]
        );
      }
    }

    // 2. Linhas de Mira 3D Contínuas Acompanhando as Curvas da Estrada em Tempo Real
    if (player && !player.destroyed && this.game.state === 'PLAYING') {
      const roadAngle = road.getTangentAngle(player.worldZ);
      const activeWeapon = this.game.selectedWeapon || 'machinegun';
      const inputs = this.game.inputs || {};

      // Obtém as trajetórias reais correspondentes à arma equipada e controles ativos
      const aimTrajectories = this.getTrajectories(
        activeWeapon,
        player.worldX,
        player.worldY,
        player.worldZ,
        roadAngle,
        {
          keyQ: !!inputs.keyQ,
          keyE: !!inputs.keyE,
          forAim: true
        }
      );

      const cfg = PLAYER_WEAPONS[activeWeapon] || PLAYER_WEAPONS.machinegun;
      const aimLen = Math.min(cfg.range || 70.0, 70.0);
      const thickness = 0.055;
      const alpha = 0.50; // 50% de transparência: visível, discreto e translúcido
      const steps = 14;   // Segmentos conectados suavemente ao longo da curva real da pista

      // Desenha cada trajetória como uma linha contínua que acompanha perfeitamente a curva da pista
      for (const traj of aimTrajectories) {
        for (let i = 0; i < steps; i++) {
          const s0 = (i / steps) * aimLen;
          const s1 = ((i + 1) / steps) * aimLen;

          const z0 = traj.originZ + s0 * Math.cos(traj.spreadAngle);
          const z1 = traj.originZ + s1 * Math.cos(traj.spreadAngle);

          const off0 = traj.initialOffset + s0 * Math.sin(traj.spreadAngle);
          const off1 = traj.initialOffset + s1 * Math.sin(traj.spreadAngle);

          const x0 = road.getCurveX(z0) + off0;
          const x1 = road.getCurveX(z1) + off1;

          const y0 = traj.originY;
          const y1 = traj.originY;

          VoxelBuilder.addContinuousBeam(
            verts,
            x0, y0, z0,
            x1, y1, z1,
            thickness,
            1.0, 0.05, 0.05, alpha
          );
        }
      }
    }

    if (verts.length > 0) {
      renderer.drawDynamicBatch(new Float32Array(verts), verts.length / 10);
    }
  }
}


/* ============================================================================
   9. VEÍCULO DO JOGADOR
   ============================================================================ */

class PlayerVehicle {
  constructor(game, vehicleType = 'interceptor') {
    this.game = game;
    this.type = vehicleType;

    this.laneX = 0; // Posição lateral relativa ao centro da pista (-10.0 a +10.0)
    this.worldX = 0;
    this.worldY = 0.5;
    this.worldZ = 0;

    // Sistema de Velocidade Obrigatório (W/S): sempre positivo, nunca parado, nunca ré
    this.forwardSpeed = 55.0;
    this.minSpeed = 32.0; // Velocidade mínima positiva
    this.maxSpeed = 88.0; // Velocidade máxima
    this.accelRate = 35.0;
    this.decelRate = 42.0;

    this.maxHp = 1000;
    this.hp = 1000;

    this.stats = {
      interceptor: {
        lateralSpeed: 28.0,
        collisionFactor: 1.0,
        width: 2.2, height: 1.2, depth: 3.6
      },
      raptor: {
        lateralSpeed: 38.0,
        collisionFactor: 1.2,
        width: 1.8, height: 1.0, depth: 3.4
      },
      titan: {
        lateralSpeed: 22.0,
        collisionFactor: 0.6,
        width: 3.0, height: 1.6, depth: 4.0
      }
    }[vehicleType] || { lateralSpeed: 28.0, collisionFactor: 1.0, width: 2.2, height: 1.2, depth: 3.6 };

    this.hitFlash = 0;
    this.shieldTimer = 0; // Duração de ~3s com invulnerabilidade total
    this.rapidFireTimer = 0;
    this.doubleDamageTimer = 0;

    this.tiltRoll = 0;
    this.recoilZ = 0;
    this.destroyed = false;
  }

  takeDamage(amount, isCollision = false) {
    if (this.destroyed) return;

    // Escudo: Invulnerabilidade Total (Dano recebido = 0)
    if (this.shieldTimer > 0) {
      this.game.sound.playHit();
      this.game.debris.spawnHitSparks(this.worldX, this.worldY + 0.5, this.worldZ, 12);
      return;
    }

    if (isCollision) {
      amount *= this.stats.collisionFactor;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.15;
    this.game.camera.addShake(isCollision ? 0.45 : 0.2);

    if (amount >= 50) {
      const modelObj = this.game.models[this.type];
      if (modelObj && modelObj.boxes.length > 0) {
        const randomBox = modelObj.boxes[Math.floor(Math.random() * modelObj.boxes.length)];
        this.game.debris.debrisList.push({
          x: this.worldX + randomBox.cx,
          y: this.worldY + randomBox.cy,
          z: this.worldZ + randomBox.cz,
          sx: randomBox.sx, sy: randomBox.sy, sz: randomBox.sz,
          vx: (Math.random() - 0.5) * 12,
          vy: 8 + Math.random() * 8,
          vz: (Math.random() - 0.5) * 12,
          rotX: Math.random() * 8, rotY: Math.random() * 8, rotZ: Math.random() * 8,
          r: randomBox.r, g: randomBox.g, b: randomBox.b,
          life: 3.0, maxLife: 3.0, isWheel: false
        });
      }
    }

    const flashEl = document.getElementById('damage-flash');
    if (flashEl) {
      flashEl.classList.add('active');
      setTimeout(() => flashEl.classList.remove('active'), 120);
    }

    if (this.hp <= 0 && !this.destroyed) {
      this.destroyed = true;
      this.game.onPlayerDied();
    }
  }

  update(dt, input) {
    if (this.destroyed) return;

    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer < 0) this.shieldTimer = 0;
    }
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt;
    if (this.doubleDamageTimer > 0) this.doubleDamageTimer -= dt;
    if (this.recoilZ < 0) this.recoilZ = Math.min(0, this.recoilZ + dt * 4.0);

    // 1. Controle de Aceleração e Desaceleração (W/S ou Setas Cima/Baixo)
    if (input.up) {
      this.forwardSpeed = Math.min(this.maxSpeed, this.forwardSpeed + this.accelRate * dt);
    } else if (input.down) {
      this.forwardSpeed = Math.max(this.minSpeed, this.forwardSpeed - this.decelRate * dt);
    } else {
      // Retorno suave à velocidade de cruzeiro
      const cruiseSpeed = 55.0;
      if (this.forwardSpeed > cruiseSpeed) {
        this.forwardSpeed = Math.max(cruiseSpeed, this.forwardSpeed - dt * 10.0);
      } else if (this.forwardSpeed < cruiseSpeed) {
        this.forwardSpeed = Math.min(cruiseSpeed, this.forwardSpeed + dt * 10.0);
      }
    }

    // 2. CORREÇÃO DEFINITIVA DOS CONTROLES DE DIREÇÃO:
    // Na nossa câmera, o lado esquerdo visual corresponde ao +X no mundo,
    // e o lado direito visual corresponde ao -X no mundo.
    let moveDir = 0;
    if (input.left) moveDir += 1;  // A / ← move para a Esquerda da tela (+X no mundo)
    if (input.right) moveDir -= 1; // D / → move para a Direita da tela (-X no mundo)

    const sens = this.game.settings.sensitivity / 100.0;
    this.laneX += moveDir * this.stats.lateralSpeed * sens * dt;

    const maxBound = (this.game.road.roadWidth / 2) - 1.5;
    this.laneX = Math.max(-maxBound, Math.min(maxBound, this.laneX));

    // Inclinação visual (Roll/Banking): virar para a esquerda inclina à esquerda, virar à direita inclina à direita
    const targetRoll = moveDir * 0.22;
    this.tiltRoll += (targetRoll - this.tiltRoll) * 12.0 * dt;

    // Avanço contínuo em Z
    this.worldZ += this.forwardSpeed * dt;

    // Acompanha curvas da estrada
    const curveCenter = this.game.road.getCurveX(this.worldZ);
    this.worldX = curveCenter + this.laneX;
    this.worldY = 0.5 + Math.sin(this.worldZ * 0.08) * 0.08;
  }

  render(renderer) {
    if (this.destroyed) return;

    const angle = this.game.road.getTangentAngle(this.worldZ);
    const m = Math3D.createMat4();
    Math3D.translateMat4(m, m, [this.worldX, this.worldY, this.worldZ + this.recoilZ]);
    Math3D.rotateY(m, m, angle);
    Math3D.rotateZ(m, m, this.tiltRoll);

    const modelObj = this.game.getPlayerModel(this.type, this.game.selectedWeapon);
    const tint = (this.hitFlash > 0) ? [1.0, 0.2, 0.2, 0.6] :
                 (this.shieldTimer > 0) ? [0.2, 0.85, 1.0, 0.4] : null;

    renderer.drawMesh(modelObj.mesh, m, tint);

    // Redoma de escudo protetor ativa
    if (this.shieldTimer > 0 && this.game.models.shield_bubble) {
      const shieldMat = Math3D.createMat4();
      Math3D.translateMat4(shieldMat, shieldMat, [this.worldX, this.worldY + 0.2, this.worldZ]);
      Math3D.rotateY(shieldMat, shieldMat, performance.now() * 0.003);
      renderer.drawMesh(this.game.models.shield_bubble.mesh, shieldMat);
    }
  }
}


/* ============================================================================
   10. GERENCIADOR DE INIMIGOS, INTELIGÊNCIA ARTIFICIAL E ZONA DE COMBATE
   ============================================================================ */

class EnemyVehicle {
  constructor(game, type, z, targetLaneX) {
    this.game = game;
    this.type = type;
    this.config = ENEMY_TYPES[type] || ENEMY_TYPES.raptor;

    this.worldZ = z;
    this.laneX = targetLaneX;
    this.targetLaneX = targetLaneX;
    this.worldX = 0;
    this.worldY = 0.5;

    // Vida exata e escala suave por onda
    const waveMult = 1.0 + (game.wave - 1) * 0.08;
    this.maxHp = Math.round(this.config.baseHp * waveMult);
    this.hp = this.maxHp;
    this.score = Math.round(this.config.score * (1 + (game.wave - 1) * 0.1));

    // Velocidade longitudinal e aceleração próprias e independentes
    this.forwardSpeed = this.config.cruiseSpeed || 48.0;
    this.targetSpeed = this.forwardSpeed;
    this.accel = this.config.accel || 12.0;
    this.lateralSpeed = this.config.lateralSpeed || 5.0;

    this.fireTimer = Math.random() * 1.5;
    this.laneChangeTimer = 2.5 + Math.random() * 3.5;
    this.hitTimer = 0;
    this.destroyed = false;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitTimer = 0.12;
    this.game.sound.playHit();

    // Floating Damage Number (-20, -50, -150)
    this.game.floatingTexts.spawn(
      this.worldX, this.worldY + this.config.height + 0.5, this.worldZ,
      `-${Math.round(amount)}`, 'damage'
    );

    if (this.hp <= 0 && !this.destroyed) {
      this.destroyed = true;
      this.onKilled();
    }
  }

  onKilled() {
    this.game.addKill(this.score, this.worldX, this.worldY, this.worldZ);

    const modelObj = this.game.models[this.config.modelKey] || this.game.models[this.type];
    const impulse = this.config.isTruck ? 1.4 : 1.0;
    if (modelObj) {
      this.game.debris.spawnVehicleDestruction(this.worldX, this.worldY, this.worldZ, modelObj.boxes, impulse);
    }
    this.game.sound.playExplosion(this.config.isTruck);
    this.game.camera.addShake(this.config.isTruck ? 0.5 : 0.25);

    // Chance de soltar Power-Up (32% de chance)
    if (Math.random() < 0.32) {
      this.game.powerups.spawn(this.worldX, this.worldZ);
    }
  }

  update(dt, player) {
    if (this.destroyed) return;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    const distZ = this.worldZ - player.worldZ;
    const distLane = Math.abs(this.laneX - player.laneX);

    // 1. Definição da velocidade alvo independente
    if (distZ < -25.0) {
      // Ficou para trás: tenta acelerar suavemente até seu teto de velocidade
      this.targetSpeed = this.config.maxSpeed || 65.0;
    } else if (distZ > 100.0) {
      // Muito à frente: reduz gradualmente para velocidade de cruzeiro
      this.targetSpeed = this.config.cruiseSpeed * 0.85;
    } else if (Math.abs(distZ) < 7.0 && distLane < 3.2) {
      // Lado a lado com o jogador em risco de atrito lateral: ajusta velocidade para permitir ultrapassagem limpa
      if (this.forwardSpeed >= player.forwardSpeed) {
        this.targetSpeed = this.config.maxSpeed; // Acelera para completar ultrapassagem à frente
      } else {
        this.targetSpeed = this.config.cruiseSpeed * 0.8; // Desacelera suavemente para deixar o jogador passar
      }
    } else {
      // Ritmo de cruzeiro normal independente
      this.targetSpeed = this.config.cruiseSpeed;
    }

    // Aceleração/desaceleração contínua e suave (sem saltos de velocidade)
    const speedDiff = this.targetSpeed - this.forwardSpeed;
    if (Math.abs(speedDiff) > 0.05) {
      this.forwardSpeed += Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), this.accel * dt);
    }

    // Avanço longitudinal autônomo no eixo Z
    this.worldZ += this.forwardSpeed * dt;
    const curveCenter = this.game.road.getCurveX(this.worldZ);

    // 2. Inteligência de Faixas e Evitamento Lateral
    this.laneChangeTimer -= dt;
    const availableLanes = [-7.0, -2.5, 2.5, 7.0];

    // Desvio de emergência se estiver colando lateralmente no jogador
    if (Math.abs(distZ) < 8.0 && distLane < 3.5) {
      if (this.laneX >= player.laneX) {
        // Jogador está à esquerda -> inimigo desvia para a direita
        this.targetLaneX = Math.min(7.5, this.laneX + 3.5);
      } else {
        // Jogador está à direita -> inimigo desvia para a esquerda
        this.targetLaneX = Math.max(-7.5, this.laneX - 3.5);
      }
    } else if (this.laneChangeTimer <= 0) {
      this.laneChangeTimer = 3.0 + Math.random() * 4.0;
      // Escolhe uma faixa independente sem copiar ou colar na faixa do jogador
      this.targetLaneX = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    }

    // Transição lateral suave com velocidade lateral própria do veículo
    const laneDiff = this.targetLaneX - this.laneX;
    if (Math.abs(laneDiff) > 0.05) {
      const step = Math.sign(laneDiff) * Math.min(Math.abs(laneDiff), this.lateralSpeed * dt);
      this.laneX += step;
    }

    // Garante limites da pista
    const maxBound = (this.game.road.roadWidth / 2) - 1.5;
    this.laneX = Math.max(-maxBound, Math.min(maxBound, this.laneX));
    this.worldX = curveCenter + this.laneX;

    // 3. Sistema de Tiro
    if (distZ > 6.0 && distZ < 85.0) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.config.fireInterval + Math.random() * 0.4;
        this.game.weapons.fireEnemy(
          this.worldX, this.worldY, this.worldZ,
          player.worldX, player.worldZ,
          this.config.weapon
        );
      }
    }
  }

  render(renderer) {
    if (this.destroyed) return;
    const angle = this.game.road.getTangentAngle(this.worldZ);
    const m = Math3D.createMat4();
    Math3D.translateMat4(m, m, [this.worldX, this.worldY, this.worldZ]);
    Math3D.rotateY(m, m, angle);

    const modelObj = this.game.models[this.config.modelKey] || this.game.models[this.type];
    const tint = (this.hitTimer > 0) ? [1.0, 1.0, 1.0, 0.7] : null;
    if (modelObj) {
      renderer.drawMesh(modelObj.mesh, m, tint);
    }
  }
}

// Limites Centrais de Inimigos Ativos Simultâneos
const ABSOLUTE_MAX_ACTIVE_ENEMIES = 7;
const INITIAL_MAX_ACTIVE_ENEMIES = 3;

class EnemyManager {
  constructor(game) {
    this.game = game;
    this.enemies = [];
    this.spawnTimer = 2.0;
  }

  // Limite máximo de inimigos permitidos para a onda atual
  getMaxActiveEnemies() {
    const wave = (this.game && this.game.wave) ? this.game.wave : 1;
    // Wave 1 → 3, Wave 2 → 4, Wave 3 → 5, Wave 4 → 6, Wave 5+ → 7 (Teto Absoluto: 7)
    return Math.min(ABSOLUTE_MAX_ACTIVE_ENEMIES, INITIAL_MAX_ACTIVE_ENEMIES + (wave - 1));
  }

  // Contagem estrita de inimigos verdadeiramente ativos (vivos e na partida)
  getActiveEnemyCount() {
    let count = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].destroyed) {
        count++;
      }
    }
    return count;
  }

  // Consulta centralizada do limite: nenhuma criação pode ocorrer se o limite for atingido
  canSpawnEnemy() {
    return this.getActiveEnemyCount() < this.getMaxActiveEnemies();
  }

  update(dt, player) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (this.canSpawnEnemy()) {
        // Distribui o spawn gradualmente ao longo do tempo (sem spawnar em bloco)
        this.spawnTimer = Math.max(1.8, 3.8 - (this.game.wave * 0.2));
        this.spawnNextWaveEnemy(player.worldZ);
      } else {
        // Limite atingido: aguarda breve intervalo sem instanciar veículos extras
        this.spawnTimer = 0.8;
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player);

      // Remove apenas se destruído ou se ultrapassou o limite muito além à frente
      if (e.destroyed || (e.worldZ - player.worldZ > 320.0)) {
        this.enemies.splice(i, 1);
      }
    }
  }

  spawnNextWaveEnemy(playerZ) {
    // Verificação estrita antes de instanciar
    if (!this.canSpawnEnemy()) return null;

    const truckChance = Math.min(0.55, 0.15 + (this.game.wave - 1) * 0.08);
    let type = 'scout';

    if (this.game.wave >= 3 && Math.random() < truckChance) {
      type = (Math.random() > 0.4) ? 'titan' : 'hauler';
    } else {
      const roll = Math.random();
      if (roll < 0.5) type = 'raptor';
      else if (roll < 0.8) type = 'scout';
      else type = 'titan';
    }

    // Distância mínima e espaçamento entre veículos para evitar carros colados
    const lanes = [-7.0, -2.5, 2.5, 7.0];
    let chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
    let spawnZ = playerZ + 115.0 + Math.random() * 45.0;

    // Garante espaço longitudinal seguro de pelo menos 20m em relação a outros carros
    for (const e of this.enemies) {
      if (!e.destroyed && Math.abs(e.worldZ - spawnZ) < 20.0) {
        spawnZ = e.worldZ + 25.0 + Math.random() * 12.0;
      }
    }

    const enemy = new EnemyVehicle(this.game, type, spawnZ, chosenLane);
    this.enemies.push(enemy);
    return enemy;
  }

  render(renderer) {
    for (const e of this.enemies) {
      e.render(renderer);
    }
  }
}


/* ============================================================================
   11. GERENCIADOR DE OBSTÁCULOS E POWER-UPS
   ============================================================================ */

class ObstacleManager {
  constructor(game) {
    this.game = game;
    this.obstacles = [];
    this.spawnTimer = 2.0;
  }

  update(dt, playerZ) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 3.2 + Math.random() * 2.8;
      this.spawnObstacle(playerZ);
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      if (playerZ - o.worldZ > 35.0 || o.destroyed) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  spawnObstacle(playerZ) {
    const mapCfg = MAP_CONFIGS[this.game.selectedMap] || MAP_CONFIGS.desert;
    const obsList = mapCfg.obstacles;
    const type = obsList[Math.floor(Math.random() * obsList.length)];
    const spawnZ = playerZ + 140.0 + Math.random() * 30.0;
    const laneX = [-6.5, -2.0, 2.0, 6.5][Math.floor(Math.random() * 4)];

    this.obstacles.push({
      type: type,
      worldZ: spawnZ,
      laneX: laneX,
      width: 2.2, height: 1.0, depth: 1.2,
      destroyed: false
    });
  }

  render(renderer) {
    for (const o of this.obstacles) {
      if (o.destroyed) continue;
      const curveCenter = this.game.road.getCurveX(o.worldZ);
      const angle = this.game.road.getTangentAngle(o.worldZ);
      const m = Math3D.createMat4();
      Math3D.translateMat4(m, m, [curveCenter + o.laneX, 0, o.worldZ]);
      Math3D.rotateY(m, m, angle);

      const model = this.game.models[o.type];
      if (model) {
        renderer.drawMesh(model.mesh, m);
      }
    }
  }
}

class PowerUpManager {
  constructor(game) {
    this.game = game;
    this.items = [];
  }

  spawn(x, z) {
    // Alta probabilidade de soltar cura de vida (+200 HP)
    const types = ['health', 'health', 'shield', 'rapid', 'damage'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.items.push({
      type: type,
      x: x, y: 0.8, z: z,
      rot: 0,
      active: true
    });
  }

  update(dt, player) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.rot += dt * 3.5;
      item.y = 0.8 + Math.sin(item.rot * 2) * 0.2;

      // Coleta por colisão com o veículo do jogador
      const dist = Math.hypot(item.x - player.worldX, item.z - player.worldZ);
      if (dist < 2.8 && Math.abs(item.y - player.worldY) < 2.0) {
        this.applyPowerUp(item.type, player);
        this.game.sound.playPowerup();
        this.game.debris.spawnHitSparks(item.x, item.y, item.z, 20);
        this.items.splice(i, 1);
        continue;
      }

      if (player.worldZ - item.z > 30.0) {
        this.items.splice(i, 1);
      }
    }
  }

  applyPowerUp(type, player) {
    if (type === 'health') {
      // Cura +200 HP sem nunca ultrapassar 1000 HP
      player.hp = Math.min(1000, player.hp + 200);
      this.game.floatingTexts.spawn(player.worldX, player.worldY + 1.6, player.worldZ, '+200 HP', 'score');
    } else if (type === 'shield') {
      player.shieldTimer = 3.0; // Duração exata de ~3 segundos
      this.game.floatingTexts.spawn(player.worldX, player.worldY + 1.6, player.worldZ, 'ESCUDO ATIVO!', 'score');
    } else if (type === 'rapid') {
      player.rapidFireTimer = 8.0;
    } else if (type === 'damage') {
      player.doubleDamageTimer = 8.0;
    }
  }

  render(renderer) {
    for (const item of this.items) {
      const m = Math3D.createMat4();
      Math3D.translateMat4(m, m, [item.x, item.y, item.z]);
      Math3D.rotateY(m, m, item.rot);
      const modelKey = 'token_' + item.type;
      if (this.game.models[modelKey]) {
        renderer.drawMesh(this.game.models[modelKey].mesh, m);
      }
    }
  }
}


/* ============================================================================
   12. GERENCIADOR DE NÚMEROS FLUTUANTES (DANO E PONTUAÇÃO)
   ============================================================================ */

class FloatingTextManager {
  constructor(game) {
    this.game = game;
    this.items = [];
    this.container = document.getElementById('floating-texts-container');
  }

  spawn(worldX, worldY, worldZ, text, styleClass = 'damage') {
    this.items.push({
      x: worldX,
      y: worldY,
      z: worldZ,
      text: text,
      className: styleClass,
      life: 1.1,
      maxLife: 1.1,
      vy: 2.2
    });
  }

  clear() {
    this.items = [];
    if (this.container) this.container.innerHTML = '';
  }

  update(dt) {
    if (!this.container) return;
    this.container.innerHTML = '';

    const width = this.game.canvas.width;
    const height = this.game.canvas.height;
    const vp = this.game.renderer.matViewProj;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.life -= dt;
      if (item.life <= 0) {
        this.items.splice(i, 1);
        continue;
      }

      item.y += item.vy * dt;

      const screenPos = Math3D.projectToScreen([item.x, item.y, item.z], vp, width, height);
      if (screenPos && screenPos.depth < 140.0) {
        const el = document.createElement('div');
        el.className = `floating-text ${item.className}`;
        el.textContent = item.text;
        el.style.left = `${screenPos.x}px`;
        el.style.top = `${screenPos.y}px`;
        el.style.opacity = `${Math.min(1.0, item.life / 0.35)}`;
        this.container.appendChild(el);
      }
    }
  }
}


/* ============================================================================
   13. TABELA DE MELHORES PONTUAÇÕES (LOCALSTORAGE)
   ============================================================================ */

const HighScores = {
  STORAGE_KEY: 'voxel_road_strike_scores_v1',

  get() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  add(score, distance, enemies) {
    try {
      const list = this.get();
      list.push({
        score: Math.round(score),
        distance: Math.round(distance),
        enemies: enemies,
        date: new Date().toLocaleDateString('pt-BR')
      });
      list.sort((a, b) => b.score - a.score);
      const top10 = list.slice(0, 10);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(top10));
      return top10;
    } catch {
      return [];
    }
  },

  clear() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }
};


/* ============================================================================
   14. CÂMERA 3D DINÂMICA
   ============================================================================ */

class DynamicCamera {
  constructor() {
    this.eye = [0, 5.0, -10.0];
    this.target = [0, 1.2, 10.0];
    this.up = [0, 1, 0];
    this.smoothPos = [0, 5.0, -10.0];
    this.shakeAmount = 0;
  }

  addShake(amount) {
    this.shakeAmount = Math.min(1.0, this.shakeAmount + amount);
  }

  update(dt, player, road, allowShake = true) {
    if (this.shakeAmount > 0) {
      this.shakeAmount -= dt * 2.2;
      if (this.shakeAmount < 0) this.shakeAmount = 0;
    }

    const shakeOffset = (allowShake && this.shakeAmount > 0) ? (Math.random() - 0.5) * this.shakeAmount * 1.2 : 0;
    const roadAngle = road.getTangentAngle(player.worldZ);

    const followDist = 8.5;
    const height = 3.6;

    const targetEyeX = player.worldX - Math.sin(roadAngle) * followDist + shakeOffset;
    const targetEyeY = player.worldY + height + shakeOffset * 0.5;
    const targetEyeZ = player.worldZ - Math.cos(roadAngle) * followDist;

    const factor = Math.min(1.0, dt * 8.0);
    this.smoothPos[0] += (targetEyeX - this.smoothPos[0]) * factor;
    this.smoothPos[1] += (targetEyeY - this.smoothPos[1]) * factor;
    this.smoothPos[2] += (targetEyeZ - this.smoothPos[2]) * factor;

    this.eye[0] = this.smoothPos[0];
    this.eye[1] = this.smoothPos[1];
    this.eye[2] = this.smoothPos[2];

    this.target[0] = player.worldX + Math.sin(roadAngle) * 20.0;
    this.target[1] = player.worldY + 1.2;
    this.target[2] = player.worldZ + Math.cos(roadAngle) * 20.0;

    // Roll banking da câmera
    this.up[0] = Math.sin(-player.tiltRoll * 0.4);
    this.up[1] = Math.cos(-player.tiltRoll * 0.4);
    this.up[2] = 0;
  }
}


/* ============================================================================
   15. NÚCLEO DO JOGO E LOOP PRINCIPAL (GAME LOOP)
   ============================================================================ */

class Game {
  constructor() {
    this.canvas = document.getElementById('glCanvas');
    this.renderer = new WebGLRenderer(this.canvas);
    this.sound = new SoundSystem();

    // Modelos 3D Procedurais Voxel Pré-Bakeados
    this.models = {
      // Veículos Base
      interceptor: VoxelBuilder.buildInterceptor(this.renderer, 'machinegun'),
      raptor: VoxelBuilder.buildRaptorPlayer(this.renderer, 'machinegun'),
      titan: VoxelBuilder.buildTitanPlayer(this.renderer, 'machinegun'),

      // Variantes dos Veículos com Armas Montadas
      interceptor_machinegun: VoxelBuilder.buildInterceptor(this.renderer, 'machinegun'),
      interceptor_shotgun: VoxelBuilder.buildInterceptor(this.renderer, 'shotgun'),
      interceptor_cannon: VoxelBuilder.buildInterceptor(this.renderer, 'cannon'),

      raptor_machinegun: VoxelBuilder.buildRaptorPlayer(this.renderer, 'machinegun'),
      raptor_shotgun: VoxelBuilder.buildRaptorPlayer(this.renderer, 'shotgun'),
      raptor_cannon: VoxelBuilder.buildRaptorPlayer(this.renderer, 'cannon'),

      titan_machinegun: VoxelBuilder.buildTitanPlayer(this.renderer, 'machinegun'),
      titan_shotgun: VoxelBuilder.buildTitanPlayer(this.renderer, 'shotgun'),
      titan_cannon: VoxelBuilder.buildTitanPlayer(this.renderer, 'cannon'),

      // Inimigos detalhados
      enemy_raptor: VoxelBuilder.buildEnemyRaptor(this.renderer),
      enemy_titan: VoxelBuilder.buildEnemyTitan(this.renderer),
      enemy_scout: VoxelBuilder.buildEnemyScout(this.renderer),
      enemy_hauler: VoxelBuilder.buildEnemyHauler(this.renderer),

      // Props de Cenário
      desert_mesa: VoxelBuilder.buildDesertMesa(this.renderer),
      desert_cactus: VoxelBuilder.buildDesertCactus(this.renderer),
      snow_pine: VoxelBuilder.buildSnowPine(this.renderer),
      snow_mountain: VoxelBuilder.buildSnowMountain(this.renderer),
      japan_minka: VoxelBuilder.buildJapanMinka(this.renderer),
      japan_torii: VoxelBuilder.buildJapanTorii(this.renderer),
      japan_sakura: VoxelBuilder.buildJapanSakura(this.renderer),
      japan_lantern: VoxelBuilder.buildJapanLantern(this.renderer),

      // Obstáculos
      desert_rock: VoxelBuilder.buildDesertRock(this.renderer),
      snow_boulder: VoxelBuilder.buildSnowBoulder(this.renderer),
      pine_log: VoxelBuilder.buildPineLog(this.renderer),
      barrier: VoxelBuilder.buildBarrier(this.renderer),
      wreck: VoxelBuilder.buildWreck(this.renderer),
      stone_lantern: VoxelBuilder.buildJapanLantern(this.renderer),
      wooden_gate_beam: VoxelBuilder.buildWoodenBeam(this.renderer),
      frozen_crate: VoxelBuilder.buildCrate(this.renderer),
      rural_crate: VoxelBuilder.buildCrate(this.renderer),

      // Tokens Power-up e Escudo
      token_health: VoxelBuilder.buildTokenHealth(this.renderer),
      token_shield: VoxelBuilder.buildTokenShield(this.renderer),
      token_rapid: VoxelBuilder.buildTokenRapid(this.renderer),
      token_damage: VoxelBuilder.buildTokenDamage(this.renderer),
      shield_bubble: VoxelBuilder.buildShieldBubble(this.renderer)
    };

    // Sub-sistemas
    this.camera = new DynamicCamera();
    this.debris = new DebrisParticleSystem(this.renderer);
    this.road = new RoadManager(this.renderer);
    this.weapons = new WeaponSystem(this);
    this.enemies = new EnemyManager(this);
    this.obstacles = new ObstacleManager(this);
    this.powerups = new PowerUpManager(this);
    this.floatingTexts = new FloatingTextManager(this);

    // Seleções do Jogador
    this.selectedVehicle = 'interceptor';
    this.selectedWeapon = 'machinegun';
    this.selectedMap = 'desert';

    // Estado Geral do Jogo
    this.state = 'MENU'; // 'MENU' | 'SELECT' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    this.score = 0;
    this.distance = 0;
    this.wave = 1;
    this.kills = 0;
    this.combo = 1; // Começa rigorosamente em x1
    this.maxCombo = 1;
    this.comboTimer = 0;

    // Configurações do Usuário
    this.settings = {
      sensitivity: 100,
      cameraShake: true,
      graphics: 'high'
    };

    // Entradas do Usuário
    this.inputs = {
      left: false,
      right: false,
      up: false,
      down: false,
      shootHeld: false, // Segurar ESPAÇO
      keyQ: false,
      keyE: false
    };

    this.player = new PlayerVehicle(this, this.selectedVehicle);
    this.menuPreviewAngle = 0;

    this.setupEvents();
    this.setupUI();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  setupEvents() {
    window.addEventListener('keydown', (e) => {
      if (this.sound) {
        this.sound.init();
        this.sound.resume();
      }

      // Tecla ESC para pausar/continuar
      if (e.code === 'Escape') {
        e.preventDefault();
        this.togglePause();
        return;
      }

      // Controles de Direção
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.inputs.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.inputs.right = true;

      // Velocidade do Veículo (W/S)
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.inputs.up = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.inputs.down = true;

      // Segurar ESPAÇO para Atirar Continuamente
      if (e.code === 'Space') {
        e.preventDefault();
        this.inputs.shootHeld = true;
      }

      // Q e E para canos esquerdo/direito da metralhadora
      if (e.code === 'KeyQ') this.inputs.keyQ = true;
      if (e.code === 'KeyE') this.inputs.keyE = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.inputs.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.inputs.right = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.inputs.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.inputs.down = false;

      if (e.code === 'Space') this.inputs.shootHeld = false;
      if (e.code === 'KeyQ') this.inputs.keyQ = false;
      if (e.code === 'KeyE') this.inputs.keyE = false;
    });

    window.addEventListener('pointerdown', () => {
      if (this.sound) {
        this.sound.init();
        this.sound.resume();
      }
    });

    window.addEventListener('resize', () => this.renderer.resize());
  }

  setupUI() {
    // Menu Principal
    document.getElementById('btn-menu-play').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-select');
    });

    document.getElementById('btn-menu-how').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-how-to-play');
    });

    document.getElementById('btn-menu-highscores').addEventListener('click', () => {
      this.sound.playClick();
      this.renderHighScoresTable();
      this.showScreen('screen-highscores');
    });

    document.getElementById('btn-menu-settings').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-settings');
    });

    // Como Jogar
    document.getElementById('btn-how-back').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-main-menu');
    });

    // Recordes
    document.getElementById('btn-highscores-back').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-main-menu');
    });

    // Configurações
    document.getElementById('btn-settings-back').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-main-menu');
    });

    document.getElementById('btn-clear-scores').addEventListener('click', () => {
      if (confirm('Deseja realmente limpar todos os recordes salvos?')) {
        HighScores.clear();
        alert('Recordes apagados com sucesso!');
      }
    });

    // Seleção de Veículos
    const vCards = document.querySelectorAll('#vehicle-cards .selection-card');
    vCards.forEach(card => {
      card.addEventListener('click', () => {
        this.sound.playClick();
        vCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedVehicle = card.getAttribute('data-vehicle');
        this.updateSelectionDetails();
      });
    });

    // Seleção de Armas
    const wCards = document.querySelectorAll('#weapon-cards .selection-card');
    wCards.forEach(card => {
      card.addEventListener('click', () => {
        this.sound.playClick();
        wCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedWeapon = card.getAttribute('data-weapon');
        this.updateSelectionDetails();
      });
    });

    // Seleção de Mapas
    const mCards = document.querySelectorAll('#map-cards .selection-card');
    mCards.forEach(card => {
      card.addEventListener('click', () => {
        this.sound.playClick();
        mCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedMap = card.getAttribute('data-map');
      });
    });

    // Botões de Preparação
    document.getElementById('btn-select-back').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-main-menu');
    });

    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.sound.playClick();
      this.startNewGame();
    });

    // Menu de Pausa
    document.getElementById('btn-pause-resume').addEventListener('click', () => {
      this.sound.playClick();
      this.togglePause();
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      this.sound.playClick();
      this.startNewGame();
    });

    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      this.sound.playClick();
      this.returnToMenu();
    });

    // Game Over
    document.getElementById('btn-game-restart').addEventListener('click', () => {
      this.sound.playClick();
      this.startNewGame();
    });

    document.getElementById('btn-game-menu').addEventListener('click', () => {
      this.sound.playClick();
      this.returnToMenu();
    });

    // Sliders de Configurações
    this.bindRangeSlider('setting-master-vol', 'label-master-vol', (v) => this.sound.setMasterVolume(v / 100));
    this.bindRangeSlider('setting-music-vol', 'label-music-vol', (v) => this.sound.setMusicVolume(v / 100));
    this.bindRangeSlider('setting-sfx-vol', 'label-sfx-vol', (v) => this.sound.setSfxVolume(v / 100));
    this.bindRangeSlider('setting-sensitivity', 'label-sensitivity', (v) => this.settings.sensitivity = v);

    document.getElementById('setting-shake').addEventListener('change', (e) => {
      this.settings.cameraShake = e.target.checked;
    });

    document.getElementById('setting-graphics').addEventListener('change', (e) => {
      this.settings.graphics = e.target.value;
      if (this.settings.graphics === 'low') {
        this.debris.maxDebris = 120;
        this.debris.maxParticles = 150;
      } else if (this.settings.graphics === 'medium') {
        this.debris.maxDebris = 300;
        this.debris.maxParticles = 350;
      } else {
        this.debris.maxDebris = 500;
        this.debris.maxParticles = 600;
      }
    });

    // Inicializa detalhes da seleção
    this.updateSelectionDetails();
  }

  // Retorna o modelo 3D correspondente à combinação de veículo e arma equipada
  getPlayerModel(vehicleKey, weaponKey) {
    const vKey = vehicleKey || this.selectedVehicle || 'interceptor';
    const wKey = weaponKey || this.selectedWeapon || 'machinegun';
    const combinedKey = `${vKey}_${wKey}`;
    return this.models[combinedKey] || this.models[vKey] || this.models.interceptor;
  }

  // Atualiza em tempo real as informações visuais, nome, atributos e arma do veículo selecionado
  updateSelectionDetails() {
    const vKey = this.selectedVehicle || 'interceptor';
    const wKey = this.selectedWeapon || 'machinegun';
    const data = VEHICLE_DATA[vKey] || VEHICLE_DATA.interceptor;

    const nameEl = document.getElementById('info-name');
    if (nameEl) nameEl.textContent = data.displayName;

    const refEl = document.getElementById('info-model-ref');
    if (refEl) refEl.textContent = data.modelRef;

    const descEl = document.getElementById('info-description');
    if (descEl) descEl.textContent = data.description;

    const badgeEl = document.getElementById('info-badge');
    if (badgeEl) {
      badgeEl.textContent = data.badge;
      badgeEl.className = `card-badge ${data.badgeClass}`;
    }

    const speedFill = document.getElementById('stat-speed-fill');
    if (speedFill) speedFill.style.width = data.speedPct;

    const agilityFill = document.getElementById('stat-agility-fill');
    if (agilityFill) agilityFill.style.width = data.agilityPct;

    const armorFill = document.getElementById('stat-armor-fill');
    if (armorFill) armorFill.style.width = data.armorPct;

    const weaponNameEl = document.getElementById('info-weapon-name');
    if (weaponNameEl) {
      const wCfg = PLAYER_WEAPONS[wKey] || PLAYER_WEAPONS.machinegun;
      weaponNameEl.textContent = wCfg.name.toUpperCase();
    }

    const weaponDescEl = document.getElementById('info-weapon-desc');
    if (weaponDescEl && data.weaponNotes) {
      weaponDescEl.textContent = data.weaponNotes[wKey] || '';
    }
  }

  bindRangeSlider(inputId, labelId, callback) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);
    if (!input || !label) return;
    input.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      label.textContent = `${val}%`;
      callback(val);
    });
  }

  showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.add('hidden'));

    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');

    const hud = document.getElementById('hud');
    if (screenId === 'hud') {
      hud.classList.remove('hidden');
    } else if (screenId !== 'screen-pause') {
      hud.classList.add('hidden');
    }

    if (screenId === 'screen-select') {
      this.state = 'SELECT';
      this.updateSelectionDetails();
    } else if (screenId === 'screen-main-menu') {
      this.state = 'MENU';
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.sound.stopMusic();
      const pauseScreen = document.getElementById('screen-pause');
      if (pauseScreen) pauseScreen.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      this.sound.startMusic();
      const pauseScreen = document.getElementById('screen-pause');
      if (pauseScreen) pauseScreen.classList.add('hidden');
    }
  }

  // RESET COMPLETO DA PARTIDA
  startNewGame() {
    this.sound.init();
    this.sound.resume();
    this.sound.startMusic();

    // 1. Reset Rigoroso de Variáveis de Estado
    this.score = 0;
    this.distance = 0;
    this.wave = 1;
    this.kills = 0;
    this.combo = 1;       // Começa rigorosamente em x1
    this.maxCombo = 1;
    this.comboTimer = 0;

    // 2. Carrega o mapa escolhido
    this.road.setMap(this.selectedMap);

    // 3. Novo Veículo do Jogador limpo
    this.player = new PlayerVehicle(this, this.selectedVehicle);

    // 4. Limpa todas as entidades antigas
    this.enemies.enemies = [];
    this.obstacles.obstacles = [];
    this.powerups.items = [];
    this.weapons.projectiles = [];
    this.weapons.cooldown = 0;
    this.debris.debrisList = [];
    this.debris.particleList = [];
    this.debris.weatherParticles = [];
    this.floatingTexts.clear();

    // 5. Reset Completo de Elementos da HUD
    this.resetHUD();

    // 6. Inicia simulação
    this.state = 'PLAYING';
    this.showScreen('hud');
    this.showWaveAnnouncement(1, 'PREPARE-SE');
  }

  resetHUD() {
    document.getElementById('hud-hp-text').textContent = '1000 / 1000';
    document.getElementById('hud-hp-fill').style.width = '100%';
    const shieldFill = document.getElementById('hud-shield-fill');
    if (shieldFill) shieldFill.style.width = '0%';
    const shieldBadge = document.getElementById('hud-shield-badge');
    if (shieldBadge) shieldBadge.classList.add('hidden');

    document.getElementById('hud-score').textContent = '0';
    document.getElementById('hud-distance').textContent = '0 m';

    const comboPanel = document.getElementById('hud-combo-panel');
    comboPanel.classList.add('hidden');
    document.getElementById('hud-combo-mult').textContent = 'x1';
    document.getElementById('hud-combo-fill').style.width = '100%';

    document.getElementById('powerup-rapid-fire').classList.add('hidden');
    document.getElementById('powerup-double-damage').classList.add('hidden');
    document.getElementById('enemy-health-bars').innerHTML = '';

    const damageFlash = document.getElementById('damage-flash');
    if (damageFlash) damageFlash.classList.remove('active');
  }

  returnToMenu() {
    this.sound.stopMusic();
    this.state = 'MENU';
    this.resetHUD();
    this.floatingTexts.clear();

    // Limpa todas as entidades para liberar memória
    this.enemies.enemies = [];
    this.obstacles.obstacles = [];
    this.powerups.items = [];
    this.weapons.projectiles = [];
    this.debris.debrisList = [];
    this.debris.particleList = [];

    this.showScreen('screen-main-menu');
  }

  renderHighScoresTable() {
    const tbody = document.getElementById('highscores-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const list = HighScores.get();
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum recorde registrado ainda. Participe de uma missão!</td></tr>';
      return;
    }

    list.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${idx + 1}</td>
        <td><strong>${entry.score.toLocaleString()}</strong></td>
        <td>${entry.distance} m</td>
        <td>${entry.enemies}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  showWaveAnnouncement(waveNum, subtitle = '') {
    const banner = document.getElementById('hud-wave-banner');
    const title = document.getElementById('hud-wave-title');
    const sub = document.getElementById('hud-wave-subtitle');
    const tag = document.getElementById('hud-wave-tag');

    if (waveNum >= 4) banner.classList.add('danger');
    else banner.classList.remove('danger');

    title.textContent = (waveNum >= 4 && waveNum % 2 === 0) ? 'PERIGO: ONDA PESADA' : `ONDA ${waveNum}`;
    sub.textContent = subtitle || 'FROTA INIMIGA DETECTADA';
    tag.textContent = `ONDA ${waveNum}`;

    banner.classList.remove('hidden');
    banner.style.animation = 'none';
    banner.offsetHeight;
    banner.style.animation = '';

    setTimeout(() => {
      banner.classList.add('hidden');
    }, 2400);
  }

  addKill(basePts, worldX, worldY, worldZ) {
    this.kills++;
    const addedScore = basePts * this.combo;
    this.score += addedScore;

    // Floating Score Points (+600, +1200)
    const comboTag = this.combo > 1 ? ` (x${this.combo})` : '';
    this.floatingTexts.spawn(worldX, worldY + 1.2, worldZ, `+${addedScore}${comboTag}`, 'score');

    this.combo = Math.min(10, this.combo + 1);
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.comboTimer = 4.0;

    const comboPanel = document.getElementById('hud-combo-panel');
    const comboMult = document.getElementById('hud-combo-mult');
    if (this.combo > 1) {
      comboPanel.classList.remove('hidden');
      comboMult.textContent = `x${this.combo}`;
      comboPanel.style.animation = 'none';
      comboPanel.offsetHeight;
      comboPanel.style.animation = '';
    }
  }

  onPlayerDied() {
    this.state = 'GAMEOVER';
    this.sound.stopMusic();
    this.sound.playExplosion(true);
    this.camera.addShake(0.85);

    const modelObj = this.models[this.player.type];
    if (modelObj) {
      this.debris.spawnVehicleDestruction(
        this.player.worldX, this.player.worldY, this.player.worldZ,
        modelObj.boxes, 1.8
      );
    }

    // Registra pontuação final no localStorage
    HighScores.add(this.score, this.distance, this.kills);

    setTimeout(() => {
      document.getElementById('go-distance').textContent = `${Math.floor(this.distance)} m`;
      document.getElementById('go-score').textContent = Math.round(this.score).toLocaleString();
      document.getElementById('go-enemies').textContent = this.kills;
      document.getElementById('go-combo').textContent = `x${this.maxCombo}`;
      document.getElementById('go-wave').textContent = `Onda ${this.wave}`;
      this.showScreen('screen-game-over');
    }, 1200);
  }

  // Detecção de Colisões Físicas 3D
  checkCollisions() {
    const p = this.player;
    if (p.destroyed) return;

    // 1. Projéteis do Jogador contra Inimigos
    for (let i = this.weapons.projectiles.length - 1; i >= 0; i--) {
      const proj = this.weapons.projectiles[i];
      if (!proj.isPlayer || !proj.active || proj.hasHit) continue;

      const isCannon = (proj.isCannon || proj.weaponType === 'cannon' || proj.weaponType === 'canhao');
      const projHalf = isCannon ? Math.max(0.48, proj.size * 0.6) : (proj.size || 0.35) * 0.5;

      for (const e of this.enemies.enemies) {
        if (e.destroyed) continue;

        // O centro vertical real do modelo inimigo no mundo 3D
        const enemyCenterY = e.worldY + e.config.height * 0.5;
        const halfW = e.config.width * 0.55 + projHalf;
        const halfH = e.config.height * 0.55 + projHalf;
        const halfD = e.config.depth * 0.55 + projHalf;

        let hit = false;
        let hitX = proj.x;
        let hitY = proj.y;
        let hitZ = proj.z;

        // A. Teste AABB pontual na posição atual do projétil
        const dx = Math.abs(proj.x - e.worldX);
        const dy = Math.abs(proj.y - enemyCenterY);
        const dz = Math.abs(proj.z - e.worldZ);

        if (dx <= halfW && dy <= halfH && dz <= halfD) {
          hit = true;
        }

        // B. Verificação Contínua de Colisão 3D (Segment-AABB CCD) contra tunneling
        if (!hit) {
          const p0x = proj.prevX - e.worldX;
          const p0y = proj.prevY - enemyCenterY;
          const p0z = proj.prevZ - e.worldZ;
          const p1x = proj.x - e.worldX;
          const p1y = proj.y - enemyCenterY;
          const p1z = proj.z - e.worldZ;

          const segDx = p1x - p0x;
          const segDy = p1y - p0y;
          const segDz = p1z - p0z;

          let tMin = 0.0;
          let tMax = 1.0;
          let intersects = true;

          // Eixo X
          if (Math.abs(segDx) < 1e-6) {
            if (p0x < -halfW || p0x > halfW) intersects = false;
          } else {
            const inv = 1.0 / segDx;
            let t1 = (-halfW - p0x) * inv;
            let t2 = (halfW - p0x) * inv;
            if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);
            if (tMin > tMax) intersects = false;
          }

          // Eixo Y
          if (intersects) {
            if (Math.abs(segDy) < 1e-6) {
              if (p0y < -halfH || p0y > halfH) intersects = false;
            } else {
              const inv = 1.0 / segDy;
              let t1 = (-halfH - p0y) * inv;
              let t2 = (halfH - p0y) * inv;
              if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
              tMin = Math.max(tMin, t1);
              tMax = Math.min(tMax, t2);
              if (tMin > tMax) intersects = false;
            }
          }

          // Eixo Z
          if (intersects) {
            if (Math.abs(segDz) < 1e-6) {
              if (p0z < -halfD || p0z > halfD) intersects = false;
            } else {
              const inv = 1.0 / segDz;
              let t1 = (-halfD - p0z) * inv;
              let t2 = (halfD - p0z) * inv;
              if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
              tMin = Math.max(tMin, t1);
              tMax = Math.min(tMax, t2);
              if (tMin > tMax) intersects = false;
            }
          }

          if (intersects && tMin <= 1.0 && tMax >= 0.0) {
            hit = true;
            const hitT = Math.max(0.0, Math.min(1.0, tMin));
            hitX = proj.prevX + (proj.x - proj.prevX) * hitT;
            hitY = proj.prevY + (proj.y - proj.prevY) * hitT;
            hitZ = proj.prevZ + (proj.z - proj.prevZ) * hitT;
          }
        }

        // C. Verificação contínua no referencial de curvatura da pista (Road-space CCD)
        if (!hit && proj.road && dy <= halfH) {
          const zStart = Math.min(proj.prevRoadZ, proj.roadZ);
          const zEnd = Math.max(proj.prevRoadZ, proj.roadZ);
          const eMinZ = e.worldZ - halfD;
          const eMaxZ = e.worldZ + halfD;

          if (zEnd >= eMinZ && zStart <= eMaxZ) {
            let projLat = proj.lateralOffset;
            if (Math.abs(proj.roadZ - proj.prevRoadZ) > 1e-4) {
              const frac = Math.max(0, Math.min(1, (e.worldZ - proj.prevRoadZ) / (proj.roadZ - proj.prevRoadZ)));
              projLat = proj.prevLateralOffset + (proj.lateralOffset - proj.prevLateralOffset) * frac;
            }
            if (Math.abs(projLat - e.laneX) <= halfW) {
              hit = true;
              hitX = e.worldX;
              hitY = proj.y;
              hitZ = e.worldZ;
            }
          }
        }

        if (hit) {
          proj.hasHit = true;
          proj.active = false;
          e.takeDamage(proj.damage);
          const sparkCount = isCannon ? 14 : 8;
          this.debris.spawnHitSparks(hitX, hitY, hitZ, sparkCount);
          if (isCannon) {
            this.camera.addShake(0.18);
          }
          break;
        }
      }

      // Projéteis contra Obstáculos
      if (proj.active && !proj.hasHit) {
        for (const o of this.obstacles.obstacles) {
          if (o.destroyed) continue;
          const curveCenter = this.road.getCurveX(o.worldZ);
          const obsX = curveCenter + o.laneX;
          const dx = Math.abs(proj.x - obsX);
          const dz = Math.abs(proj.z - o.worldZ);

          if (dx < o.width * 0.6 && dz < o.depth * 0.6) {
            o.destroyed = true;
            this.sound.playExplosion(false);
            this.debris.spawnHitSparks(obsX, 0.6, o.worldZ, 12);
            proj.hasHit = true;
            proj.active = false;
            break;
          }
        }
      }
    }

    // 2. Projéteis Inimigos contra o Jogador
    for (const proj of this.weapons.projectiles) {
      if (proj.isPlayer || !proj.active) continue;
      const dx = Math.abs(proj.x - p.worldX);
      const dy = Math.abs(proj.y - p.worldY);
      const dz = Math.abs(proj.z - p.worldZ);

      if (dx < p.stats.width * 0.5 && dy < p.stats.height * 0.65 && dz < p.stats.depth * 0.5) {
        proj.active = false;
        p.takeDamage(proj.damage, false);
        this.debris.spawnHitSparks(proj.x, proj.y, proj.z, 8);
      }
    }

    // 3. Colisões Físicas Diretas: Jogador x Veículos Inimigos
    for (const e of this.enemies.enemies) {
      if (e.destroyed) continue;
      const dx = Math.abs(p.worldX - e.worldX);
      const dz = Math.abs(p.worldZ - e.worldZ);

      if (dx < (p.stats.width + e.config.width) * 0.48 && dz < (p.stats.depth + e.config.depth) * 0.48) {
        p.takeDamage(120, true);
        e.takeDamage(150);
        this.sound.playCrash();
        this.camera.addShake(0.5);
        this.debris.spawnHitSparks((p.worldX + e.worldX) * 0.5, 0.6, (p.worldZ + e.worldZ) * 0.5, 16);

        // Impulso de separação física elástica para desvincular imediatamente os veículos
        const pushDir = (p.laneX >= e.laneX) ? 1.0 : -1.0;
        p.laneX += pushDir * 1.5;
        e.laneX -= pushDir * 1.5;
        e.targetLaneX = e.laneX;
      }
    }

    // 4. Colisões Físicas: Jogador x Obstáculos
    for (const o of this.obstacles.obstacles) {
      if (o.destroyed) continue;
      const curveCenter = this.road.getCurveX(o.worldZ);
      const obsX = curveCenter + o.laneX;
      const dx = Math.abs(p.worldX - obsX);
      const dz = Math.abs(p.worldZ - o.worldZ);

      if (dx < (p.stats.width + o.width) * 0.45 && dz < (p.stats.depth + o.depth) * 0.45) {
        o.destroyed = true;
        p.takeDamage(100, true);
        this.sound.playCrash();
        this.debris.spawnHitSparks(obsX, 0.6, o.worldZ, 16);
      }
    }
  }

  updateHUD(dt) {
    // Barra de Vida Numérica do Jogador
    const hpText = document.getElementById('hud-hp-text');
    const hpFill = document.getElementById('hud-hp-fill');
    const shieldFill = document.getElementById('hud-shield-fill');
    const shieldBadge = document.getElementById('hud-shield-badge');

    if (hpText && hpFill) {
      hpText.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
      hpFill.style.width = `${Math.max(0, (this.player.hp / this.player.maxHp) * 100)}%`;
    }

    if (this.player && this.player.shieldTimer > 0) {
      if (shieldBadge) shieldBadge.classList.remove('hidden');
      if (shieldFill) shieldFill.style.width = `${Math.min(100, Math.max(0, (this.player.shieldTimer / 3.0) * 100))}%`;
    } else {
      if (shieldBadge) shieldBadge.classList.add('hidden');
      if (shieldFill) shieldFill.style.width = '0%';
    }

    // Sistema de Pontuação Unificado: Pontuação Total e Distância em Metros/KM
    document.getElementById('hud-score').textContent = Math.round(this.score).toLocaleString();
    if (this.distance >= 1000) {
      document.getElementById('hud-distance').textContent = `${(this.distance / 1000).toFixed(1)} km`;
    } else {
      document.getElementById('hud-distance').textContent = `${Math.floor(this.distance)} m`;
    }

    // Combo
    const comboPanel = document.getElementById('hud-combo-panel');
    const comboFill = document.getElementById('hud-combo-fill');
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      comboFill.style.width = `${(this.comboTimer / 4.0) * 100}%`;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        comboPanel.classList.add('hidden');
      }
    }

    // Power-ups Ativos
    const rapidCard = document.getElementById('powerup-rapid-fire');
    const rapidFill = document.getElementById('powerup-rapid-fill');
    if (this.player.rapidFireTimer > 0) {
      rapidCard.classList.remove('hidden');
      rapidFill.style.width = `${(this.player.rapidFireTimer / 8.0) * 100}%`;
    } else {
      rapidCard.classList.add('hidden');
    }

    const damageCard = document.getElementById('powerup-double-damage');
    const damageFill = document.getElementById('powerup-damage-fill');
    if (this.player.doubleDamageTimer > 0) {
      damageCard.classList.remove('hidden');
      damageFill.style.width = `${(this.player.doubleDamageTimer / 8.0) * 100}%`;
    } else {
      damageCard.classList.add('hidden');
    }

    // Barras de HP dos Inimigos com Número Numérico Visível
    this.updateEnemyHealthBars();
  }

  updateEnemyHealthBars() {
    const container = document.getElementById('enemy-health-bars');
    if (!container) return;
    container.innerHTML = '';

    const width = this.canvas.width;
    const height = this.canvas.height;
    const vp = this.renderer.matViewProj;

    for (const e of this.enemies.enemies) {
      if (!e.destroyed) {
        const screenPos = Math3D.projectToScreen(
          [e.worldX, e.worldY + e.config.height + 0.6, e.worldZ],
          vp, width, height
        );
        if (screenPos && screenPos.depth < 120.0) {
          const bar = document.createElement('div');
          bar.className = 'enemy-hp-bar';
          bar.style.left = `${screenPos.x}px`;
          bar.style.top = `${screenPos.y}px`;

          const fill = document.createElement('div');
          fill.className = 'enemy-hp-fill';
          fill.style.width = `${Math.max(0, (e.hp / e.maxHp) * 100)}%`;

          const text = document.createElement('div');
          text.className = 'enemy-hp-text';
          text.textContent = `${Math.ceil(e.hp)} / ${e.maxHp}`;

          bar.appendChild(fill);
          bar.appendChild(text);
          container.appendChild(bar);
        }
      }
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.06, (timestamp - this.lastTime) / 1000.0);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      // 1. Atualizações do Jogador e Controles
      this.player.update(dt, this.inputs);

      // 2. Sistema de Disparo Automático (Segurar ESPAÇO)
      if (this.inputs.shootHeld) {
        const roadAngle = this.road.getTangentAngle(this.player.worldZ);
        this.weapons.firePlayer(
          this.selectedWeapon,
          this.player.worldX, this.player.worldY, this.player.worldZ,
          roadAngle,
          this.player.doubleDamageTimer > 0,
          this.player.rapidFireTimer > 0,
          this.inputs.keyQ,
          this.inputs.keyE
        );
      }

      // 3. Pontuação Total Unificada: contribuição progressiva da distância
      this.distance = this.player.worldZ;
      this.score += dt * this.player.forwardSpeed * 0.8;

      // Ondas graduais
      const targetWave = Math.floor(this.distance / 500) + 1;
      if (targetWave > this.wave) {
        this.wave = targetWave;
        this.showWaveAnnouncement(this.wave);
      }

      // 4. Atualização de Entidades
      const mapCfg = MAP_CONFIGS[this.selectedMap] || MAP_CONFIGS.desert;
      this.debris.updateWeather(dt, this.player.worldZ, mapCfg.weather);

      this.enemies.update(dt, this.player);
      this.obstacles.update(dt, this.player.worldZ);
      this.powerups.update(dt, this.player);
      this.weapons.update(dt);
      this.debris.update(dt);
      this.floatingTexts.update(dt);

      // 5. Física e Colisões
      this.checkCollisions();

      // 6. Câmera Dinâmica
      this.camera.update(dt, this.player, this.road, this.settings.cameraShake);

      // 7. Interface HUD
      this.updateHUD(dt);

      // 8. Renderização WebGL Completa
      this.renderer.beginFrame(this.camera);
      this.road.render(this.renderer, this.player.worldZ, this.models);
      this.obstacles.render(this.renderer);
      this.powerups.render(this.renderer);
      this.enemies.render(this.renderer);
      this.player.render(this.renderer);
      this.weapons.render(this.renderer, this.player, this.road);
      this.debris.render(this.renderer);

    } else if (this.state === 'MENU' || this.state === 'SELECT') {
      // Modo Showroom 3D no Menu e Tela de Seleção
      this.menuPreviewAngle += dt * 0.9;
      const isSelect = (this.state === 'SELECT');
      const camDist = isSelect ? 5.2 : 6.5;
      const camHeight = isSelect ? 2.2 : 3.0;
      const targetY = isSelect ? 0.45 : 0.4;

      const previewCam = {
        eye: [Math.sin(this.menuPreviewAngle) * camDist, camHeight, Math.cos(this.menuPreviewAngle) * camDist],
        target: [0, targetY, 0],
        up: [0, 1, 0]
      };

      this.renderer.beginFrame(previewCam);

      const floorMat = Math3D.createMat4();
      Math3D.translateMat4(floorMat, floorMat, [0, -0.05, 0]);
      Math3D.scaleMat4(floorMat, floorMat, [1.6, 1, 1.6]);
      this.renderer.drawMesh(this.road.roadMesh, floorMat);

      const m = Math3D.createMat4();
      Math3D.translateMat4(m, m, [0, 0.46 + Math.sin(this.menuPreviewAngle * 3) * 0.04, 0]);
      const modelToDraw = this.getPlayerModel(this.selectedVehicle, this.selectedWeapon);
      this.renderer.drawMesh(modelToDraw.mesh, m);

    } else if (this.state === 'GAMEOVER') {
      this.debris.update(dt);
      this.renderer.beginFrame(this.camera);
      this.road.render(this.renderer, this.player.worldZ, this.models);
      this.enemies.render(this.renderer);
      this.debris.render(this.renderer);
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Inicialização automática do jogo
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});


// Test VoxelMesh and VoxelBuilder
try {
  console.log("Testing VoxelBuilder models...");
  const m1 = VoxelBuilder.buildInterceptor();
  console.log("Infiltrador (Interceptor) vertices count:", m1.vertices.length / 3);
  
  const m2 = VoxelBuilder.buildRaptorPlayer();
  console.log("Veloz (Raptor) vertices count:", m2.vertices.length / 3);

  const m3 = VoxelBuilder.buildTitanPlayer();
  console.log("Titan vertices count:", m3.vertices.length / 3);

  const weapons = ['machinegun', 'shotgun', 'cannon'];
  const vehicles = [
    { key: 'interceptor', builder: () => VoxelBuilder.buildInterceptor() },
    { key: 'raptor', builder: () => VoxelBuilder.buildRaptorPlayer() },
    { key: 'titan', builder: () => VoxelBuilder.buildTitanPlayer() }
  ];

  for (const v of vehicles) {
    for (const w of weapons) {
      const mesh = v.builder();
      VoxelBuilder.addWeaponToVehicle(mesh, v.key, w);
      console.log(`PASS: Built ${v.key}_${w} - vertices: ${mesh.vertices.length / 3}`);
    }
  }

  console.log("ALL MODEL GENERATION TESTS PASSED SUCCESSFULLY!");
} catch (err) {
  console.error("Error during model generation test:", err);
  process.exit(1);
}
