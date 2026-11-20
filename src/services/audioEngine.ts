import { SynthComposition, Track } from '../types/music';

const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000] as const;

export class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private htmlAudio: HTMLAudioElement | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;

  private currentTrack: Track | null = null;
  private isPlayingState = false;
  private currentTimeSec = 0;
  private playbackRate = 1.0;
  private volume = 0.82;
  private isMuted = false;

  private stepIndex = 0;
  private stepTimerId: number | null = null;
  private clockTimerId: number | null = null;
  private lastTickPerf = 0;

  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
  private onTrackEndCallback?: () => void;

  public async resume(): Promise<void> {
    this.ensureContext();
    try {
      await this.ctx?.resume();
    } catch {
      // ignore — resume is best-effort when returning from background
    }
    if (
      this.isPlayingState &&
      this.htmlAudio &&
      !this.currentTrack?.audioUrl.startsWith('synth://')
    ) {
      try {
        await this.htmlAudio.play();
      } catch {
        // Autoplay may still be blocked in background; the caller
        // (visibilitychange / Media Session) retries on user action.
      }
    }
  }

  public get isPlaying(): boolean {
    return this.isPlayingState;
  }

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.82;

      // Create 5-band Equalizer filter chain
      this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
        const filter = this.ctx!.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.1;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Connect EQ chain -> masterGain -> analyser -> destination
      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].connect(this.eqFilters[i + 1]);
      }
      this.eqFilters[this.eqFilters.length - 1].connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private getInputNode(): AudioNode {
    this.ensureContext();
    return this.eqFilters[0];
  }

  public setCallbacks(
    onTimeUpdate: (currentTime: number, duration: number) => void,
    onTrackEnd: () => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onTrackEndCallback = onTrackEnd;
  }

  public loadTrack(track: Track, autoPlay = true) {
    this.stopInternalTimers();
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }

    this.currentTrack = track;
    this.currentTimeSec = 0;
    this.stepIndex = 0;

    if (!track.audioUrl.startsWith('synth://')) {
      this.ensureContext();
      if (!this.htmlAudio) {
        this.htmlAudio = new Audio();
        this.htmlAudio.crossOrigin = 'anonymous';
        this.htmlAudio.preload = 'auto';
        this.htmlAudio.setAttribute('playsinline', '');
        // Keep the element alive for background playback: it is routed
        // through AudioContext for EQ, so resume() must be called when
        // the tab becomes visible again (see App.tsx visibility handler).
        this.htmlAudio.addEventListener('timeupdate', () => {
          if (this.htmlAudio && !this.currentTrack?.audioUrl.startsWith('synth://')) {
            this.currentTimeSec = this.htmlAudio.currentTime;
            const dur =
              Number.isFinite(this.htmlAudio.duration) && this.htmlAudio.duration > 0
                ? this.htmlAudio.duration
                : this.currentTrack?.previewDurationSec || this.currentTrack?.durationSec || 30;
            this.onTimeUpdateCallback?.(this.currentTimeSec, dur);
          }
        });
        this.htmlAudio.addEventListener('ended', () => {
          this.isPlayingState = false;
          this.onTrackEndCallback?.();
        });
        this.htmlAudio.addEventListener('error', () => {
          if (!this.currentTrack || !this.htmlAudio) return;
          if (
            this.currentTrack.rawPreviewUrl &&
            this.htmlAudio.src !== this.currentTrack.rawPreviewUrl
          ) {
            this.htmlAudio.src = this.currentTrack.rawPreviewUrl;
            if (this.isPlayingState) {
              this.htmlAudio.play().catch(() => {});
            }
            return;
          }
          // Automatic fallback to procedural studio synth if external stream is unreachable
          this.currentTrack = {
            ...this.currentTrack,
            audioUrl: 'synth://custom-fallback',
          };
          if (this.isPlayingState) {
            this.startSynthLoop();
          }
        });
      }

      this.htmlAudio.src = track.audioUrl;
      this.htmlAudio.playbackRate = this.playbackRate;

      if (!this.mediaElementSource && this.ctx) {
        try {
          this.mediaElementSource = this.ctx.createMediaElementSource(this.htmlAudio);
          this.mediaElementSource.connect(this.getInputNode());
        } catch {
          // Already connected
        }
      }
    }

    this.onTimeUpdateCallback?.(0, track.durationSec);

    if (autoPlay) {
      this.play();
    }
  }

  public play() {
    if (!this.currentTrack) return;
    this.ensureContext();
    this.isPlayingState = true;

    if (this.currentTrack.audioUrl.startsWith('synth://')) {
      this.startSynthLoop();
    } else if (this.htmlAudio) {
      this.htmlAudio.playbackRate = this.playbackRate;
      this.htmlAudio.play().catch(() => {
        // play() can be rejected when called from background (no user
        // gesture / autoplay policy). Retry once shortly after — e.g.
        // when the tab becomes visible again — before falling back
        // to the procedural synth, which would replace the real track.
        window.setTimeout(() => {
          if (!this.isPlayingState || !this.htmlAudio) return;
          this.htmlAudio?.play().catch(() => {
            this.startSynthLoop();
          });
        }, 600);
      });
    }
  }

  public pause() {
    this.isPlayingState = false;
    this.stopInternalTimers();
    if (this.htmlAudio && !this.currentTrack?.audioUrl.startsWith('synth://')) {
      this.htmlAudio.pause();
    }
  }

  public seek(timeSec: number) {
    if (!this.currentTrack) return;
    const clamped = Math.max(0, Math.min(timeSec, this.currentTrack.durationSec));
    this.currentTimeSec = clamped;

    if (!this.currentTrack.audioUrl.startsWith('synth://') && this.htmlAudio) {
      this.htmlAudio.currentTime = clamped;
    }
    this.onTimeUpdateCallback?.(this.currentTimeSec, this.currentTrack.durationSec);
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02
      );
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02
      );
    }
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(0.5, Math.min(1.5, rate));
    if (this.htmlAudio) {
      this.htmlAudio.playbackRate = this.playbackRate;
    }
    if (this.isPlayingState && this.currentTrack?.audioUrl.startsWith('synth://')) {
      this.startSynthLoop();
    }
  }

  public setEqualizerGains(gains: number[]) {
    this.ensureContext();
    gains.forEach((gainDb, index) => {
      if (this.eqFilters[index] && this.ctx) {
        this.eqFilters[index].gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.03);
      }
    });
  }

  public getFrequencyData(targetArray: Uint8Array<ArrayBuffer>): void {
    if (this.analyser && this.isPlayingState) {
      this.analyser.getByteFrequencyData(targetArray);
    } else {
      targetArray.fill(0);
    }
  }

  private stopInternalTimers() {
    if (this.stepTimerId !== null) {
      window.clearInterval(this.stepTimerId);
      this.stepTimerId = null;
    }
    if (this.clockTimerId !== null) {
      window.clearInterval(this.clockTimerId);
      this.clockTimerId = null;
    }
  }

  private getDefaultSynthConfig(): SynthComposition {
    return {
      bpm: 92,
      rootNote: 60,
      chordProgression: [
        [0, 4, 7, 11],
        [-3, 0, 4, 7],
        [-7, -3, 0, 4],
        [-5, -1, 2, 7],
      ],
      melodyPattern: [12, null, 7, 4, null, 9, 7, null, 4, null, 2, 0, null, 4, 7, null],
      bassPattern: [-12, null, null, -12, -15, null, null, -15, -19, null, null, -19, -17, null, -17, null],
      waveType: 'triangle',
      padFilterCutoff: 1500,
      drumStyle: 'indie',
    };
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private startSynthLoop() {
    this.stopInternalTimers();
    if (!this.currentTrack || !this.isPlayingState) return;

    const synth = this.currentTrack.synthConfig || this.getDefaultSynthConfig();
    const effectiveBpm = synth.bpm * this.playbackRate;
    const sixteenthMs = (60 / effectiveBpm / 4) * 1000;

    this.lastTickPerf = performance.now();
    // Anchor the clock to AudioContext time, not performance.now:
    // ctx.currentTime freezes while the context is suspended in
    // background, so the progress bar no longer runs ahead of the
    // (silent) audio, and the track does not end prematurely.
    let lastCtxTime = this.ctx ? this.ctx.currentTime : 0;

    // Trigger first step immediately
    this.triggerSequencerStep(synth);

    this.stepTimerId = window.setInterval(() => {
      if (!this.isPlayingState) return;
      // If the timer was throttled in background, catch up on missed
      // steps instead of silently dropping them.
      if (this.ctx) {
        const stepDurationSec = 60 / (synth.bpm * this.playbackRate) / 4;
        const elapsed = this.ctx.currentTime - lastCtxTime;
        const stepsToPlay = Math.max(
          1,
          Math.min(4, Math.floor(elapsed / stepDurationSec) || 1)
        );
        for (let i = 0; i < stepsToPlay; i++) {
          this.triggerSequencerStep(synth);
        }
      } else {
        this.triggerSequencerStep(synth);
      }
    }, sixteenthMs);

    this.clockTimerId = window.setInterval(() => {
      if (!this.isPlayingState || !this.currentTrack) return;
      if (!this.ctx) return;
      const nowCtx = this.ctx.currentTime;
      const deltaSec = Math.max(0, nowCtx - lastCtxTime) * this.playbackRate;
      lastCtxTime = nowCtx;
      this.lastTickPerf = performance.now();

      this.currentTimeSec += deltaSec;
      if (this.currentTimeSec >= this.currentTrack.durationSec) {
        this.currentTimeSec = 0;
        this.isPlayingState = false;
        this.stopInternalTimers();
        this.onTrackEndCallback?.();
        return;
      }
      this.onTimeUpdateCallback?.(this.currentTimeSec, this.currentTrack.durationSec);
    }, 100);
  }

  private triggerSequencerStep(synth: SynthComposition) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const step16 = this.stepIndex % 16;
    const barIndex = Math.floor(this.stepIndex / 16) % synth.chordProgression.length;
    const stepDurationSec = 60 / (synth.bpm * this.playbackRate) / 4;

    // 1. Warm Polyphonic Pad Chords on beat 0 and beat 8
    if (step16 === 0 || step16 === 8) {
      const chord = synth.chordProgression[barIndex];
      this.playPadChord(
        chord.map((offset) => synth.rootNote + offset),
        now,
        stepDurationSec * 7.5,
        synth.waveType,
        synth.padFilterCutoff
      );
    }

    // 2. Deep Sub-Bass Line
    const bassOffset = synth.bassPattern[step16];
    if (bassOffset !== null && bassOffset !== undefined) {
      this.playBassNote(synth.rootNote + bassOffset, now, stepDurationSec * 2.2);
    }

    // 3. Lead Arpeggio / Melody Note
    const melodyOffset = synth.melodyPattern[step16];
    if (melodyOffset !== null && melodyOffset !== undefined) {
      this.playMelodyNote(
        synth.rootNote + melodyOffset,
        now,
        stepDurationSec * 1.8,
        synth.waveType
      );
    }

    // 4. Studio Drum Groove (Kick, Warm Snare, Hi-Hat)
    this.triggerDrumStep(step16, now, synth.drumStyle);

    this.stepIndex++;
  }

  private playPadChord(
    midiNotes: number[],
    startTime: number,
    duration: number,
    waveType: OscillatorType,
    cutoff: number
  ) {
    if (!this.ctx) return;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, startTime);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.001, startTime);
    env.gain.linearRampToValueAtTime(0.09, startTime + 0.12);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    filter.connect(env);
    env.connect(this.getInputNode());

    midiNotes.forEach((midi) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = waveType;
      osc.frequency.setValueAtTime(this.midiToFreq(midi) * this.playbackRate, startTime);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, startTime);
      osc.connect(filter);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  }

  private playBassNote(midi: number, startTime: number, duration: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(this.midiToFreq(midi) * this.playbackRate, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340, startTime);
    filter.frequency.exponentialRampToValueAtTime(110, startTime + duration);

    env.gain.setValueAtTime(0.001, startTime);
    env.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.getInputNode());

    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  }

  private playMelodyNote(
    midi: number,
    startTime: number,
    duration: number,
    waveType: OscillatorType
  ) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc.type = waveType === 'sawtooth' ? 'triangle' : waveType;
    osc.frequency.setValueAtTime(this.midiToFreq(midi) * this.playbackRate, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, startTime);

    env.gain.setValueAtTime(0.001, startTime);
    env.gain.linearRampToValueAtTime(0.12, startTime + 0.015);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.getInputNode());

    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  }

  private triggerDrumStep(
    step16: number,
    startTime: number,
    style: 'indie' | 'lofi' | 'synthwave' | 'acoustic'
  ) {
    if (!this.ctx) return;

    // Kick on 0, 8 (plus 10 for indie/lofi)
    if (step16 === 0 || step16 === 8 || (style !== 'acoustic' && step16 === 10)) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(135, startTime);
      osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.11);

      env.gain.setValueAtTime(style === 'acoustic' ? 0.16 : 0.32, startTime);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(env);
      env.connect(this.getInputNode());
      osc.start(startTime);
      osc.stop(startTime + 0.24);
    }

    // Snare / Rimshot on 4 and 12
    if (step16 === 4 || step16 === 12) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, startTime);
      osc.frequency.exponentialRampToValueAtTime(85, startTime + 0.09);

      env.gain.setValueAtTime(style === 'acoustic' ? 0.08 : 0.16, startTime);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

      osc.connect(env);
      env.connect(this.getInputNode());
      osc.start(startTime);
      osc.stop(startTime + 0.16);
    }

    // Soft Hi-hat tick on even steps
    if (step16 % 2 === 0) {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const env = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(6800, startTime);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(5200, startTime);

      const accent = step16 % 4 === 2 ? 0.035 : 0.018;
      env.gain.setValueAtTime(accent, startTime);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.045);

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.getInputNode());
      osc.start(startTime);
      osc.stop(startTime + 0.05);
    }
  }
}

export const studioAudioEngine = new StudioAudioEngine();
