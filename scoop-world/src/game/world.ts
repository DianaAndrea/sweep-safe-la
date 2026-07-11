import * as THREE from "three";
import { fbm2, makeRng } from "./noise";

// ---------------------------------------------------------------------------
// Scoop World — a pastel low-poly ice-cream island.
// Terrain height is an analytic function so player physics and the rendered
// mesh always agree exactly.
// ---------------------------------------------------------------------------

export const ISLAND_RADIUS = 110;
export const SEA_LEVEL = 0.35;

const PALETTE = {
  waferSand: new THREE.Color("#f2d8a7"),
  mintGrass: new THREE.Color("#a8e6c1"),
  mintDark: new THREE.Color("#7fd4a8"),
  strawberry: new THREE.Color("#f7b8c9"),
  vanillaSnow: new THREE.Color("#fff6e8"),
  chocolate: new THREE.Color("#8a5a3b"),
  milkSea: new THREE.Color("#bfe8f2"),
  coneTan: new THREE.Color("#d9a05b"),
  candyRed: new THREE.Color("#ff6b81"),
  candyWhite: new THREE.Color("#fff9f2"),
  scoopPink: new THREE.Color("#ff9db8"),
  scoopMint: new THREE.Color("#9fe8c6"),
  scoopVanilla: new THREE.Color("#fff2cf"),
  scoopChoc: new THREE.Color("#9c6644"),
  scoopBlue: new THREE.Color("#a8d8f0"),
};

export function terrainHeight(x: number, z: number): number {
  const d = Math.hypot(x, z) / ISLAND_RADIUS;
  // Island falloff: 1 at the center, dips below sea toward the rim.
  const falloff = 1 - THREE.MathUtils.smoothstep(d, 0.55, 1.02);
  const base = fbm2(x * 0.012 + 7.3, z * 0.012 - 2.1, 4) * 14;
  const ridges = fbm2(x * 0.035 - 3.7, z * 0.035 + 9.4, 3) * 3.5;
  return (base + ridges - 4.5) * falloff - (1 - falloff) * 6;
}

/** Approximate terrain normal via central differences. */
export function terrainNormal(x: number, z: number, out: THREE.Vector3): THREE.Vector3 {
  const e = 0.6;
  const hL = terrainHeight(x - e, z);
  const hR = terrainHeight(x + e, z);
  const hD = terrainHeight(x, z - e);
  const hU = terrainHeight(x, z + e);
  return out.set(hL - hR, 2 * e, hD - hU).normalize();
}

function terrainColor(h: number, slope: number, x: number, z: number): THREE.Color {
  const c = new THREE.Color();
  const jitter = fbm2(x * 0.15, z * 0.15, 2) * 0.5;
  // Smoothly blended height bands so shorelines and slopes never look jagged.
  const grass = new THREE.Color().copy(PALETTE.mintGrass).lerp(PALETTE.mintDark, jitter);
  c.copy(PALETTE.waferSand)
    .lerp(grass, THREE.MathUtils.smoothstep(h, SEA_LEVEL + 0.5, SEA_LEVEL + 1.8));
  const berry = new THREE.Color().copy(PALETTE.strawberry).lerp(PALETTE.mintGrass, 0.25 * (1 - jitter));
  c.lerp(berry, THREE.MathUtils.smoothstep(h, 5.0 + jitter * 2, 6.8 + jitter * 2));
  c.lerp(PALETTE.vanillaSnow, THREE.MathUtils.smoothstep(h, 9.0 + jitter * 2, 10.8 + jitter * 2));
  if (slope > 0.55 && h > SEA_LEVEL + 0.9) {
    c.lerp(PALETTE.chocolate, Math.min(1, (slope - 0.55) * 2.2));
  }
  return c;
}

export interface Collectible {
  mesh: THREE.Object3D;
  taken: boolean;
  baseY: number;
  phase: number;
}

/** Solid circle the player cannot walk through (tree trunks, rocks, canes). */
export interface SolidCollider {
  x: number;
  z: number;
  r: number;
  topY: number;
}

/** Fat canopy circle the camera should not pass through. */
export interface CanopyCollider {
  x: number;
  z: number;
  r: number;
  topY: number;
}

export interface WorldRefs {
  collectibleList: Collectible[];
  solidColliders: SolidCollider[];
  canopyColliders: CanopyCollider[];
  animated: Array<(t: number, dt: number) => void>;
  dispose: () => void;
}

type Disposable = { dispose(): void };
type Spot = { x: number; z: number; h: number };
type PropTransform = { pos: THREE.Vector3; rotY: number; scale: number };

