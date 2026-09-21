/**
 * Procedural Web Audio API sound synthesizer for LAST NIGHT: Zombie Survival.
 * Generates all sound effects dynamically without requiring any external audio files.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private masterGain: GainNode | null = null;

  constructor() {
    // Lazy initialize on first interaction
  }

  public initCtx(): boolean {
    if (!this.soundEnabled) return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(enabled ? 0.4 : 0, this.ctx.currentTime);
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public playButtonClick() {
    if (!this.initCtx() || !this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playShoot() {
    if (!this.initCtx() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Noise blast for gunshot crack
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3500, now);
    filter.frequency.linearRampToValueAtTime(800, now + 0.08);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // 2. Low-end punch oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.start(now);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playEmptyGun() {
    if (!this.initCtx() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playReload() {
    if (!this.initCtx() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Click 1: Magazine eject
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.linearRampToValueAtTime(400, now + 0.06);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.linearRampToValueAtTime(0.01, now + 0.06);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Click 2: Magazine insert (0.4s later)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(450, now + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(900, now + 0.48);
    gain2.gain.setValueAtTime(0.35, now + 0.4);
    gain2.gain.linearRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.4);
    osc2.stop(now + 0.5);

    // Slide rack (0.7s later)
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sawtooth';
    osc3.frequency.setValueAtTime(500, now + 0.7);
    osc3.frequency.linearRampToValueAtTime(1100, now + 0.82);
    gain3.gain.setValueAtTime(0.25, now + 0.7);
    gain3.gain.linearRampToValueAtTime(0.01, now + 0.85);
    osc3.connect(gain3);
    gain3.connect(this.masterGain);
    osc3.start(now + 0.7);
    osc3.stop(now + 0.85);
  }

  public playZombieHit() {
    if (!this.initCtx() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playZombieDeath() {
    if (!this.initCtx() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.22);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playPlayerHurt() {
    if (!this.initCtx() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.18);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playCoinPickup() {
    if (!this.initCtx() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.05); // E6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playWaveCleared() {
    if (!this.initCtx() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.28);
    });
  }

  public playBossAlert() {
    if (!this.initCtx() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Menacing low horn
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.linearRampToValueAtTime(55, now + 0.8);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.95);
  }
}

export const sound = new SoundController();
