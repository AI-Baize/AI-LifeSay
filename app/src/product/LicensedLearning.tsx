import {useCallback,useEffect,useRef,useState} from 'react';
import {Link,useParams,useSearchParams} from 'react-router-dom';
import {SpeakerIcon} from '../components/SpeakerIcon';
import {ParentDisclosure} from '../components/ParentDisclosure';
import {CoursePlayback} from '../services/coursePlayback';
import {useProductStore} from './store';
import {openFormalRuntime} from '../security/formalLevelImport';
import type {RuntimeFrame,RuntimeLine} from '../security/formalRuntimeSchema';
import './formal-learning.css';
type Opened=Awaited<ReturnType<typeof openFormalRuntime>>;
type Mode='parent'|'echo'|'child'|'read';
export default function LicensedLearning(){
 const [query]=useSearchParams();const listening=query.get('listen')==='1';
 const {id=''}=useParams();const [opened,setOpened]=useState<Opened|null>(null);const [error,setError]=useState('');const [image,setImage]=useState<{page:number;url:string}|null>(null);const [page,setPage]=useState(0);const [mode,setMode]=useState<Mode>('parent');const [paused,setPaused]=useState(false);const [playing,setPlaying]=useState(false);const [notice,setNotice]=useState('');const [player]=useState(()=>new CoursePlayback());const active=useRef(true);const autoStarted=useRef(false);const prefs=useProductStore(s=>s.data.prefs);const frame=opened?.lesson.frames[page];
 useEffect(()=>{let live=true;active.current=true;openFormalRuntime(id).then(x=>{if(live)setOpened(x);}).catch(e=>{if(live)setError(e instanceof Error?e.message:'课程暂时无法读取');});return()=>{live=false;active.current=false;player.cancel();};},[id,player]);
 useEffect(()=>{if(!opened||!frame)return;let live=true;let url='';opened.media(frame.image).then(x=>{url=x;if(live)setImage({page,url:x});else URL.revokeObjectURL(x);}).catch(()=>{if(live)setNotice('图片暂时无法读取。');});return()=>{live=false;if(url)URL.revokeObjectURL(url);};},[opened,frame,page]);
 const stop=useCallback(()=>{player.cancel();setPlaying(false);setPaused(false);},[player]);
 const playLine=useCallback(async(line:RuntimeLine,token:number)=>{if(!opened)return false;const url=await opened.media(line.audio);if(token!==player.token){URL.revokeObjectURL(url);return false;}return player.play(url,token);},[opened,player]);
 const playFrame=useCallback(async(target:RuntimeFrame,chosen:Mode,startIndex:number)=>{stop();const token=player.token;setPlaying(true);setNotice('');try{
  let current=target;let index=startIndex;
  while(token===player.token){for(const line of current.lines){if(!await playLine(line,token))return;if(chosen==='echo'&&!await player.wait(prefs.echoPause==='short'?900:prefs.echoPause==='long'?2200:1500,token))return;}
   if((chosen!=='echo'&&!listening)||!opened||index>=opened.lesson.frames.length-1||!await player.wait(1500,token))break;
   const next=opened.lesson.frames[++index];if(!next||!active.current)return;setPage(index);current=next;
  }
  if(token===player.token)setPlaying(false);
 }catch{if(token===player.token){setPlaying(false);setNotice('音频暂时无法播放，请重试。');}}},[opened,playLine,player,stop,prefs.echoPause,listening]);
 useEffect(()=>{if(!opened||!frame||autoStarted.current||(!prefs.auto&&!listening))return;autoStarted.current=true;void playFrame(frame,'parent',0);},[opened,frame,prefs.auto,playFrame,listening]);
 const one=async(line:RuntimeLine)=>{stop();const token=player.token;setPlaying(true);try{await playLine(line,token);}catch{setNotice('音频暂时无法播放，请重试。');}if(token===player.token)setPlaying(false);};
 if(error)return <section><h1>课程暂不可用</h1><p role="alert">{error}</p><Link to="/settings/resources">返回课程资源</Link></section>;
 if(!opened||!frame)return <section><h1>正在读取课程</h1></section>;
 function selectMode(next:Mode){stop();setMode(next);setPage(0);if(next!=='read')void playFrame(opened!.lesson.frames[0]!,next,0);}
 function changePage(next:number){stop();setPage(next);if(mode!=='read')void playFrame(opened!.lesson.frames[next]!,mode,next);}
 return <section className="formal-scene"><Link to="/settings/resources">返回课程资源</Link><h1>{opened.lesson.title}</h1><div className="formal-mode-row" aria-label="学习方式">{([['parent','带着做'],['echo','跟读'],['child','点读'],['read','自己读']] as const).map(([v,label])=><button key={v} aria-pressed={mode===v} onClick={()=>selectMode(v)}>{label}</button>)}</div><p>第 {page+1} / {opened.lesson.frames.length} 张</p>{mode==='read'?<div className="formal-picture">{image?.page===page&&<img src={image.url} alt={`${opened.lesson.title}，第${page+1}张图片`}/>}</div>:<button className="formal-picture" aria-label="按顺序播放当前图片中的语句" onClick={()=>void playFrame(frame,mode,page)}>{image?.page===page&&<img src={image.url} alt={`${opened.lesson.title}，第${page+1}张图片`}/>}</button>}<div className="formal-dialogue" role="list" aria-label="当前图片对应的英语语句">{frame.lines.map((line,i)=><button key={i} className="formal-line" onClick={()=>void one(line)}><SpeakerIcon/><span><span lang="en-US">{line.text_en}</span>{mode==='parent'&&<span className="formal-translation">{line.text_zh}</span>}</span></button>)}</div><p role="status">{paused?'已暂停':notice||(playing?'正在播放':'')}</p><div className="formal-frame-controls"><button disabled={page===0} onClick={()=>changePage(page-1)}>上一张</button><button disabled={page>=opened.lesson.frames.length-1} onClick={()=>changePage(page+1)}>下一张</button><button onClick={()=>{if(paused){player.resume();setPaused(false);}else{player.pause();setPaused(true);}}}>{paused?'继续':'暂停'}</button></div><ParentDisclosure title="看看这次怎么带"><p>家长可以陪孩子一起看图、听一听，不要求跟说。点读、翻页与结束不生成能力成绩。</p></ParentDisclosure><Link className="formal-finish" to="/settings/resources" onClick={stop}>结束课程</Link></section>;
}
