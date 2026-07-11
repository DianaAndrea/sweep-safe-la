import * as THREE from "three";
import { InputManager } from "./input";
import { terrainHeight, SEA_LEVEL, SolidCollider } from "./world";

// Little ice-cream explorer: cone body, scoop head, stubby limbs.
// Movement is camera-relative with acceleration, coyote time and a jump
// buffer so controls feel forgiving and game-like.

const WALK_SPEED = 7;
const RUN_SPEED = 12;
const GRAVITY = -32;
const JUMP_VEL = 12;
const COYOTE = 0.12;
const JUMP_BUFFER = 0.14;
const FOOT_OFFSET = 0.72; // group origin sits this far above ground contact
const BODY_RADIUS = 0.45;

export class Player {
  group: THREE.Group;
  velocity = new THREE.Vector3();
  grounded = true;
  heading = 0; // facing yaw

  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private body!: THREE.Group;
  private walkPhase = 0;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private jumpHeldLast = false;
  private disposables: Array<{ dispose(): void }> = [];

  onJump?: () => void;
  onLand?: () => void;

  constructor(scene: THREE.Scene, private colliders: SolidCollider[]) {
    this.group = new THREE.Group();
    this.buildMesh();
    const h = terrainHeight(0, 0);
    this.group.position.set(0, h + FOOT_OFFSET, 0);
    scene.add(this.group);
  }

  private buildMesh() {
    const coneMat = new THREE.MeshLambertMaterial({ color: "#d9a05b" });
    const scoopMat = new THREE.MeshLambertMaterial({ color: "#fff2cf" });
    const limbMat = new THREE.MeshLambertMaterial({ color: "#8a5a3b" });
    const cherryMat = new THREE.MeshLambertMaterial({ color: "#ff4d6d" });
    const eyeMat = new THREE.MeshBasicMaterial({ color: "#33261d" });
    this.disposables.push(coneMat, scoopMat, limbMat, cherryMat, eyeMat);

    this.body = new THREE.Group();

    const coneGeo = new THREE.ConeGeometry(0.55, 1.15, 10);
    coneGeo.rotateX(Math.PI);
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.58;
    cone.castShadow = true;

    const headGeo = new THREE.SphereGeometry(0.55, 14, 12);
    const head = new THREE.Mesh(headGeo, scoopMat);
    head.position.y = 1.42;
    head.castShadow = true;
    head.scale.y = 0.95;

    const cherryGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const cherry = new THREE.Mesh(cherryGeo, cherryMat);
    cherry.position.y = 1.98;

    const eyeGeo = new THREE.SphereGeometry(0.07, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.18, 1.5, 0.48);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.18, 1.5, 0.48);

    const armGeo = new THREE.CapsuleGeometry(0.11, 0.45, 3, 6);
    this.leftArm = new THREE.Mesh(armGeo, limbMat);
    this.leftArm.position.set(-0.6, 1.0, 0);
    this.rightArm = new THREE.Mesh(armGeo, limbMat);
    this.rightArm.position.set(0.6, 1.0, 0);

    const legGeo = new THREE.CapsuleGeometry(0.13, 0.4, 3, 6);
    this.leftLeg = new THREE.Mesh(legGeo, limbMat);
    this.leftLeg.position.set(-0.22, -0.35, 0);
    this.rightLeg = new THREE.Mesh(legGeo, limbMat);
    this.rightLeg.position.set(0.22, -0.35, 0);

