import { fail, ok, type Result } from '../content/types';
import { speak } from './tts';

// CR-11：本机音频播放。
//
// 约束：
// - 优先播放已落盘的本地 en-US 合成音频（离线可用，不依赖云声线，G08-08）。
// - 音频缺失或不可解码时，回退到本机声线朗读；再不行则由家长按文字带领。
// - 这些音频为本机 TTS 合成，**不是人类母语者录音**，不构成母语者审校证据。

let current: HTMLAudioElement | null = null;
let finishCurrent: (()=>void)|null=null;
let generation=0;

const audioSupported = (): boolean =>
  typeof window !== 'undefined' && typeof window.Audio === 'function';

export function cancelAudio(): void {
  generation++;
  const previous=current,finish=finishCurrent;
  current=null;finishCurrent=null;
  if(previous){try{previous.pause();}catch{/* 本机播放器已不可用 */}}
  finish?.();

}

/** 播放单个本地音频文件。失败返回 UNSUPPORTED，交由上层回退。 */
export function playAudio(path: string): Promise<Result<null>> {
  cancelAudio();
  if (!audioSupported()) return Promise.resolve(fail('UNSUPPORTED', '本机音频不可用，请按文字带领'));
  return new Promise(resolve => {
    let settled = false;
    const el = new window.Audio(path);
    current = el;
    const done = (r: Result<null>) => {
      if (settled) return;
      settled = true;
      if (current === el) { current = null; finishCurrent=null; }
      resolve(r);
    };
    finishCurrent=()=>done(ok(null));
    el.onended = () => done(ok(null));
    el.onerror = () => done(fail('UNSUPPORTED', '音频不可用，请按文字带领'));
    try {
      const p = el.play();
      if (p && typeof p.catch === 'function')
        p.catch(() => done(fail('UNSUPPORTED', '音频不可用，请按文字带领')));
    } catch {
      done(fail('UNSUPPORTED', '音频不可用，请按文字带领'));
    }
  });
}

/** 步骤播放：本地 mp3 优先，失败回退本机声线朗读。 */
export async function playStepAudio(path: string, text: string): Promise<Result<null>> {
  const pending=playAudio(path);
  const request=generation;
  const local = await pending;
  if (local.ok || request!==generation) return ok(null);
  return speak(text);
}
