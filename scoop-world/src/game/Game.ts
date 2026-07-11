import * as THREE from "three";
import { InputManager } from "./input";
import { buildWorld, WorldRefs, terrainHeight } from "./world";
import { Player } from "./player";
import { Sfx } from "./sfx";

export interface HudState {
  score: number;
  total: number;
  won: boolean;
}

// Third-person camera tuning.
const CAM_MIN_DIST = 4;
const CAM_MAX_DIST = 16;
const CAM_PITCH_MIN = -0.15;
const CAM_PITCH_MAX = 1.15;

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  readonly input: InputManager;
  private world: WorldRefs;
  private player: Player;
  private sfx = new Sfx();
  private sun: THREE.DirectionalLight;

  private camYaw = 0;
  private camPitch = 0.42;
  private camDist = 9;
  private camPos = new THREE.Vector3();
  private camTarget = new THREE.Vector3();

  private clock = new THREE.Clock();
  private elapsed = 0;
  private raf = 0;
  private running = false;
  private disposed = false;

  private score = 0;
  private won = false;
  onHud?: (hud: HudState) => void;

  // Confetti particle burst pool.
  private particles: THREE.Points;
  private particleData: Array<{ vel: THREE.Vector3; life: number }> = [];
  private particleGeo: THREE.BufferGeometry;
  private particleMat: THREE.PointsMaterial;

  // Perf instrumentation (read by automated tests via window hook).
  frameCount = 0;

  // Adaptive resolution: scale render resolution down when FPS drops.
  private perfTimer = 0;
  private perfFrames = 0;
  private resScale = 1;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.style.display = "block";

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(new THREE.Color("#d8ecf7"), 90, 320);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      600,
    );

    // Lighting: warm sun + cool sky fill.
    const hemi = new THREE.HemisphereLight("#cfeaff", "#e8c9a8", 0.85);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight("#fff2dd", 2.1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 160;
    const s = 42;
    this.sun.shadow.camera.left = -s;
    this.sun.shadow.camera.right = s;
    this.sun.shadow.camera.top = s;
    this.sun.shadow.camera.bottom = -s;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun, this.sun.target);

    this.world = buildWorld(this.scene);
    this.player = new Player(this.scene, this.world.solidColliders);
    this.player.onJump = () => this.sfx.jump();
    this.player.onLand = () => this.sfx.land();

    this.input = new InputManager(container);

    // Particle pool.
    const MAX_P = 120;
    this.particleGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(MAX_P * 3);
    const pCol = new Float32Array(MAX_P * 3);
    this.particleGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    this.particleGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    this.particleMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    this.particles = new THREE.Points(this.particleGeo, this.particleMat);
    this.particles.frustumCulled = false;
    for (let i = 0; i < MAX_P; i++) {
      this.particleData.push({ vel: new THREE.Vector3(), life: 0 });
      pPos[i * 3 + 1] = -1000;
    }
    this.scene.add(this.particles);

    window.addEventListener("resize", this.onResize);

    // Render one frame immediately so the world shows behind the start menu.
    this.update(0);
    this.renderer.render(this.scene, this.camera);
    this.emitHud();
  }

  /** Begin the loop (called from the Play button — also unlocks audio). */
  start() {
    if (this.running || this.disposed) return;
    this.sfx.init();
    this.running = true;
    this.clock.start();
    this.loop();
  }

  pressJump() {
    this.input.pressJump();
  }
  releaseJump() {
    this.input.releaseJump();
  }

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private loop = () => {
    if (this.disposed || !this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 1 / 20);
    this.elapsed += dt;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.frameCount++;
    this.adaptResolution(dt);
  };

  /** Drop render scale on slow devices, restore it when there's headroom. */
  private adaptResolution(dt: number) {
    this.perfTimer += dt;
    this.perfFrames++;
    if (this.perfTimer < 1.5) return;
    const fps = this.perfFrames / this.perfTimer;
    this.perfTimer = 0;
    this.perfFrames = 0;
    let next = this.resScale;
    if (fps < 45) next = Math.max(0.55, this.resScale - 0.15);
    else if (fps > 57) next = Math.min(1, this.resScale + 0.1);
    if (next !== this.resScale) {
      this.resScale = next;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * this.resScale);
      this.onResize();
    }
  }

  private update(dt: number) {
    const t = this.elapsed;

    // --- camera orbit input ---
    const look = this.input.consumeLook();
    this.camYaw -= look.dx * 0.0045;
    this.camPitch = THREE.MathUtils.clamp(
      this.camPitch + look.dy * 0.004,
      CAM_PITCH_MIN,
      CAM_PITCH_MAX,
    );
    this.camDist = THREE.MathUtils.clamp(
      this.camDist + look.zoom * 0.01,
      CAM_MIN_DIST,
      CAM_MAX_DIST,
    );

    // --- gameplay ---
    if (dt > 0) this.player.update(dt, this.input, this.camYaw);
    for (const fn of this.world.animated) fn(t, dt);
    this.checkPickups();
    this.updateParticles(dt);

    // --- camera follow (critically damped) ---
    const pp = this.player.group.position;
    const cosP = Math.cos(this.camPitch);
    const dist = this.camDist * this.cameraClearance(pp);
    const idealX = pp.x + Math.sin(this.camYaw) * dist * cosP;
    const idealZ = pp.z + Math.cos(this.camYaw) * dist * cosP;
    let idealY = pp.y + 1.6 + Math.sin(this.camPitch) * dist;
    // keep the camera above terrain
    const groundAtCam = terrainHeight(idealX, idealZ);
    if (idealY < groundAtCam + 1.2) idealY = groundAtCam + 1.2;

    if (dt === 0) {
      this.camPos.set(idealX, idealY, idealZ);
      this.camTarget.set(pp.x, pp.y + 1.2, pp.z);
    } else {
      // pull in fast when blocked, relax back out slowly
      const curD2 =
        (this.camPos.x - pp.x) ** 2 + (this.camPos.y - pp.y) ** 2 + (this.camPos.z - pp.z) ** 2;
      const idealD2 = (idealX - pp.x) ** 2 + (idealY - pp.y) ** 2 + (idealZ - pp.z) ** 2;
      const k = 1 - Math.exp(-(idealD2 < curD2 * 0.9 ? 30 : 10) * dt);
      this.camPos.x += (idealX - this.camPos.x) * k;
      this.camPos.y += (idealY - this.camPos.y) * k;
      this.camPos.z += (idealZ - this.camPos.z) * k;
      const tk = 1 - Math.exp(-18 * dt);
      this.camTarget.x += (pp.x - this.camTarget.x) * tk;
      this.camTarget.y += (pp.y + 1.2 - this.camTarget.y) * tk;
      this.camTarget.z += (pp.z - this.camTarget.z) * tk;
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);

    // --- shadow camera follows player ---
    this.sun.position.set(pp.x + 40, pp.y + 65, pp.z + 28);
    this.sun.target.position.set(pp.x, pp.y, pp.z);
  }

  /**
   * Fraction (0..1] of the desired camera distance that stays clear of tree
   * canopies. Circle-vs-segment test in XZ with a height check, so looking
   * down from above a tree is not affected.
   */
  private cameraClearance(pp: THREE.Vector3): number {
    const cosP = Math.cos(this.camPitch);
    const ex = pp.x + Math.sin(this.camYaw) * this.camDist * cosP;
    const ez = pp.z + Math.cos(this.camYaw) * this.camDist * cosP;
    const ey = pp.y + 1.6 + Math.sin(this.camPitch) * this.camDist;
    const sx = ex - pp.x;
    const sz = ez - pp.z;
    const len2 = sx * sx + sz * sz;
    if (len2 < 1e-6) return 1;
    let frac = 1;
    for (const c of this.world.canopyColliders) {
      // quick reject: canopy far from player
      const cdx = c.x - pp.x;
      const cdz = c.z - pp.z;
      if (cdx * cdx + cdz * cdz > (this.camDist + c.r) * (this.camDist + c.r)) continue;
      const t0 = THREE.MathUtils.clamp((cdx * sx + cdz * sz) / len2, 0, 1);
      const nx = pp.x + sx * t0 - c.x;
      const nz = pp.z + sz * t0 - c.z;
      const d2 = nx * nx + nz * nz;
      const R = c.r + 0.35;
      if (d2 >= R * R) continue;
      const back = Math.sqrt(R * R - d2) / Math.sqrt(len2);
      const tEnter = Math.max(0, t0 - back);
      const yAt = pp.y + 1.6 + (ey - (pp.y + 1.6)) * tEnter;
      if (yAt > c.topY) continue; // camera passes above the canopy
      frac = Math.min(frac, Math.max(0.18, tEnter - 0.04));
    }
    return frac;
  }

  private checkPickups() {
    const pp = this.player.group.position;
    for (const c of this.world.collectibleList) {
      if (c.taken) continue;
      const dx = c.mesh.position.x - pp.x;
      const dy = c.mesh.position.y - (pp.y + 1);
      const dz = c.mesh.position.z - pp.z;
      if (dx * dx + dy * dy + dz * dz < 2.6) {
        c.taken = true;
        c.mesh.visible = false;
        this.score++;
        this.sfx.pickup();
        this.burst(c.mesh.position);
        if (this.score >= this.world.collectibleList.length && !this.won) {
          this.won = true;
          this.sfx.win();
        }
        this.emitHud();
      }
    }
  }

  private burst(at: THREE.Vector3) {
    const pos = this.particleGeo.attributes.position as THREE.BufferAttribute;
    const col = this.particleGeo.attributes.color as THREE.BufferAttribute;
    const colors = [
      new THREE.Color("#ff9db8"),
      new THREE.Color("#9fe8c6"),
      new THREE.Color("#fff2cf"),
      new THREE.Color("#a8d8f0"),
    ];
    let spawned = 0;
    for (let i = 0; i < this.particleData.length && spawned < 22; i++) {
      const p = this.particleData[i];
      if (p.life > 0) continue;
      p.life = 0.7 + Math.random() * 0.4;
      p.vel.set((Math.random() - 0.5) * 7, Math.random() * 6 + 2, (Math.random() - 0.5) * 7);
      pos.setXYZ(i, at.x, at.y, at.z);
      const c = colors[Math.floor(Math.random() * colors.length)];
      col.setXYZ(i, c.r, c.g, c.b);
      spawned++;
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  private updateParticles(dt: number) {
    const pos = this.particleGeo.attributes.position as THREE.BufferAttribute;
    let any = false;
    for (let i = 0; i < this.particleData.length; i++) {
      const p = this.particleData[i];
      if (p.life <= 0) continue;
      any = true;
      p.life -= dt;
      p.vel.y -= 14 * dt;
      pos.setXYZ(
        i,
        pos.getX(i) + p.vel.x * dt,
        pos.getY(i) + p.vel.y * dt,
        pos.getZ(i) + p.vel.z * dt,
      );
      if (p.life <= 0) pos.setY(i, -1000);
    }
    if (any) pos.needsUpdate = true;
  }

  private emitHud() {
    this.onHud?.({
      score: this.score,
      total: this.world.collectibleList.length,
      won: this.won,
    });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.input.dispose();
    this.world.dispose();
    this.player.dispose();
    this.particleGeo.dispose();
    this.particleMat.dispose();
    this.sfx.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
