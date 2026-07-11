// Unified input: keyboard (physical key codes), mouse-drag camera orbit,
// wheel zoom, and a mobile touch joystick + jump button.

export interface JoystickState {
  active: boolean;
  x: number; // -1..1
  y: number; // -1..1
}

export class InputManager {
  private keys = new Set<string>();
  private el: HTMLElement;

  // camera orbit deltas accumulated since last frame
  lookDX = 0;
  lookDY = 0;
  zoomDelta = 0;

  joystick: JoystickState = { active: false, x: 0, y: 0 };
  touchJumpHeld = false;
  private touchJumpQueued = false;

  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  private joyPointerId: number | null = null;
  private joyOrigin = { x: 0, y: 0 };
  private lookPointerId: number | null = null;

  /** UI callback so the on-screen joystick widget can follow the finger. */
  onJoystickVisual?: (state: { active: boolean; ox: number; oy: number; dx: number; dy: number }) => void;

  private disposers: Array<() => void> = [];

  constructor(el: HTMLElement) {
    this.el = el;
    this.bind(window, "keydown", (e: KeyboardEvent) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
    });
    this.bind(window, "keyup", (e: KeyboardEvent) => this.keys.delete(e.code));
    this.bind(window, "blur", () => this.keys.clear());

    this.bind(el, "pointerdown", (e: PointerEvent) => this.onPointerDown(e));
    this.bind(window, "pointermove", (e: PointerEvent) => this.onPointerMove(e));
    this.bind(window, "pointerup", (e: PointerEvent) => this.onPointerUp(e));
    this.bind(window, "pointercancel", (e: PointerEvent) => this.onPointerUp(e));
    this.bind(
      el,
      "wheel",
      (e: WheelEvent) => {
        e.preventDefault();
        this.zoomDelta += e.deltaY;
      },
      { passive: false },
    );
    this.bind(el, "contextmenu", (e: Event) => e.preventDefault());
  }

  private bind(
    target: EventTarget,
    type: string,
    fn: (e: never) => void,
    opts?: AddEventListenerOptions,
  ) {
    target.addEventListener(type, fn as EventListener, opts);
    this.disposers.push(() => target.removeEventListener(type, fn as EventListener));
  }

  private onPointerDown(e: PointerEvent) {
    if (e.pointerType === "touch") {
      const rect = this.el.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      // Left 45% of screen = movement joystick, rest = camera look.
      if (localX < rect.width * 0.45 && this.joyPointerId === null) {
        this.joyPointerId = e.pointerId;
        this.joyOrigin = { x: e.clientX, y: e.clientY };
        this.joystick = { active: true, x: 0, y: 0 };
        this.onJoystickVisual?.({ active: true, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 });
      } else if (this.lookPointerId === null) {
        this.lookPointerId = e.pointerId;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
      }
      return;
    }
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private onPointerMove(e: PointerEvent) {
    if (e.pointerId === this.joyPointerId) {
      const dx = e.clientX - this.joyOrigin.x;
      const dy = e.clientY - this.joyOrigin.y;
      const radius = 60;
      const len = Math.hypot(dx, dy);
      const clamped = Math.min(len, radius) / radius;
      const nx = len > 0 ? (dx / len) * clamped : 0;
      const ny = len > 0 ? (dy / len) * clamped : 0;
      this.joystick = { active: true, x: nx, y: ny };
      this.onJoystickVisual?.({
        active: true,
        ox: this.joyOrigin.x,
        oy: this.joyOrigin.y,
        dx: nx * radius,
        dy: ny * radius,
      });
      return;
    }
    if (e.pointerId === this.lookPointerId || (this.dragging && e.pointerType !== "touch")) {
      this.lookDX += e.clientX - this.lastX;
      this.lookDY += e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    }
  }

  private onPointerUp(e: PointerEvent) {
    if (e.pointerId === this.joyPointerId) {
      this.joyPointerId = null;
      this.joystick = { active: false, x: 0, y: 0 };
      this.onJoystickVisual?.({ active: false, ox: 0, oy: 0, dx: 0, dy: 0 });
      return;
    }
    if (e.pointerId === this.lookPointerId) {
      this.lookPointerId = null;
      return;
    }
    this.dragging = false;
  }

  /** Called by the on-screen jump button. */
  pressJump() {
    this.touchJumpQueued = true;
    this.touchJumpHeld = true;
  }
  releaseJump() {
    this.touchJumpHeld = false;
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  get moveX(): number {
    let x = 0;
    if (this.isDown("KeyA") || this.isDown("ArrowLeft")) x -= 1;
    if (this.isDown("KeyD") || this.isDown("ArrowRight")) x += 1;
    if (this.joystick.active) x += this.joystick.x;
    return Math.max(-1, Math.min(1, x));
  }

  get moveY(): number {
    let y = 0;
    if (this.isDown("KeyW") || this.isDown("ArrowUp")) y -= 1;
    if (this.isDown("KeyS") || this.isDown("ArrowDown")) y += 1;
    if (this.joystick.active) y += this.joystick.y;
    return Math.max(-1, Math.min(1, y));
  }

  get sprint(): boolean {
    return this.isDown("ShiftLeft") || this.isDown("ShiftRight");
  }

  /** True while a jump is being requested. */
  consumeJumpQueued(): boolean {
    const q = this.touchJumpQueued;
    this.touchJumpQueued = false;
    return q || this.isDown("Space");
  }

  /** Read and reset per-frame camera deltas. */
  consumeLook(): { dx: number; dy: number; zoom: number } {
    const out = { dx: this.lookDX, dy: this.lookDY, zoom: this.zoomDelta };
    this.lookDX = 0;
    this.lookDY = 0;
    this.zoomDelta = 0;
    return out;
  }

  dispose() {
    this.disposers.forEach((d) => d());
    this.disposers = [];
  }
}
