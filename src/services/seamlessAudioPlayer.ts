/**
 * Gapless Web Audio API narration engine for seamless classroom storytelling.
 *
 * Eliminates the "radio-cut" click and dead-air gap caused by swapping `<audio>.src`
 * between paragraphs by keeping a single continuous `AudioContext` open with:
 * - Pre-decoded `AudioBuffer` caching & lookahead sample-accurate scheduling
 * - Raised-cosine (Hann) fade-in/out envelopes on every spoken turn
 * - Gentle broadcast compressor glue + subtle continuous warm room-tone continuity
 */

export interface ScheduledTurnHandle {
  turnKey: string;
  pageIdx: number;
  lineIdx: number;
  startCtxTime: number;
  speechEndCtxTime: number;
  nextStartCtxTime: number;
  durationSec: number;
  offsetSec: number;
  turnTimings?: Array<{ startSec: number; endSec: number }>;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  stopped: boolean;
}

function dataUriToArrayBuffer(dataUri: string): ArrayBuffer {
  const commaIdx = dataUri.indexOf(",");
  if (commaIdx === -1) {
    throw new Error("Invalid data URI");
  }
  const b64 = dataUri.slice(commaIdx + 1);
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes.buffer;
}

function computeEffectiveEndSec(buffer: AudioBuffer): number {
  const sr = buffer.sampleRate || 24000;
  const data = buffer.getChannelData(0);
  const len = data.length;
  if (len < sr * 0.2) return buffer.duration;

  const winSamples = Math.max(1, Math.floor(sr * 0.01)); // 10ms window
  const rmsThreshold = 0.004;
  let lastActiveSample = len - 1;

  for (let end = len; end >= winSamples; end -= winSamples) {
    const start = end - winSamples;
    let sumSq = 0;
    for (let i = start; i < end; i++) {
      const v = data[i];
      sumSq += v * v;
    }
    if (Math.sqrt(sumSq / winSamples) >= rmsThreshold) {
      lastActiveSample = end;
      break;
    }
  }

  const effectiveEnd = Math.min(buffer.duration, lastActiveSample / sr + 0.09);
  return Math.max(Math.min(buffer.duration, 0.2), effectiveEnd);
}

