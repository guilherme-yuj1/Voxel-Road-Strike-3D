# VOXEL ROAD STRIKE 3D

Jogo completo de combate veicular arcade 3D construído em **WebGL nativo com JavaScript puro**, sem qualquer dependência de bibliotecas externas (Three.js, Babylon.js, etc.).

## 🎮 Comandos do Jogo

| Tecla / Comando | Ação |
| :--- | :--- |
| **A** ou **←** | Mover para a **Esquerda** |
| **D** ou **→** | Mover para a **Direita** |
| **W** ou **↑** | **Acelerar** (Avanço contínuo mais veloz) |
| **S** ou **↓** | **Desacelerar** (Velocidade mínima positiva segura) |
| **ESPAÇO (Segurar)** | **Disparo Automático Contínuo** |
| **Q** | Disparar cano **Esquerdo** (Metralhadora) |
| **E** | Disparar cano **Direito** (Metralhadora) |
| **ESC** | **Pausar / Continuar** a partida |

---

## 🔫 Armas

1. **Metralhadora:** 8 disparos por segundo, 60 de dano por tiro, 330m de alcance efetivo. Controle de canos esquerdo/direito pelas teclas Q e E.
2. **Dispersora:** Exatamente 3 projéteis concentrados por disparo, 150 de dano por projétil (450 máx), 184m de alcance e trajetórias previsíveis.
3. **Canhão Pesado:** 450 de dano por tiro, 440m de alcance, projétil maciço com grande impacto, trepidação de câmera e explosão concussiva.

---

## 🗺️ Mapas 3D

- **Deserto:** Dunas douradas, cânions rochosos, cactos e iluminação quente.
- **Floresta Nevada:** Montanhas congeladas, pinheiros nevados e partículas de neve.
- **Japão Rural:** Casas tradicionais minka, portais Torii vermelhos, cerejeiras sakura floridas e arrozais.

---

## ⚙️ Características Técnicas

- **Renderizador WebGL Nativo:** Shaders GLSL personalizados, iluminação difusa com normais tridimensionais, profundidade e névoa atmosférica.
- **Linha de Mira 3D:** Guia visual tridimensional alinhada com a trajetória balística dos tiros.
- **Veículos Inimigos Reconhecíveis:** Modelos voxel 3D com rodas, cabines, carrocerias, para-choques e armas específicas.
- **Destruição Voxel:** Desmembramento de partes, rodas saltando com física de quique e detritos dinâmicos.
- **Áudio Procedural:** Síntese sonora em tempo real via Web Audio API.
- **Persistência de Recordes:** Tabela de melhores pontuações via `localStorage`.