import { cancelSpeech, speak } from './tts';
import { releaseCourseUrl } from '../security/courseVault';

/** One cancellable session: pause holds audio, speech and every inter-line/page wait. */
export class CoursePlayback {
  token = 0;
  paused = false;
  private audio: HTMLAudioElement | null = null;
  private finish: ((ok: boolean) => void) | null = null;
  private speech = false;
  cancel() {
    this.token++; this.paused = false;
    this.finish?.(false); this.finish = null;
    this.audio?.pause(); if (this.audio) { releaseCourseUrl(this.audio.src); this.audio.src = ''; }
    this.audio = null; this.speech = false; cancelSpeech();
  }
  pause() { this.paused = true; this.audio?.pause(); if (this.speech) window.speechSynthesis?.pause(); }
  resume() { this.paused = false; if (this.audio) void this.audio.play().catch(() => this.finish?.(false)); if (this.speech) window.speechSynthesis?.resume(); }
  async wait(ms: number, token: number) {
    let remaining = ms;
    while (token === this.token && (remaining > 0 || this.paused)) {
      await new Promise(resolve => window.setTimeout(resolve, 100));
      if (!this.paused) remaining -= 100;
    }
    return token === this.token;
  }
  async play(url: string, token: number, rate = 1) {
    if (!await this.wait(0, token)) { releaseCourseUrl(url); return false; }
    return await new Promise<boolean>(resolve => {
      const audio = new Audio(url); this.audio = audio; audio.playbackRate = rate;
      const end = (ok: boolean) => { releaseCourseUrl(url); if (this.audio === audio) { this.audio = null; this.finish = null; } resolve(ok); };
      this.finish = end; audio.onended = () => end(true); audio.onerror = () => end(false); audio.onabort = () => end(false);
      void audio.play().catch(() => end(false));
    });
  }
  async say(text: string, token: number) {
    if (!await this.wait(0, token)) return false;
    this.speech = true; const result = await speak(text); this.speech = false;
    return result.ok && await this.wait(0, token);
  }
}