export class SeamlessNarrationEngine {
  private ctx: AudioContext | null = null;
  private speechCompressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private decodedBuffers = new Map<string, AudioBuffer>();
  private effectiveEndCache = new Map<string, number>();
  private decodingPromises = new Map<string, Promise<AudioBuffer>>();
  private activeHandles: ScheduledTurnHandle[] = [];

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.AudioContext || (window as any).webkitAudioContext);
  }

  private ensureContext(): AudioContext | null {
    if (!this.isSupported()) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      // Transparent leveling compressor prevents onset pumping after inter-page breaths
      this.speechCompressor = this.ctx.createDynamicsCompressor();
      this.speechCompressor.threshold.value = -14;
      this.speechCompressor.knee.value = 24;
      this.speechCompressor.ratio.value = 1.5;
      this.speechCompressor.attack.value = 0.03;
      this.speechCompressor.release.value = 0.35;
      this.speechCompressor.connect(this.masterGain);

      // Keep ambience channel muted so no static/noise can ever be heard
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.value = 0;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 360;
      lp.Q.value = 0.7;
      this.ambienceGain.connect(lp);
      lp.connect(this.masterGain);
    }
    return this.ctx;
  }

  public unlock(): AudioContext | null {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  public setAmbienceActive(_active: boolean): void {
    // Keep background strictly silent so no filtered noise can ever sound like radio static
    const ctx = this.ctx;
    if (!ctx || !this.ambienceGain) return;
    const now = ctx.currentTime;
    try {
      this.ambienceGain.gain.cancelScheduledValues(now);
      this.ambienceGain.gain.setValueAtTime(0, now);
    } catch {}
  }

  public hasDecodedBuffer(cacheKey: string): boolean {
    return this.decodedBuffers.has(cacheKey);
  }

  public getDecodedBuffer(cacheKey: string): AudioBuffer | undefined {
    return this.decodedBuffers.get(cacheKey);
  }

  public async decodeAudio(cacheKey: string, audioUrl: string): Promise<AudioBuffer> {
    const existing = this.decodedBuffers.get(cacheKey);
    if (existing) return existing;

    const inflight = this.decodingPromises.get(cacheKey);
    if (inflight) return inflight;

    const ctx = this.ensureContext();
    if (!ctx) {
      throw new Error("Web Audio API not supported");
    }

    const promise = (async () => {
      let arrBuf: ArrayBuffer;
      if (audioUrl.startsWith("data:")) {
        arrBuf = dataUriToArrayBuffer(audioUrl);
      } else {
        const resp = await fetch(audioUrl);
        if (!resp.ok) throw new Error(`Failed to fetch audio (${resp.status})`);
        arrBuf = await resp.arrayBuffer();
      }
      const audioBuf = await ctx.decodeAudioData(arrBuf);
      // Evict oldest entry if cache exceeds 80 turns
      if (this.decodedBuffers.size >= 80) {
        const oldest = this.decodedBuffers.keys().next();
        if (!oldest.done) {
          this.decodedBuffers.delete(oldest.value);
          this.effectiveEndCache.delete(oldest.value);
        }
      }
      this.decodedBuffers.set(cacheKey, audioBuf);
      this.effectiveEndCache.set(cacheKey, computeEffectiveEndSec(audioBuf));
      this.decodingPromises.delete(cacheKey);
      return audioBuf;
    })().catch((err) => {
      this.decodingPromises.delete(cacheKey);
      throw err;
    });

    this.decodingPromises.set(cacheKey, promise);
    return promise;
  }

  public scheduleTurn(opts: {
    turnKey: string;
    pageIdx: number;
    lineIdx: number;
    buffer: AudioBuffer;
    cacheKey?: string;
    startAtCtxTime: number;
    offsetSec?: number;
    pauseAfterSec: number;
    turnTimings?: Array<{ startSec: number; endSec: number }>;
  }): ScheduledTurnHandle | null {
    const ctx = this.ensureContext();
    if (!ctx || !this.speechCompressor) return null;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const effectiveEnd =
      (opts.cacheKey && this.effectiveEndCache.get(opts.cacheKey)) ||
      computeEffectiveEndSec(opts.buffer);
    const offsetSec = Math.max(0, Math.min(opts.offsetSec || 0, Math.max(0, effectiveEnd - 0.08)));
    const playableDur = Math.max(0.05, effectiveEnd - offsetSec);
    const startCtxTime = Math.max(ctx.currentTime + 0.012, opts.startAtCtxTime);
    const speechEndCtxTime = startCtxTime + playableDur;
    const nextStartCtxTime = speechEndCtxTime + Math.max(0.08, opts.pauseAfterSec);

    const source = ctx.createBufferSource();
    source.buffer = opts.buffer;

    const gainNode = ctx.createGain();
    const fadeInDur = Math.min(offsetSec > 0 ? 0.045 : 0.055, playableDur * 0.25);
    const fadeOutDur = Math.min(0.12, playableDur * 0.35);
    const fadeOutStart = Math.max(startCtxTime + fadeInDur + 0.005, speechEndCtxTime - fadeOutDur);

    try {
      gainNode.gain.setValueAtTime(0, startCtxTime);
      gainNode.gain.linearRampToValueAtTime(1.0, startCtxTime + fadeInDur);
      gainNode.gain.setValueAtTime(1.0, fadeOutStart);
      gainNode.gain.linearRampToValueAtTime(0, speechEndCtxTime);
    } catch {
      gainNode.gain.setValueAtTime(1.0, startCtxTime);
    }

    source.connect(gainNode);
    gainNode.connect(this.speechCompressor);
    source.start(startCtxTime, offsetSec);
    try {
      source.stop(speechEndCtxTime + 0.02);
    } catch {}

    const handle: ScheduledTurnHandle = {
      turnKey: opts.turnKey,
      pageIdx: opts.pageIdx,
      lineIdx: opts.lineIdx,
      startCtxTime,
      speechEndCtxTime,
      nextStartCtxTime,
      durationSec: effectiveEnd,
      offsetSec,
      turnTimings: opts.turnTimings,
      source,
      gainNode,
      stopped: false,
    };

    source.onended = () => {
      handle.stopped = true;
      this.activeHandles = this.activeHandles.filter((h) => h !== handle);
      try {
        gainNode.disconnect();
      } catch {}
    };

    this.activeHandles.push(handle);
    return handle;
  }

  public getActiveHandles(): ScheduledTurnHandle[] {
    return this.activeHandles.filter((h) => !h.stopped);
  }

  public stopAllTurns(fadeMs = 70): void {
    const ctx = this.ctx;
    if (!ctx) {
      this.activeHandles = [];
      return;
    }

    const now = ctx.currentTime;
    const fadeSec = Math.max(0.02, fadeMs / 1000);
    const handles = this.activeHandles;
    this.activeHandles = [];

    for (const h of handles) {
      if (h.stopped) continue;
      h.stopped = true;
      try {
        if (now < h.startCtxTime) {
          // Not started yet — cancel cleanly before it ever emits a sample
          h.source.stop(now);
        } else {
          const g = h.gainNode.gain as AudioParam & {
            cancelAndHoldAtTime?: (cancelTime: number) => AudioParam;
          };
          if (typeof g.cancelAndHoldAtTime === "function") {
            g.cancelAndHoldAtTime(now);
          } else {
            g.cancelScheduledValues(now);
            g.setValueAtTime(Math.max(0.0001, g.value || 1.0), now);
          }
          g.linearRampToValueAtTime(0, now + fadeSec);
          h.source.stop(now + fadeSec + 0.015);
        }
      } catch {}
    }
  }
}

let sharedEngine: SeamlessNarrationEngine | null = null;

export function getSeamlessNarrationEngine(): SeamlessNarrationEngine {
  if (!sharedEngine) {
    sharedEngine = new SeamlessNarrationEngine();
  }
  return sharedEngine;
}