function buildTerrain(scene: THREE.Scene, disposables: Disposable[]) {
  const size = ISLAND_RADIUS * 2.35;
  const segs = 150;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = terrainHeight(x, z);
    pos.setY(i, h);
    terrainNormal(x, z, n);
    const slope = 1 - n.y;
    const c = terrainColor(h, slope * 2.2, x, z);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
  disposables.push(geo, mat);
}

function buildSea(scene: THREE.Scene, disposables: Disposable[]): THREE.Mesh {
  const geo = new THREE.CircleGeometry(ISLAND_RADIUS * 3.2, 48);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshLambertMaterial({
    color: PALETTE.milkSea,
    transparent: true,
    opacity: 0.92,
  });
  const sea = new THREE.Mesh(geo, mat);
  sea.position.y = SEA_LEVEL;
  scene.add(sea);
  disposables.push(geo, mat);
  return sea;
}

/** Rejection-sample spawn spots on land, away from other used spots. */
function scatter(
  rng: () => number,
  count: number,
  minH: number,
  maxH: number,
  maxSlope: number,
  minDist: number,
  used: Array<{ x: number; z: number }>,
): Spot[] {
  const out: Spot[] = [];
  const n = new THREE.Vector3();
  let attempts = 0;
  while (out.length < count && attempts < count * 60) {
    attempts++;
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * ISLAND_RADIUS * 0.92;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const h = terrainHeight(x, z);
    if (h < minH || h > maxH) continue;
    terrainNormal(x, z, n);
    if (1 - n.y > maxSlope) continue;
    let ok = true;
    for (const u of used) {
      if (Math.hypot(u.x - x, u.z - z) < minDist) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    used.push({ x, z });
    out.push({ x, z, h });
  }
  return out;
}

/**
 * Multi-part instanced prop: each part is one InstancedMesh sharing the
 * per-instance root transform, with its own local offset applied.
 */
function instancedProp(
  scene: THREE.Scene,
  disposables: Disposable[],
  parts: Array<{
    geo: THREE.BufferGeometry;
    mat: THREE.Material;
    offset: THREE.Vector3;
    castShadow?: boolean;
  }>,
  transforms: PropTransform[],
) {
  if (transforms.length === 0) return;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  for (const part of parts) {
    const im = new THREE.InstancedMesh(part.geo, part.mat, transforms.length);
    im.castShadow = part.castShadow !== false;
    im.receiveShadow = false;
    for (let i = 0; i < transforms.length; i++) {
      const t = transforms[i];
      q.setFromAxisAngle(up, t.rotY);
      p.copy(part.offset).multiplyScalar(t.scale).applyQuaternion(q).add(t.pos);
      s.setScalar(t.scale);
      m.compose(p, q, s);
      im.setMatrixAt(i, m);
    }
    im.instanceMatrix.needsUpdate = true;
    scene.add(im);
    disposables.push(part.geo);
  }
}

function buildProps(
  scene: THREE.Scene,
  rng: () => number,
  used: Array<{ x: number; z: number }>,
  disposables: Disposable[],
  solidColliders: SolidCollider[],
  canopyColliders: CanopyCollider[],
) {
  const coneMat = new THREE.MeshLambertMaterial({ color: PALETTE.coneTan });
  const scoopMats = [
    new THREE.MeshLambertMaterial({ color: PALETTE.scoopPink }),
    new THREE.MeshLambertMaterial({ color: PALETTE.scoopMint }),
    new THREE.MeshLambertMaterial({ color: PALETTE.scoopVanilla }),
    new THREE.MeshLambertMaterial({ color: PALETTE.scoopChoc }),
  ];
  disposables.push(coneMat, ...scoopMats);

  // Ice-cream-cone "trees": point-down cone trunk + scoop canopy + cherry.
  const treeSpots = scatter(rng, 90, SEA_LEVEL + 1.2, 9, 0.4, 7, used);
  const trunkGeo = new THREE.ConeGeometry(1.1, 4.2, 7);
  trunkGeo.rotateX(Math.PI);
  trunkGeo.translate(0, 2.1, 0);
  const scoopGeo = new THREE.IcosahedronGeometry(1.9, 1);
  const scoopTopGeo = new THREE.IcosahedronGeometry(1.25, 1);
  const cherryGeo = new THREE.SphereGeometry(0.42, 8, 6);
  const cherryMat = new THREE.MeshLambertMaterial({ color: PALETTE.candyRed });
  disposables.push(cherryMat, trunkGeo, scoopGeo, scoopTopGeo, cherryGeo);

  // Split trees into 4 flavor batches so canopies vary in color.
  const batches: PropTransform[][] = [[], [], [], []];
  for (const t of treeSpots) {
    const b = Math.floor(rng() * 4);
    const scale = 0.8 + rng() * 0.7;
    batches[b].push({
      pos: new THREE.Vector3(t.x, t.h - 0.15, t.z),
      rotY: rng() * Math.PI * 2,
      scale,
    });
    solidColliders.push({ x: t.x, z: t.z, r: 0.75 * scale, topY: t.h + 4.2 * scale });
    canopyColliders.push({ x: t.x, z: t.z, r: 2.1 * scale, topY: t.h + 8.2 * scale });
  }
  batches.forEach((batch, bi) => {
    instancedProp(
      scene,
      disposables,
      [
        { geo: trunkGeo.clone(), mat: coneMat, offset: new THREE.Vector3(0, 0, 0) },
        { geo: scoopGeo.clone(), mat: scoopMats[bi], offset: new THREE.Vector3(0, 4.9, 0) },
        { geo: scoopTopGeo.clone(), mat: scoopMats[(bi + 1) % 4], offset: new THREE.Vector3(0, 6.6, 0) },
        { geo: cherryGeo.clone(), mat: cherryMat, offset: new THREE.Vector3(0, 7.7, 0) },
      ],
      batch,
    );
  });

  // Candy-cane posts.
  const caneSpots = scatter(rng, 26, SEA_LEVEL + 0.9, 8, 0.35, 10, used);
  const poleGeo = new THREE.CylinderGeometry(0.16, 0.16, 3.4, 8);
  poleGeo.translate(0, 1.7, 0);
  const hookGeo = new THREE.TorusGeometry(0.55, 0.16, 8, 14, Math.PI);
  hookGeo.translate(0, 3.4, 0);
  const caneMatR = new THREE.MeshLambertMaterial({ color: PALETTE.candyRed });
  const caneMatW = new THREE.MeshLambertMaterial({ color: PALETTE.candyWhite });
  disposables.push(caneMatR, caneMatW);
  instancedProp(
    scene,
    disposables,
    [
      { geo: poleGeo, mat: caneMatW, offset: new THREE.Vector3(0, 0, 0) },
      { geo: hookGeo, mat: caneMatR, offset: new THREE.Vector3(0.55, 0, 0) },
    ],
    caneSpots.map((t) => {
      const scale = 0.9 + rng() * 0.4;
      solidColliders.push({ x: t.x, z: t.z, r: 0.35 * scale, topY: t.h + 3.4 * scale });
      return {
        pos: new THREE.Vector3(t.x, t.h - 0.1, t.z),
        rotY: rng() * Math.PI * 2,
        scale,
      };
    }),
  );

  // Candy rocks.
  const rockSpots = scatter(rng, 60, SEA_LEVEL + 0.6, 12, 0.6, 4, used);
  const rockGeo = new THREE.IcosahedronGeometry(0.9, 0);
  const rockMat = new THREE.MeshLambertMaterial({ color: PALETTE.candyWhite });
  disposables.push(rockMat);
  instancedProp(
    scene,
    disposables,
    [{ geo: rockGeo, mat: rockMat, offset: new THREE.Vector3(0, 0.35, 0) }],
    rockSpots.map((t) => {
      const scale = 0.5 + rng() * 1.1;
      solidColliders.push({ x: t.x, z: t.z, r: 0.85 * scale, topY: t.h + 1.3 * scale });
      return {
        pos: new THREE.Vector3(t.x, t.h - 0.2, t.z),
        rotY: rng() * Math.PI * 2,
        scale,
      };
    }),
  );

  // Wafer fence posts along a few arcs.
  const fenceGeo = new THREE.BoxGeometry(0.5, 1.4, 0.18);
  const fenceMat = new THREE.MeshLambertMaterial({ color: PALETTE.coneTan });
  disposables.push(fenceMat);
  const fenceTs: PropTransform[] = [];
  for (let arc = 0; arc < 3; arc++) {
    const a0 = rng() * Math.PI * 2;
    for (let i = 0; i < 10; i++) {
      const a = a0 + i * 0.045;
      const r = ISLAND_RADIUS * 0.62;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = terrainHeight(x, z);
      if (h < SEA_LEVEL + 0.5) continue;
      fenceTs.push({ pos: new THREE.Vector3(x, h + 0.45, z), rotY: -a, scale: 1 });
    }
  }
  instancedProp(
    scene,
    disposables,
    [{ geo: fenceGeo, mat: fenceMat, offset: new THREE.Vector3(0, 0, 0) }],
    fenceTs,
  );
}

function buildCollectibles(
  scene: THREE.Scene,
  rng: () => number,
  used: Array<{ x: number; z: number }>,
  disposables: Disposable[],
): Collectible[] {
  const group = new THREE.Group();
  scene.add(group);
  const spots = scatter(rng, 40, SEA_LEVEL + 0.9, 11, 0.5, 8, used);
  const coneGeo = new THREE.ConeGeometry(0.42, 1.0, 8);
  coneGeo.rotateX(Math.PI);
  const ballGeo = new THREE.IcosahedronGeometry(0.5, 1);
  const coneMat = new THREE.MeshLambertMaterial({ color: PALETTE.coneTan });
  const flavors = [PALETTE.scoopPink, PALETTE.scoopMint, PALETTE.scoopVanilla, PALETTE.scoopBlue];
  const flavorMats = flavors.map(
    (c) => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.25 }),
  );
  disposables.push(coneGeo, ballGeo, coneMat, ...flavorMats);

  const list: Collectible[] = [];
  for (const s of spots) {
    const holder = new THREE.Group();
    const cone = new THREE.Mesh(coneGeo, coneMat);
    const ball = new THREE.Mesh(ballGeo, flavorMats[Math.floor(rng() * flavorMats.length)]);
    ball.position.y = 0.62;
    holder.add(cone, ball);
    const baseY = s.h + 1.5;
    holder.position.set(s.x, baseY, s.z);
    group.add(holder);
    list.push({ mesh: holder, taken: false, baseY, phase: rng() * Math.PI * 2 });
  }
  return list;
}

