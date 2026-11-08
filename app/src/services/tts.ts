import { fail, ok, type Result } from '../content/types';
export type SpeechStatus = 'loading' | 'ready' | 'speaking' | 'text';
let token=0;
let finishPending: (()=>void)|null=null;
let pinnedVoiceURI: string | null = null;
export interface SpeechStyle { rate?: number; pitch?: number }
const voicePreference = [/zira/i, /samantha/i, /aria/i, /jenny/i, /ava/i, /google.*(female|us english)/i];
const supported=()=>typeof window!=='undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
export async function readVoices(): Promise<Result<SpeechSynthesisVoice[]>> {
 if(!supported()) return fail('UNSUPPORTED','本机朗读不可用，请按文字带领');
 try {
  const synth=window.speechSynthesis;
  let voices=synth.getVoices().filter(v=>v.lang==='en-US' && v.localService);
  if(!voices.length) await new Promise<void>(resolve=>{
   // 2秒为待实测等待预算；未发现本机声线时不调用云服务。
   const finish=()=>{clearTimeout(timer);synth.removeEventListener('voiceschanged',changed);resolve();};
   const changed=()=>{if(synth.getVoices().some(v=>v.lang==='en-US' && v.localService)) finish();};
   const timer=setTimeout(finish,2000);synth.addEventListener('voiceschanged',changed);
  });
  voices=synth.getVoices().filter(v=>v.lang==='en-US' && v.localService);
  if (!voices.length) return fail('UNSUPPORTED','没有可用的本机美式声线，请按文字带领');
  if (pinnedVoiceURI && voices.some(v=>v.voiceURI===pinnedVoiceURI)) {
   voices=[voices.find(v=>v.voiceURI===pinnedVoiceURI)!];
  } else {
   const preferred=voicePreference.map(pattern=>voices.find(v=>pattern.test(v.name))).find(Boolean);
   const selected=preferred ?? [...voices].sort((a,b)=>(a.name ?? '').localeCompare(b.name ?? ''))[0]!;
   pinnedVoiceURI=selected.voiceURI;
   voices=[selected];
  }
  return ok(voices);
 } catch { return fail('UNSUPPORTED','无法读取本机声线，请按文字带领'); }
}
export function cancelSpeech():void { token++; finishPending?.(); finishPending=null; if(supported()) window.speechSynthesis.cancel(); }
export async function speak(text:string, style: SpeechStyle = {}):Promise<Result<null>> {
 cancelSpeech(); const current=token;
 const result=await readVoices();
 if(!result.ok) return result;
 if(current!==token) return ok(null);
 const voice=result.data[0];if(!voice) return fail('UNSUPPORTED','请按文字带领');
 return new Promise(resolve=>{
  const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.voice=voice;
  utterance.rate=Math.min(1.1,Math.max(0.65,style.rate ?? 0.88));
  utterance.pitch=Math.min(1.2,Math.max(0.85,style.pitch ?? 1));
  finishPending=()=>resolve(ok(null));
  utterance.onend=()=>{if(current===token)finishPending=null;resolve(ok(null));};
  utterance.onerror=()=>resolve(current!==token ? ok(null) : fail('UNSUPPORTED','朗读中断，请按文字带领'));
  try { window.speechSynthesis.speak(utterance); } catch { resolve(fail('UNSUPPORTED','朗读不可用，请按文字带领')); }
 });
}
