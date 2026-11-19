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
          // External stream unreachable - stop quietly without synth noise
          this.isPlayingState = false;
        });
      }

      this.htmlAudio.src = track.audioUrl;
      this.htmlAudio.playbackRate = this.playbackRate;
      this.htmlAudio.volume = this.isMuted ? 0 : this.volume;
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
      return;
    } else if (this.htmlAudio) {
      this.htmlAudio.playbackRate = this.playbackRate;
      this.htmlAudio.play().catch(() => {});
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
    if (this.htmlAudio) {
      this.htmlAudio.volume = this.isMuted ? 0 : this.volume;
    }
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
    if (this.htmlAudio) {
      this.htmlAudio.volume = this.isMuted ? 0 : this.volume;
    }
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
    // Synthesizer completely neutralized
  }

  private triggerSequencerStep(_synth: SynthComposition) {
    // Synthesizer completely neutralized
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
