import type { Activity, Mode } from './catalog';
import type { Preferences } from './store';
import { say, stopProductAudio } from './audio';

export type Phase = 'idle' | 'speaking' | 'response' | 'waiting' | 'paused' | 'error' | 'done' | 'ended';
export interface PlayerState { phase: Phase; unit: number; frame: number; line: number | null; message: string }
export class LearningPlayer {
  private state: PlayerState;
  private listeners = new Set<() => void>();
  private request = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private deadline = 0;
  private remaining = 0;
  private pausedFrom: Phase = 'idle';
  private sequence: number[] = [];
  private cursor = 0;
  private fullAttempt = false;
  private completed = false;
  private started = false;
  private disposed = false;
  private speakStart = 0;
  constructor(readonly group: Activity[], readonly mode: Mode, private prefs: Preferences,
    initial = { unit: 0, frame: 0 }, private voice = say, private silence = stopProductAudio) {
    this.state = { ...initial, phase: 'idle', line: null, message: '' };
  }
  snapshot = () => this.state;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private update(patch: Partial<PlayerState>) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn());
  }
  private cancel() { this.request++; if (this.timer) clearTimeout(this.timer); this.timer = null; this.silence(); }
  current() { return this.group[this.state.unit]!; }
  frame() { return this.current().frames[this.state.frame]!; }
  private hasNext() { return this.state.frame + 1 < this.current().frames.length || this.state.unit + 1 < this.group.length; }
  configure(prefs: Preferences) {
    this.prefs = prefs;
    if (!prefs.advance && this.state.phase === 'waiting') { this.cancel(); this.update({ phase: 'idle' }); }
  }
  enter(resume: boolean) { if (!resume && this.prefs.auto && this.mode !== 'parent') this.play(); }
  play(line?: number) {
    if (this.disposed || this.state.phase === 'ended') return;
    this.cancel(); this.started = true; this.fullAttempt = line === undefined;
    this.sequence = line === undefined ? this.frame().lines.flatMap((l, i) => this.mode !== 'echo' || l.echo ? [i] : []) : [line];
    this.cursor = 0;
    if (!this.sequence.length) { this.update({ phase: 'error', message: '这页没有可跟读的句子，请返回选择其他方式。' }); return; }
    void this.speakNext();
  }
  private async speakNext() {
    const line = this.sequence[this.cursor], entry = this.frame().lines[line ?? -1];
    if (line === undefined || !entry) { this.failed(); return; }
    const token = this.request;
    this.update({ phase: 'speaking', line, message: '' }); this.speakStart = performance.now();
    let success = false;
    try { success = await this.voice(entry.text); } catch { /* Explicit playback failure below. */ }
    if (token !== this.request || this.disposed) return;
    if (!success) { this.failed(); return; }
    if (this.mode === 'echo') {
      const duration = Math.max(0, performance.now() - this.speakStart);
      const factor = { short: .75, standard: 1, long: 1.5 }[this.prefs.echoPause];
      this.update({ phase: 'response' });
      this.wait(Math.max(3000, Math.min(10000, (duration * 1.2 + 1000) * factor)), () => this.continueSequence());
    } else this.continueSequence();
  }
  private wait(ms: number, action: () => void) {
    const token = this.request; this.deadline = performance.now() + ms;
    this.timer = setTimeout(() => { this.timer = null; if (token === this.request && !this.disposed) action(); }, ms);
  }
  private continueSequence() { this.cursor++; if (this.cursor < this.sequence.length) void this.speakNext(); else this.pageFinished(); }
  private pageFinished() {
    if (this.fullAttempt) this.completed = true;
    this.update({ line: null });
    if (this.mode === 'parent' || !this.completed) { this.update({ phase: 'idle' }); return; }
    if (!this.hasNext()) { this.update({ phase: 'done', message: '这组听完了，可以重听或结束。' }); return; }
    if (this.prefs.advance && this.started) this.schedulePage();
    else this.update({ phase: 'idle' });
  }
  private schedulePage() {
    this.update({ phase: 'waiting', message: '本页听完，闲置5秒后到下一张。' });
    this.wait(5000, () => {
      if (typeof document !== 'undefined' && document.hidden) { this.pause(); return; }
      this.move(1, true);
    });
  }
  interact() { if (this.state.phase === 'waiting') { this.cancel(); this.schedulePage(); } }
  pause() {
    if (['ended', 'paused', 'idle', 'done', 'error'].includes(this.state.phase)) return;
    this.pausedFrom = this.state.phase; this.remaining = Math.max(0, this.deadline - performance.now());
    this.cancel(); this.update({ phase: 'paused', message: '已暂停，点继续。' });
  }
  resume() {
    if (this.state.phase !== 'paused') return;
    if (this.pausedFrom === 'response') { this.update({ phase: 'response' }); this.wait(this.remaining, () => this.continueSequence()); }
    else if (this.pausedFrom === 'waiting') { if (this.prefs.advance) this.schedulePage(); else this.update({ phase: 'idle' }); }
    else void this.speakNext(); // A stopped local TTS sentence is replayed, not falsely resumed mid-word.
  }
  nextLine() {
    this.cancel(); this.fullAttempt = false; this.completed = false;
    const eligible = this.frame().lines.flatMap((l, i) => this.mode !== 'echo' || l.echo ? [i] : []);
    const next = eligible.find(i => i > (this.state.line ?? -1));
    if (next === undefined) { this.update({ phase: 'idle', line: null, message: '这次练习到这里。可重听本页或结束。' }); return; }
    this.sequence = eligible.filter(i => i >= next); this.cursor = 0; void this.speakNext();
  }
  move(direction: 1 | -1, auto = false) {
    let { unit, frame } = this.state;
    frame += direction;
    if (frame >= this.current().frames.length) { unit++; frame = 0; }
    if (frame < 0) { unit--; frame = this.group[unit]?.frames.length ? this.group[unit]!.frames.length - 1 : 0; }
    if (!this.group[unit]?.frames[frame]) return;
    this.cancel(); this.completed = false; this.fullAttempt = false;
    this.update({ unit, frame, line: null, phase: 'idle', message: '' });
    if (auto) this.play();
  }
  failed(message = '这句暂时无法播放，请重试。没有将失败计为播放完成。') {
    this.cancel(); this.fullAttempt = false; this.update({ phase: 'error', message });
  }
  end() { this.cancel(); this.update({ phase: 'ended', line: null }); }
  activate() { this.disposed = false; }
  dispose() { this.cancel(); this.disposed = true; }
}
