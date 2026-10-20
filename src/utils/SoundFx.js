// Procedural Audio Synthesizer using Web Audio API
// Zero external sound asset dependencies, 100% instant loading, reliable on all browsers

class SoundFxGenerator {
  constructor() {
    this.ctx = null;
    let savedMute = false;
    try {
      savedMute = localStorage.getItem('rooftop_duel_sfx_muted') === 'true';
    } catch (e) {
      savedMute = false;
    }
    this.isUserMuted = savedMute;
    this.isAdMuted = false;
    this.isTabMuted = false;
  }

  get isMuted() {
    return this.isUserMuted || this.isAdMuted || this.isTabMuted;
  }

  set isMuted(val) {
    this.isUserMuted = !!val;
    try {
      localStorage.setItem('rooftop_duel_sfx_muted', this.isUserMuted ? 'true' : 'false');
    } catch (e) {}
  }

  setAdMuted(muted) {
    this.isAdMuted = !!muted;
    if (this.ctx) {
      if (this.isMuted && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      } else if (!this.isMuted && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }
  }

  setTabMuted(muted) {
    this.isTabMuted = !!muted;
    if (this.ctx) {
      if (this.isMuted && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      } else if (!this.isMuted && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
      this.ctx.resume().catch(() => {});
    }
  }

  getPitchFactor() {
    return 0.92 + Math.random() * 0.16; // ±8% natural pitch variance
  }

  playJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const pitch = this.getPitchFactor();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(460 * pitch, now + 0.14);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  playLand() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playShootPistol() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitch = this.getPitchFactor();

    // High crack
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(820 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(110 * pitch, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    // Subtle body punch
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(200 * pitch, now);
    sub.frequency.exponentialRampToValueAtTime(50, now + 0.07);
    subGain.gain.setValueAtTime(0.2, now);
    subGain.gain.linearRampToValueAtTime(0.01, now + 0.07);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.07);
  }

  playShootRocket() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitch = this.getPitchFactor();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130 * pitch, now);
    osc.frequency.linearRampToValueAtTime(320 * pitch, now + 0.12);
    osc.frequency.linearRampToValueAtTime(75 * pitch, now + 0.3);

    gain.gain.setValueAtTime(0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playShootLaser() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitch = this.getPitchFactor();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1450 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(180 * pitch, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playFishSlap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitch = this.getPitchFactor();

    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.04;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime((360 + i * 150) * pitch, t);
      osc.frequency.exponentialRampToValueAtTime(80 * pitch, t + 0.07);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.07);
    }
  }

  playHitBody() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitch = this.getPitchFactor();

    // Solid kinetic impact thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playHitLaser() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitch = this.getPitchFactor();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(980 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playExplosion() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Initial transient crack
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(600, now);
    click.frequency.exponentialRampToValueAtTime(80, now + 0.05);
    clickGain.gain.setValueAtTime(0.4, now);
    clickGain.gain.linearRampToValueAtTime(0.01, now + 0.05);
    click.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    click.start(now);
    click.stop(now + 0.05);

