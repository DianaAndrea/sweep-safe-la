import { Game, HudState } from "./game/Game";

const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

const app = document.getElementById("app")!;
app.innerHTML = `
  <div id="game-mount"></div>

  <div id="hud" class="hidden">
    <div id="score-pill">🍦 <span id="score">0</span> / <span id="total">0</span></div>
    <div id="hint" class="${isTouchDevice ? "hidden" : ""}">
      WASD / arrows move · Space jump · Shift sprint · drag to look · scroll to zoom
    </div>
    <div id="win-banner" class="hidden">
      <div class="win-card">
        <div class="win-emoji">🎉🍨🎉</div>
        <div class="win-title">All scoops collected!</div>
        <div class="win-sub">Keep exploring Scoop World ✨</div>
      </div>
    </div>
    ${isTouchDevice ? `
      <div id="joystick" class="hidden"><div id="joystick-knob"></div></div>
      <button id="jump-btn" aria-label="Jump">⬆️</button>
    ` : ""}
  </div>

  <div id="start-overlay">
    <div class="start-card">
      <div class="start-emoji">🍦</div>
      <h1>Scoop World</h1>
      <p>Explore a pastel ice-cream island and collect every floating scoop.</p>
      <button id="play-btn">▶ Play</button>
      <p class="start-hint">${
        isTouchDevice
          ? "Left side: move · right side: look · button: jump"
          : "WASD move · Space jump · Shift sprint · drag mouse to look"
      }</p>
    </div>
  </div>
`;

const mount = document.getElementById("game-mount")!;
const game = new Game(mount);

// Expose for automated perf checks.
(window as unknown as { __game?: Game }).__game = game;

const scoreEl = document.getElementById("score")!;
const totalEl = document.getElementById("total")!;
const winBanner = document.getElementById("win-banner")!;

game.onHud = (hud: HudState) => {
  scoreEl.textContent = String(hud.score);
  totalEl.textContent = String(hud.total);
  winBanner.classList.toggle("hidden", !hud.won);
};

document.getElementById("play-btn")!.addEventListener("click", () => {
  document.getElementById("start-overlay")!.classList.add("hidden");
  document.getElementById("hud")!.classList.remove("hidden");
  game.start();
});

if (isTouchDevice) {
  const jumpBtn = document.getElementById("jump-btn")!;
  jumpBtn.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    game.pressJump();
  });
  jumpBtn.addEventListener("pointerup", () => game.releaseJump());
  jumpBtn.addEventListener("pointerleave", () => game.releaseJump());

  const joy = document.getElementById("joystick")!;
  const knob = document.getElementById("joystick-knob")!;
  game.input.onJoystickVisual = (s) => {
    joy.classList.toggle("hidden", !s.active);
    if (s.active) {
      joy.style.left = `${s.ox - 60}px`;
      joy.style.top = `${s.oy - 60}px`;
      knob.style.transform = `translate(${s.dx}px, ${s.dy}px)`;
    }
  };
}
