import { useState } from 'react';
import { readCatalog } from '../content/catalog';
import { clearProgress, loadProgress, storePosition, storeBookmark } from '../services/playbackStore';
import { resumePosition } from '../domain/playbackProgress';
const catalog=readCatalog();
const MEDIA=catalog.ok?catalog.data.flatMap(t=>t.tasks.flatMap(task=>task.steps.map(step=>({id:step.audio.path,title:task.title_zh+' · '+step.title_zh})))):[];
export function PlaybackPanel() {
 const [media,setMedia]=useState(MEDIA[0]?.id??'');
 const [items,setItems]=useState(()=>loadProgress());
 const [notice,setNotice]=useState('');
 const mine=items.find(p=>p.media_id===media);
 const resume=mine?resumePosition(mine):0;
 const persist=(audio:HTMLAudioElement)=>{
   const result=storePosition(media,audio.currentTime,Number.isFinite(audio.duration)?audio.duration:null);
   if(result.ok){setItems(result.data);setNotice('播放位置已保存在本机。');}else setNotice(result.error.message);
 };
 return <section className="card" aria-label="播放进度与书签"><h2>继续听，或从头播放</h2><p>这里只保存听到哪里，不代表听懂，不进入学习表现记录。</p>
 <label>选择音频<select value={media} onChange={e=>{setMedia(e.target.value);setNotice('');}}>{MEDIA.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
 <audio key={media} controls preload="metadata" src={media} onLoadedMetadata={e=>{e.currentTarget.currentTime=resume;}} onPause={e=>persist(e.currentTarget)} onEnded={e=>persist(e.currentTarget)} onTimeUpdate={e=>{if(Math.abs(e.currentTarget.currentTime-(mine?.position_sec??0))>=2)persist(e.currentTarget);}} onError={()=>setNotice('这段音频暂时无法播放，请返回活动按文字带领。')}>当前设备不支持播放器，可以按活动文字带领。</audio>
 <p>已保存位置：{resume.toFixed(1)}秒</p><button type="button" onClick={()=>{const result=storeBookmark(media);if(result.ok){setItems(result.data);setNotice('书签已更新。');}else setNotice(result.error.message);}}>{mine?.bookmarked?'取消书签':'加书签'}</button>
 <p role="status">{notice}</p><h3>书签列表</h3>{items.some(p=>p.bookmarked)?<ul>{items.filter(p=>p.bookmarked).map(p=><li key={p.media_id}><button type="button" onClick={()=>setMedia(p.media_id)}>{MEDIA.find(m=>m.id===p.media_id)?.title??'此前音频'} · {p.position_sec.toFixed(1)}秒</button></li>)}</ul>:<p>还没有书签，播放时可以加一个。</p>}
 <details><summary>清空播放进度</summary><p>只移除播放位置和书签，不影响学习记录。</p><button type="button" onClick={()=>{const result=clearProgress();if(result.ok){setItems([]);setNotice('播放进度和书签已清空。');}else setNotice(result.error.message);}}>确认清空播放进度</button></details></section>;
}