    this.body.add(cone, head, cherry, eyeL, eyeR, this.leftArm, this.rightArm);
    this.group.add(this.body, this.leftLeg, this.rightLeg);
    this.disposables.push(coneGeo, headGeo, cherryGeo, eyeGeo, armGeo, legGeo);
  }

  update(dt: number, input: InputManager, camYaw: number) {
    // --- desired planar velocity (camera relative) ---
    const ix = input.moveX;
    const iy = input.moveY;
    const mag = Math.min(1, Math.hypot(ix, iy));
    const speed = (input.sprint ? RUN_SPEED : WALK_SPEED) * mag;

    let targetVX = 0;
    let targetVZ = 0;
    if (mag > 0.01) {
      const sin = Math.sin(camYaw);
      const cos = Math.cos(camYaw);
      // camera looks along -[sin,cos]; input y<0 means "forward"
      const dirX = sin * iy + cos * ix;
      const dirZ = cos * iy - sin * ix;
      const dl = Math.hypot(dirX, dirZ) || 1;
      targetVX = (-dirX / dl) * speed;
      targetVZ = (-dirZ / dl) * speed;
      this.heading = lerpAngle(this.heading, Math.atan2(targetVX, targetVZ), 1 - Math.exp(-12 * dt));
    }

    const responsiveness = this.grounded ? 10 : 4;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVX, responsiveness, dt);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVZ, responsiveness, dt);

    // --- jumping ---
    const jumpHeld = input.consumeJumpQueued() || input.touchJumpHeld;
    if (jumpHeld && !this.jumpHeldLast) this.jumpBufferTimer = JUMP_BUFFER;
    this.jumpHeldLast = jumpHeld;
    this.jumpBufferTimer -= dt;
    this.coyoteTimer -= dt;
    if (this.grounded) this.coyoteTimer = COYOTE;

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.velocity.y = JUMP_VEL;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.onJump?.();
    }

    this.velocity.y += GRAVITY * dt;

    // --- integrate & terrain collision ---
    const p = this.group.position;
    p.x += this.velocity.x * dt;
    p.z += this.velocity.z * dt;
    p.y += this.velocity.y * dt;

    // soft world bound: gently pull back toward the island
    const dist = Math.hypot(p.x, p.z);
    const maxR = 150;
    if (dist > maxR) {
      p.x *= maxR / dist;
      p.z *= maxR / dist;
    }

    // push out of solid props (trunks, rocks, candy canes)
    const feetY = p.y - FOOT_OFFSET;
    for (const c of this.colliders) {
      if (feetY > c.topY) continue;
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      const R = c.r + BODY_RADIUS;
      const d2 = dx * dx + dz * dz;
      if (d2 < R * R && d2 > 1e-8) {
        const d = Math.sqrt(d2);
        p.x = c.x + (dx / d) * R;
        p.z = c.z + (dz / d) * R;
        // kill velocity into the obstacle so we don't jitter
        const vn = (this.velocity.x * dx + this.velocity.z * dz) / d;
        if (vn < 0) {
          this.velocity.x -= (vn * dx) / d;
          this.velocity.z -= (vn * dz) / d;
        }
      }
    }

    const groundH = Math.max(terrainHeight(p.x, p.z), SEA_LEVEL - 0.4) + FOOT_OFFSET;
    const wasGrounded = this.grounded;
    if (p.y <= groundH) {
      p.y = groundH;
      if (this.velocity.y < 0) this.velocity.y = 0;
      this.grounded = true;
      if (!wasGrounded) this.onLand?.();
    } else {
      this.grounded = p.y - groundH < 0.02;
    }

    // --- facing & procedural animation ---
    this.group.rotation.y = this.heading;

    const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.grounded && planarSpeed > 0.4) {
      this.walkPhase += dt * (5 + planarSpeed * 0.9);
      const swing = Math.sin(this.walkPhase) * Math.min(1, planarSpeed / WALK_SPEED) * 0.5;
      this.leftLeg.position.z = swing * 0.55;
      this.rightLeg.position.z = -swing * 0.55;
      this.leftArm.rotation.x = -swing * 1.4;
      this.rightArm.rotation.x = swing * 1.4;
      this.body.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.08;
      this.body.rotation.x = Math.min(0.12, planarSpeed * 0.012);
    } else if (!this.grounded) {
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, -2.4, 8, dt);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, -2.4, 8, dt);
      this.leftLeg.position.z = 0.18;
      this.rightLeg.position.z = -0.18;
      this.body.rotation.x = 0.08;
    } else {
      this.walkPhase = 0;
      this.leftLeg.position.z = THREE.MathUtils.damp(this.leftLeg.position.z, 0, 10, dt);
      this.rightLeg.position.z = THREE.MathUtils.damp(this.rightLeg.position.z, 0, 10, dt);
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, 0, 10, dt);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, 0, 10, dt);
      this.body.position.y = THREE.MathUtils.damp(this.body.position.y, 0, 10, dt);
      this.body.rotation.x = THREE.MathUtils.damp(this.body.rotation.x, 0, 10, dt);
    }
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
