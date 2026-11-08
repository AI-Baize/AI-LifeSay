import { Link, useParams,useSearchParams } from 'react-router-dom';
import { useCourseIndex, courseAssetBase } from './formalCourseData';
import { encryptedCourses } from '../security/courseVault';
import { CourseImage } from '../security/CourseImage';
import { playways } from './playways';
import { useProductStore } from './store';
import { useState,lazy,Suspense } from 'react';
const SceneDirectory=lazy(()=>import('./FormalLearning').then(m=>({default:m.FormalCourseListPage})));
import './formal-learning.css';

export function HomePlayways() {
  const { index, error } = useCourseIndex();
  const age = useProductStore(s => s.data.prefs.age);
  const [preview, setPreview] = useState(false);
  const [query,setQuery]=useSearchParams();
  const search=(query.get('q')??'').trim().toLocaleLowerCase();
  const setSearch=(q:string)=>setQuery(current=>{const next=new URLSearchParams(current);if(q)next.set('q',q);else next.delete('q');return next;});
  if (!['A02', 'A03'].includes(age) && !preview) return <section><p>当前兴趣年龄暂无对应内容。现有玩法与场景适合3–6岁。</p><button onClick={() => setPreview(true)}>查看3–6岁首期内容</button></section>;
  if (error) return <section><p role="alert">{error}</p>{encryptedCourses && <Link to="/settings/course-access">课程授权与下载</Link>}</section>;
  if (!index) return <p>正在读取玩法…</p>;
  if (!index.runtime_gate.runtime_enabled) return <p>课程暂未开放。</p>;
  const availableWays = playways.filter(way => way.mode !== 'rhyme' || (index.listening_programs ?? []).some(program => program.kind === 'rhyme' && (way.scenes as readonly string[]).includes(program.scene_id)));
  const matches = availableWays.filter(way => !search || [way.title, way.description, way.materials, ...way.steps, ...index.scenes.filter(scene => (way.scenes as readonly string[]).includes(scene.scene_id)).flatMap(scene => [scene.title, scene.scene_id, ...scene.dialogue_lines.map(line => line.text_en), ...index.word_cards.filter(card => card.source_scenes.includes(scene.scene_id)).map(card => card.word_en)])].some(value => value.toLocaleLowerCase().includes(search)));
  return <section className="home-playways"><h1>选个玩法</h1><p className="product-muted">同一场景，换种方式玩。</p><form className="course-search" role="search" onSubmit={event => { event.preventDefault(); setSearch(String(new FormData(event.currentTarget).get('q') ?? '').trim().toLocaleLowerCase()); }}><label htmlFor="playway-query">找玩法或课程</label><div className="course-search-field"><input key={query.get("q")??""} defaultValue={query.get("q")??""} id="playway-query" name="q" type="search" placeholder="输入玩法、场景或单词"/><button type="submit">搜索</button></div></form><div className="formal-grid">{matches.map(way => {
    const scene = index.scenes.find(s => (way.scenes as readonly string[]).includes(s.scene_id));
    const cover = index.event_frames.find(f => f.scene_id === scene?.scene_id)?.image;
    return scene && cover ? <Link className="formal-card" to={`/play/${way.id}`} key={way.id}><CourseImage src={`${courseAssetBase}${cover}`} alt="" loading="lazy"/><strong>{way.title}</strong><span>{way.description}</span></Link> : null;
  })}</div>{!matches.length && <p role="status">没有找到匹配的玩法，可在下方查看场景搜索结果。</p>}<Suspense fallback={<p>读取场景…</p>}><SceneDirectory title="按场景找内容" showSearch={false}/></Suspense><Link className="button-link" to="/today">返回首页</Link></section>;
}
export default function PlaywayPage() {
  const { playId } = useParams(); const { index, error } = useCourseIndex();
  const way = playways.find(item => item.id === playId);
  if (error) return <section><p role="alert">{error}</p>{encryptedCourses && <Link to="/settings/course-access">课程授权与下载</Link>}</section>;
  if (!index) return <p>正在读取玩法…</p>;
  if (!way) return <section><h1>没有找到这个玩法</h1><Link to="/today">返回首页</Link></section>;
  const scenes = index.scenes.filter(s => (way.scenes as readonly string[]).includes(s.scene_id) && (way.mode !== 'rhyme' || (index.listening_programs ?? []).some(program => program.kind === 'rhyme' && program.scene_id === s.scene_id))); 
  return <section><Link to="/learn">返回玩法</Link><h1>{way.title}</h1><p>准备：{way.materials}</p><ol>{way.steps.map(step => <li key={step}>{step}</li>)}</ol><h2>选一个场景开始</h2>{!scenes.length && <p role="status">这个玩法对应的内容还在准备中。</p>}<div className="formal-grid">{scenes.map(scene => {
    const cover = index.event_frames.find(f => f.scene_id === scene.scene_id)?.image;
    return <Link key={scene.scene_id} className="formal-card" to={way.mode === 'rhyme' ? `/listen?kind=rhyme&scene=${scene.scene_id}` : `/courses/${scene.scene_id}?mode=${way.mode}&origin=play&play=${way.id}`}><CourseImage src={`${courseAssetBase}${cover}`} alt=""/><strong>{scene.title}</strong></Link>;
  })}</div><p className="product-muted">玩法只组织练习，不更改课程能力合同，不自动生成观察成绩。</p></section>;
}