function buildClouds(scene: THREE.Scene, rng: () => number, disposables: Disposable[]): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  const geo = new THREE.IcosahedronGeometry(1, 1);
  disposables.push(mat, geo);
  for (let i = 0; i < 14; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(rng() * 3);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(geo, mat);
      puff.position.set((p - puffs / 2) * 3.2 + rng() * 1.5, rng() * 1.2, rng() * 2 - 1);
      puff.scale.set(2.2 + rng() * 2, 1.2 + rng() * 0.8, 1.8 + rng());
      cloud.add(puff);
    }
    const a = rng() * Math.PI * 2;
    const r = 40 + rng() * 130;
    cloud.position.set(Math.cos(a) * r, 38 + rng() * 22, Math.sin(a) * r);
    cloud.userData.speed = 0.4 + rng() * 0.6;
    group.add(cloud);
  }
  scene.add(group);
  return group;
}

function buildSky(scene: THREE.Scene, disposables: Disposable[]) {
  const geo = new THREE.SphereGeometry(480, 24, 12);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color("#7ec8f5") },
      midColor: { value: new THREE.Color("#c9ecfb") },
      botColor: { value: new THREE.Color("#ffe9f0") },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 botColor;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, -0.15, 1.0);
        vec3 col = h > 0.25
          ? mix(midColor, topColor, smoothstep(0.25, 0.9, h))
          : mix(botColor, midColor, smoothstep(-0.15, 0.25, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.frustumCulled = false;
  scene.add(sky);
  disposables.push(geo, mat);
}

export function buildWorld(scene: THREE.Scene): WorldRefs {
  const disposables: Disposable[] = [];
  const rng = makeRng(1337);
  const used: Array<{ x: number; z: number }> = [{ x: 0, z: 0 }]; // keep spawn clear
  const solidColliders: SolidCollider[] = [];
  const canopyColliders: CanopyCollider[] = [];

  buildSky(scene, disposables);
  buildTerrain(scene, disposables);
  const sea = buildSea(scene, disposables);
  // Collectibles scatter first so the densely packed props can't crowd them out.
  const collectibleList = buildCollectibles(scene, rng, used, disposables);
  buildProps(scene, rng, used, disposables, solidColliders, canopyColliders);
  const clouds = buildClouds(scene, rng, disposables);

  const animated: Array<(t: number, dt: number) => void> = [];
  animated.push((t, dt) => {
    for (const cloud of clouds.children) {
      cloud.position.x += (cloud.userData.speed as number) * dt;
      if (cloud.position.x > 220) cloud.position.x = -220;
    }
    for (const c of collectibleList) {
      if (c.taken) continue;
      c.mesh.rotation.y = t * 1.6 + c.phase;
      c.mesh.position.y = c.baseY + Math.sin(t * 2.2 + c.phase) * 0.25;
    }
    sea.position.y = SEA_LEVEL + Math.sin(t * 0.7) * 0.06;
  });

  return {
    collectibleList,
    solidColliders,
    canopyColliders,
    animated,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
