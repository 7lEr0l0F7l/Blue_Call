// Web Audio API emergency sound generator
class AudioHelper {
  private ctx: AudioContext | null = null;
  private sirenOscillator: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenTimer: number | null = null;
  private ringtoneInterval: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play short feedback beep (iOS keypress / haptic sound)
  playTap() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio not supported or blocked
    }
  }

  // Play SOS Morse Beep (... --- ...)
  playSOS() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const dot = 0.08;
      const dash = 0.22;
      const gap = 0.06;

      let time = now;
      const playTone = (duration: number, startTime: number) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(1000, startTime);
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // 3 dots
      for (let i = 0; i < 3; i++) {
        playTone(dot, time);
        time += dot + gap;
      }
      time += 0.1;
      // 3 dashes
      for (let i = 0; i < 3; i++) {
        playTone(dash, time);
        time += dash + gap;
      }
      time += 0.1;
      // 3 dots
      for (let i = 0; i < 3; i++) {
        playTone(dot, time);
        time += dot + gap;
      }
    } catch {
      // Ignore audio error
    }
  }

  // Radio dispatch sound (Walkie-talkie chirp)
  playRadioChirp() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore
    }
  }

  // Control Center incoming call alert
  playControlAlert() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.15, 0.3].forEach((offset, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 1320, now + offset);
        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.linearRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } catch {
      // Ignore
    }
  }

  // Start continuous Siren sound
  startSiren() {
    try {
      this.stopSiren();
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();

      let high = false;
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);

      this.sirenOscillator = osc;
      this.sirenGain = gain;

      this.sirenTimer = window.setInterval(() => {
        if (!this.ctx || !this.sirenOscillator) return;
        const targetFreq = high ? 650 : 1100;
        this.sirenOscillator.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.15);
        high = !high;
      }, 400);
    } catch {
      // Ignore
    }
  }

  // Stop siren
  stopSiren() {
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
      } catch {
        // Ignore
      }
      this.sirenOscillator = null;
    }
  }

  // Start phone ringtone (standard iOS style double ring)
  startRingtone() {
    this.stopRingtone();
    const ringBurst = () => {
      try {
        this.initCtx();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0.15, now + 1.2);
        gain.gain.linearRampToValueAtTime(0, now + 1.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.25);
        osc2.stop(now + 1.25);
      } catch {
        // Ignore
      }
    };

    ringBurst();
    this.ringtoneInterval = window.setInterval(ringBurst, 3000);
  }

  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  private ringbackInterval: number | null = null;
  private ringbackOscillators: OscillatorNode[] = [];

  // Start outgoing call Ringback tone (한국 표준 전화 통화 연결음: 440Hz + 480Hz 또는 400Hz 뚜르르르~)
  startRingbackTone() {
    this.stopRingbackTone();
    const playBurst = () => {
      try {
        this.initCtx();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Dual Tone Multi-Frequency standard ringback
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 1.2);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.25);
        osc2.stop(now + 1.25);

        this.ringbackOscillators = [osc1, osc2];
      } catch {
        // Ignore
      }
    };

    playBurst();
    this.ringbackInterval = window.setInterval(playBurst, 3000);
  }

  stopRingbackTone() {
    if (this.ringbackInterval) {
      clearInterval(this.ringbackInterval);
      this.ringbackInterval = null;
    }
    this.ringbackOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore
      }
    });
    this.ringbackOscillators = [];
  }

  // Busy tone (통화중 신호음: 480Hz + 620Hz, 뚜- 뚜- 뚜-)
  playBusyTone() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.4, 0.8, 1.2].forEach(offset => {
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.frequency.setValueAtTime(480, now + offset);
        osc2.frequency.setValueAtTime(620, now + offset);

        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.linearRampToValueAtTime(0.001, now + offset + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now + offset);
        osc2.start(now + offset);
        osc1.stop(now + offset + 0.25);
        osc2.stop(now + offset + 0.25);
      });
    } catch {
      // Ignore
    }
  }

  playBusy() {
    this.playBusyTone();
  }

  // Speech TTS for fake call voice
  speakFakeVoice(text: string, onEnd?: () => void) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      if (onEnd) {
        utterance.onend = onEnd;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      if (onEnd) setTimeout(onEnd, 2000);
    }
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioHelper = new AudioHelper();
