import { useEffect, useRef, useState } from 'react';
import { cancelSpeech, speak } from '../services/tts';
import { SpeakerIcon } from './SpeakerIcon';

export function AudioPhrase({text,label}:{text:string;path?:string|null|undefined;label?:string}) {
 const [status,setStatus]=useState<'ready'|'playing'|'failed'>('ready');
 const request=useRef(0);
 useEffect(()=>()=>{request.current++;cancelSpeech();},[text]);
 const play=async()=>{
  const id=++request.current;
  cancelSpeech();setStatus('playing');
  const result=await speak(text);
  if(id===request.current)setStatus(result.ok?'ready':'failed');
 };
 return <span className="audio-phrase"><span className="spoken-line"><button className="speaker-button" type="button" onClick={()=>void play()} aria-label={label??`播放 ${text}`} aria-busy={status==='playing'} title={label??`播放 ${text}`}><SpeakerIcon/></button><span className="spoken-text" lang="en-US">{text}</span></span><span role="status" className={status==='failed'?'audio-error':'sr-only'}>{status==='playing'?'正在播放':status==='failed'?'暂时没有声音，可以照文字说。':''}</span></span>;
}