    // 2. Sub-bass boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(130, now);
    sub.frequency.exponentialRampToValueAtTime(35, now + 0.35);
    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.35);

    // 3. Filtered noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playKO() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    this.playExplosion();

    // Epic heavy chord
    const notes = [220, 277.18, 329.63, 440];
    const now = this.ctx.currentTime + 0.06;

    notes.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  playScore() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25]; // A major chord
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  playStreak() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playFallTroll() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.5);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playCoin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playMemeStinger(skinId = 'default') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitch = this.getPitchFactor();

    switch (skinId) {
      case 'cat': {
        // Playful 3-note meow chirping chime
        const chirpTimes = [0, 0.08, 0.17];
        const freqs = [
          [900 * pitch, 1400 * pitch],
          [1200 * pitch, 1800 * pitch],
          [1500 * pitch, 2200 * pitch]
        ];

        chirpTimes.forEach((tOffset, i) => {
          const t = now + tOffset;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freqs[i][0], t);
          osc.frequency.exponentialRampToValueAtTime(freqs[i][1], t + 0.07);

          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.075);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.075);
        });
        break;
      }

      case 'doge': {
        // Humorous double bark synth tone ('woof-woof')
        const barkTimes = [0, 0.15];
        barkTimes.forEach((tOffset) => {
          const t = now + tOffset;
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(380 * pitch, t);
          osc.frequency.exponentialRampToValueAtTime(110 * pitch, t + 0.1);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(750, t);
          filter.frequency.linearRampToValueAtTime(400, t + 0.1);
          filter.Q.setValueAtTime(3.0, t);

          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.11);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(t);
          osc.stop(t + 0.11);
        });
        break;
      }

      case 'capybara': {
        // Ultra chill low marimba pulse
        const notes = [196.00 * pitch, 246.94 * pitch, 293.66 * pitch]; // G3, B3, D4 warm chill triad
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.11;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.005, t + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(t);
          osc.stop(t + 0.35);
        });
        break;
      }

      case 'noob': {
        // Retro 8-bit blip chime
        const blips = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
        blips.forEach((freq, idx) => {
          const t = now + idx * 0.05;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq * pitch, t);

          gain.gain.setValueAtTime(0.22, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.045);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(t);
          osc.stop(t + 0.045);
        });
        break;
      }

      case 'golden': {
        // Royal ascending brass fanfare
        const fanfare = [
          { f: 392.00, t: 0, d: 0.12 },     // G4
          { f: 523.25, t: 0.12, d: 0.12 },  // C5
          { f: 659.25, t: 0.24, d: 0.14 },  // E5
          { f: 783.99, t: 0.38, d: 0.45 }   // G5 (royal peak hold)
        ];

        fanfare.forEach(({ f, t, d }) => {
          const noteTime = now + t;
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f * pitch, noteTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, noteTime);
          filter.frequency.linearRampToValueAtTime(2600, noteTime + 0.06);

          gain.gain.setValueAtTime(0.01, noteTime);
          gain.gain.linearRampToValueAtTime(0.35, noteTime + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.01, noteTime + d);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + d);
        });
        break;
      }

      case 'default':
      default: {
        // Wacky slide whistle synth
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450 * pitch, now);
        osc.frequency.linearRampToValueAtTime(1300 * pitch, now + 0.18);
        osc.frequency.linearRampToValueAtTime(500 * pitch, now + 0.35);

        gain.gain.setValueAtTime(0.32, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
    }
  }

  playShotgun() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitch = this.getPitchFactor();

    // 1. Multi-burst crack (triple micro-burst representing multiple pellets exploding from dual barrels)
    for (let i = 0; i < 3; i++) {
      const burstTime = now + i * 0.018;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime((850 - i * 120) * pitch, burstTime);
      osc.frequency.exponentialRampToValueAtTime(90, burstTime + 0.06);

      gain.gain.setValueAtTime(0.35 - i * 0.06, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.01, burstTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(burstTime);
      osc.stop(burstTime + 0.06);
    }

    // 2. Heavy bass thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(170 * pitch, now);
    sub.frequency.exponentialRampToValueAtTime(35, now + 0.22);

    subGain.gain.setValueAtTime(0.55, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.22);
  }

  playSniper() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitch = this.getPitchFactor();

    // 1. Initial sharp supersonic crack
    const crack = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(2400 * pitch, now);
    crack.frequency.exponentialRampToValueAtTime(140, now + 0.06);

    crackGain.gain.setValueAtTime(0.5, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    crack.connect(crackGain);
    crackGain.connect(this.ctx.destination);
    crack.start(now);
    crack.stop(now + 0.06);

    // Initial low-end punch
    const punch = this.ctx.createOscillator();
    const punchGain = this.ctx.createGain();
    punch.type = 'sine';
    punch.frequency.setValueAtTime(220 * pitch, now);
    punch.frequency.exponentialRampToValueAtTime(45, now + 0.15);
    punchGain.gain.setValueAtTime(0.4, now);
    punchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    punch.connect(punchGain);
    punchGain.connect(this.ctx.destination);
    punch.start(now);
    punch.stop(now + 0.15);

    // 2. Trailing distant echoes (reflection bouncing off city rooftops)
    const echoes = [0.11, 0.22];
    echoes.forEach((delay, idx) => {
      const echoTime = now + delay;
      const echoOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const echoGain = this.ctx.createGain();

      echoOsc.type = 'sawtooth';
      echoOsc.frequency.setValueAtTime(700 / (idx + 1), echoTime);
      echoOsc.frequency.exponentialRampToValueAtTime(180, echoTime + 0.1);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200 - idx * 400, echoTime);

      echoGain.gain.setValueAtTime(0.18 / (idx + 1), echoTime);
      echoGain.gain.exponentialRampToValueAtTime(0.01, echoTime + 0.12);

      echoOsc.connect(filter);
      filter.connect(echoGain);
      echoGain.connect(this.ctx.destination);

      echoOsc.start(echoTime);
      echoOsc.stop(echoTime + 0.12);
    });
  }

  playCountdownTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playDuelStart() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Resonant gong harmonics
    const gongFrequencies = [110, 224, 335, 480];
    gongFrequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.98, now + 0.8);

      const initVol = 0.35 / (idx + 1);
      gain.gain.setValueAtTime(initVol, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.85);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    });

    // Duel brass horn swell
    const horn = this.ctx.createOscillator();
    const hornFilter = this.ctx.createBiquadFilter();
    const hornGain = this.ctx.createGain();

    horn.type = 'sawtooth';
    horn.frequency.setValueAtTime(146.83, now); // D3
    horn.frequency.linearRampToValueAtTime(220, now + 0.2); // Swell to A3

    hornFilter.type = 'lowpass';
    hornFilter.frequency.setValueAtTime(400, now);
    hornFilter.frequency.linearRampToValueAtTime(1500, now + 0.25);
    hornFilter.frequency.exponentialRampToValueAtTime(300, now + 0.7);

    hornGain.gain.setValueAtTime(0.01, now);
    hornGain.gain.linearRampToValueAtTime(0.35, now + 0.15);
    hornGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    horn.connect(hornFilter);
    hornFilter.connect(hornGain);
    hornGain.connect(this.ctx.destination);

    horn.start(now);
    horn.stop(now + 0.7);
  }
}

export const soundFx = new SoundFxGenerator();
