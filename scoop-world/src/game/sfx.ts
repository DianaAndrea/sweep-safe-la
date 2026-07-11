// Tiny procedural WebAudio SFX — no asset files needed.

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  /** Must be called from a user gesture (the Play button). */
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol = 1, glideTo?: number) {
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  pickup() {
    this.tone(880, 0.12, "sine", 0.8);
    setTimeout(() => this.tone(1320, 0.18, "sine", 0.7), 70);
  }

  jump() {
    this.tone(300, 0.18, "triangle", 0.6, 560);
  }

  land() {
    this.tone(180, 0.1, "triangle", 0.35, 120);
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.28, "sine", 0.7), i * 130),
    );
  }

  dispose() {
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.master = null;
  }
}
