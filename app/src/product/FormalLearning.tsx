import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ParentDisclosure } from '../components/ParentDisclosure';
import { ChevronIcon, DisclosureCue } from '../components/DisclosureCue';
import { SpeakerIcon } from '../components/SpeakerIcon';
import { cancelAudio } from '../services/audio';
import { cancelSpeech } from '../services/tts';
import { CoursePlayback } from '../services/coursePlayback';
import { useProductStore } from './store';
import { StartingPointControl } from './HomePreferences';
import { useCourseIndex, courseAssetBase as assetBase, formalPackageBase as packageBase, type FormalLine, type WordCard } from './formalCourseData';
import { CourseImage } from '../security/CourseImage';
import { courseResourceUrl, encryptedCourses, releaseCourseUrl } from '../security/courseVault';
import './formal-learning.css';

const initialGroups = ['C01', 'C02', 'C03'];
const noInterests:string[]=[];
const branchNames: Record<string, string> = { common: '共同开场', cat: '猫', dog: '狗', bird: '鸟', yes: '愿意', no: '暂不分享' };
const modes = [
  { id: 'parent', label: '带着做' },
  { id: 'echo', label: '跟读' },
  { id: 'child', label: '点读' },
  { id: 'read', label: '自己读' }
] as const;

export function FormalCourseListPage({ embedded = false, title = '学习',showSearch=true }: { embedded?: boolean; title?: string;showSearch?:boolean }) {
  const { index, error,catalogNotice } = useCourseIndex();
  const [query, setQuery] = useSearchParams();
  const { pathname } = useLocation();
  const age = useProductStore(state => state.data.prefs.age);
  const interests=useProductStore(state=>state.data.prefs.interests??noInterests);
  const [previewAge, setPreviewAge] = useState(false);
  const search = (query.get('q') ?? '').trim().toLocaleLowerCase();
  if (error) return <section><h1>首期课程</h1><p role="alert">{error}</p>{encryptedCourses && <Link to="/settings/course-access">课程授权与下载</Link>}<Link to="/learn">返回学习</Link></section>;
  if (!index) return <section><h1>首期课程</h1><p>正在读取课程包…</p></section>;
  if (!index.runtime_gate.runtime_enabled) return <section><h1>首期课程</h1><p>课程暂未开放。</p><Link to="/learn">返回学习</Link></section>;
  const groupOrder=[...initialGroups,...Object.keys(index.groups).filter(x=>!initialGroups.includes(x)).sort()];
  if (embedded && !['A02', 'A03'].includes(age) && !previewAge) return <section className="formal-age-empty"><div className="course-search-heading"><span>找内容</span><StartingPointControl/></div><p>当前兴趣年龄暂无对应场景。现有首期内容面向3–6岁，家长可以主动查看。</p><button onClick={() => setPreviewAge(true)}>查看3–6岁首期内容</button></section>;
  const ageScenes = index.scenes.filter(scene => !embedded || previewAge || !scene.age_interest?.length || scene.age_interest.includes(age));
  const sceneQuery = new URLSearchParams();
  const fromLearn = query.get('from') === 'learn';
  if (embedded) sceneQuery.set('origin', 'home');
  else if (pathname === '/learn') sceneQuery.set('origin', 'learn');
  if (fromLearn) sceneQuery.set('from','learn');
  if (query.get('q')) sceneQuery.set('q',query.get('q')!);
  const mode = query.get('mode');
  if (!embedded && mode) sceneQuery.set('mode', mode);
  const sceneSuffix = sceneQuery.size ? `?${sceneQuery}` : '';
  return <section className="formal-courses">
    {fromLearn && <Link to={`/learn${search ? `?${new URLSearchParams({q:search})}` : ''}`}>返回学习</Link>}
    {!embedded && <h1 tabIndex={-1}>{fromLearn ? '按场景找内容' : title}</h1>}
    {catalogNotice&&<p role="status">{catalogNotice}</p>}
    {interests.length>0&&!ageScenes.some(s=>interests.includes(s.category))&&<p role="status">当前兴趣主题暂无可用场景，可调整起点选择其他主题。</p>}
    {showSearch&&<form className="course-search" role="search" key={query.get('q') ?? ''} onSubmit={event => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get('q') ?? '').trim(); setQuery(current => { const next = new URLSearchParams(current); if (value) next.set('q', value); else next.delete('q'); return next; }, { replace: true }); }}>
      <div className="course-search-heading"><label htmlFor="course-query">找内容</label>{embedded && <StartingPointControl/>}</div><div className="course-search-field"><input id="course-query" name="q" type="search" defaultValue={query.get('q') ?? ''} placeholder="输入标题、场景或英文词语"/><button type="submit">搜索</button></div>
    </form>}
    {groupOrder.filter(group=>!interests.length||interests.includes(group)).map(group => {
      const scenes = ageScenes.filter(scene => scene.category === group && (!search || [scene.title, scene.scene_id, scene.licensed_level_id??'', index.groups[group] ?? '', ...(scene.segmented?.search ?? scene.dialogue_lines.flatMap(line => [line.text_en, line.text_zh ?? ''])), ...index.word_cards.filter(card => card.source_scenes.includes(scene.scene_id)).map(card => card.word_en)].some(value => value.toLocaleLowerCase().includes(search))));
      if (!scenes.length) return null;
      const cards = <div className="formal-grid">{scenes.map(scene => {
          const cover = index.event_frames.find(frame => frame.scene_id === scene.scene_id)?.image;
          return <Link className="formal-card" key={scene.scene_id} to={`/courses/${scene.scene_id}${sceneSuffix}`}>
            {cover && <CourseImage src={`${assetBase}${cover}`} alt="" loading="lazy"/>}
            <span className="formal-card-title">{scene.title}</span>
            <span className="formal-card-meta">{scene.segmented?.frames ?? index.event_frames.filter(frame => frame.scene_id === scene.scene_id).length}张图 · {scene.segmented?.lines ?? scene.dialogue_lines.length}句</span>
          </Link>;
        })}</div>;
      {
        const first = scenes[0]!;
        const cover = index.event_frames.find(frame => frame.scene_id === first.scene_id)?.image;
        return <details key={`${group}:${search}`} className="course-group" open={search ? true : undefined}><summary><CourseImage src={`${assetBase}${cover}`} alt={`${index.groups[group]}封面：${first.title}`}/><span className="course-group-caption"><strong>{group} · {index.groups[group] ?? group}</strong><span>{scenes.length}个小场景</span><DisclosureCue/></span></summary><div className="course-group-body">{cards}<button className="parent-disclosure-close" onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}><ChevronIcon up/>收起小场景</button></div></details>;
      }
    })}
    {search && !ageScenes.some(scene => (!interests.length||interests.includes(scene.category))&&[scene.title, scene.scene_id, scene.licensed_level_id??'', index.groups[scene.category] ?? '', ...(scene.segmented?.search ?? scene.dialogue_lines.flatMap(line => [line.text_en, line.text_zh ?? ''])), ...index.word_cards.filter(card => card.source_scenes.includes(scene.scene_id)).map(card => card.word_en)].some(value => value.toLocaleLowerCase().includes(search))) && <p role="status">没有找到匹配的课程，请调整内容后点击搜索。</p>}
  </section>;
}

export function FormalCourseScenePage() {
  const { sceneId = '' } = useParams();
  const [search] = useSearchParams();
  const branch = search.get('branch');
  const mode = search.get('mode');
  return <SceneVisit key={sceneId} sceneId={sceneId} branch={branch} mode={mode}/>;
}

function SceneVisit({ sceneId, branch, mode }: { sceneId: string; branch: string | null; mode: string | null }) {
  const visitKey = `aienglish-scene-tips-v1:${sceneId}`;
  const [showTips] = useState(() => { try { return Number(localStorage.getItem(visitKey) ?? 0) < 3; } catch { return true; } });
  const recorded = useRef(false);
  const markVisited = useCallback(() => { if (recorded.current) return; recorded.current = true; try { localStorage.setItem(visitKey, String(Math.min(3, Number(localStorage.getItem(visitKey) ?? 0) + 1))); } catch { /* Keep instructions readable when storage is unavailable. */ } }, [visitKey]);
  return <FormalCourseRuntime onVisit={markVisited} showTips={showTips} key={`${sceneId}:${branch ?? ''}:${mode ?? 'parent'}`} sceneId={sceneId} requestedBranch={branch} requestedMode={mode}/>;
}

function FormalCourseRuntime({ sceneId, requestedBranch, requestedMode, showTips, onVisit }: { sceneId: string; requestedBranch: string | null; requestedMode: string | null; showTips: boolean; onVisit: () => void }) {
  const [params, setSearch] = useSearchParams();
  const { index, error, catalogNotice } = useCourseIndex(sceneId);
  const prefs = useProductStore(state => state.data.prefs);
  const scene = index?.scenes.find(item => item.scene_id === sceneId);
  const allFrames = useMemo(() => index?.event_frames.filter(frame => frame.scene_id === sceneId).sort((a, b) => a.index - b.index) ?? [], [index, sceneId]);
  const branchIds = useMemo(() => [...new Set(allFrames.map(frame => frame.branch_id).filter(id => !['common-close', 'common-end'].includes(id)))], [allFrames]);
  const defaultBranch = branchIds.find(id => id !== 'common') ?? branchIds[0] ?? 'common';
  const activeBranch = branchIds.includes(requestedBranch ?? '') ? requestedBranch! : defaultBranch;
  const frames = useMemo(() => {
    if (branchIds.every(id => id === 'common')) return allFrames;
    return allFrames.filter(frame => ['common', activeBranch, 'common-close', 'common-end'].includes(frame.branch_id));
  }, [activeBranch, allFrames, branchIds]);
  const [frameIndex, setFrameIndex] = useState(0);
  const mode = modes.some(item => item.id === requestedMode) ? requestedMode! : 'parent';
  const [activeLine, setActiveLine] = useState('');
  const [playing, setPlaying] = useState(false);
  const [frameComplete, setFrameComplete] = useState(false);
  const [notice, setNotice] = useState('');
  const [player] = useState(() => new CoursePlayback());
  const [paused, setPaused] = useState(false);
  const autoStarted = useRef(false);
  const frame = frames[frameIndex];
  const resolveLine = useCallback((id: string) => { const line = scene?.dialogue_lines.find(item => item.line_id === id); const variant = line?.branch_variants?.find(item => item.branch_id === activeBranch); return line && variant ? { ...line, ...variant } : line; }, [activeBranch, scene]);
  const lines = useMemo(() => frame ? frame.line_ids.map(resolveLine).filter((line): line is FormalLine => Boolean(line)) : [], [frame, resolveLine]);
  useEffect(() => { if (scene && frame) onVisit(); }, [scene, frame, onVisit]);
  const wordCards = useMemo(() => {
    const pathText = frames.flatMap(page => page.line_ids.map(resolveLine)).filter((line): line is FormalLine => Boolean(line)).map(line => line.text_en);
    return index?.word_cards.filter(card => card.source_scenes.includes(sceneId) && pathText.some(text => new RegExp(`(^|[^a-z])${card.word_en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i').test(text))) ?? [];
  }, [frames, index, resolveLine, sceneId]);

  const stop = useCallback(() => {
    player.cancel(); cancelAudio(); cancelSpeech();
    setPlaying(false); setPaused(false); setFrameComplete(false); autoStarted.current = true;
  }, [player]);
  const playLine = useCallback(async (line: FormalLine, token: number) => {
    if (!line.audio_enabled || !line.audio_asset) return await player.say(line.text_en, token);
    let url: string;
    try { url = await courseResourceUrl(`${packageBase}${line.audio_asset}`); } catch { return false; }
    if (token !== player.token) { releaseCourseUrl(url); return false; }
    return await player.play(url, token);
  }, [player]);
  const playFrame = useCallback(async (target = frame) => {
    if (!target || !scene) return;
    stop(); const token = player.token; setNotice(''); setPlaying(true);
    for (const line of target.line_ids.map(resolveLine).filter((line): line is FormalLine => Boolean(line))) {
      if (!await player.wait(0, token)) return;
      setNotice(''); setActiveLine(line.line_id);
      const ok = await playLine(line, token);
      if (token !== player.token) return;
      if (!ok) { setNotice('音频暂时无法播放，请检查课程下载或点击语句重试。'); setPlaying(false); return; }
      if (mode === 'echo') {
        if (showTips) setNotice('轮到你跟读，也可以只听。');
        const pause = prefs.echoPause === 'long' ? 2200 : prefs.echoPause === 'short' ? 900 : 1500;
        if (!await player.wait(Math.min(10000, pause + line.text_en.split(/\s+/).length * 300), token)) return;
      }
    }
    if (await player.wait(0, token)) { setNotice(''); setPlaying(false); setFrameComplete(true); }
  }, [frame, mode, playLine, player, prefs.echoPause, resolveLine, scene, showTips, stop]);
  const playOne = useCallback(async (line: FormalLine) => {
    stop(); const token = player.token; setActiveLine(line.line_id); setNotice(''); setPlaying(true);
    const ok = await playLine(line, token);
    if (token !== player.token) return;
    setPlaying(false); if (!ok) setNotice('音频暂时无法播放，请检查课程下载。');
  }, [playLine, player, stop]);
  const togglePause = () => {
    if (paused) { player.resume(); setPaused(false); if (!playing && !frameComplete && mode !== 'read') void playFrame(); }
    else { player.pause(); setPaused(true); }
  };
  const playWord = async (card: WordCard) => {
    const text = card.word_en;
    stop(); const token = player.token; setNotice(''); setActiveLine(''); setPlaying(true);
    const match = card.audio_asset;
    let ok = false;
    if (match) { try { const url = await courseResourceUrl(`${packageBase}${match}`); if (token !== player.token) { releaseCourseUrl(url); return; } ok = await player.play(url, token); } catch { /* Fall back to device speech when the local track cannot be read. */ } }
    if (!ok && token === player.token) ok = await player.say(text, token);
    if (token !== player.token) return;
    setPlaying(false); if (!ok) setNotice('本机英语语音暂时不可用，请家长按文字示范。');
  };

  useEffect(() => () => { stop(); }, [stop]);
  useEffect(() => {
    if (!index?.runtime_gate.runtime_enabled || mode === 'read' || !prefs.auto || autoStarted.current || !frame || !scene) return;
    autoStarted.current = true;
    void playFrame(frame);
  }, [frame, index, mode, playFrame, prefs.auto, scene]);
  useEffect(() => {
    if (mode !== 'echo' || !frameComplete || playing || frameIndex >= frames.length - 1) return;
    const wordCount = lines.reduce((sum, line) => sum + line.text_en.trim().split(/\s+/).length, 0);
    const delay = Math.min(9000, Math.max(3000, 3000 + wordCount * 220));
    let alive = true; const token = player.token;
    void player.wait(delay, token).then(ok => { if (ok && alive) { const nextIndex = frameIndex + 1; setFrameIndex(nextIndex); void playFrame(frames[nextIndex]); } });
    return () => { alive = false; };
  }, [frameComplete, frameIndex, frames, lines, mode, playFrame, player, playing]);

  if (error) return <section><h1>课程读取失败</h1><p role="alert">{error}</p>{encryptedCourses && <Link to="/settings/course-access">课程授权与下载</Link>}<Link to="/courses">返回课程</Link></section>;
  if (!index) return <section><h1>首期课程</h1><p>正在读取课程包…</p></section>;
  if (!index.runtime_gate.runtime_enabled) return <section><h1>课程暂未开放</h1><Link to="/courses">返回课程</Link></section>;
  if (!scene || !frame) return <section><h1>课程暂未载入</h1><p role="status">{catalogNotice || '没有找到课程。'}</p><Link to="/courses">返回课程</Link></section>;

  const selectMode = (value: string) => { stop(); setSearch(current => { const next = new URLSearchParams(current); next.set('mode', value); return next; }, { replace: true }); };
  const changeFrame = (value: number) => { stop(); setNotice(''); setActiveLine(''); const next = Math.max(0, Math.min(frames.length - 1, value)); setFrameIndex(next); if (mode !== 'read') void playFrame(frames[next]); };
  const branchOptions = branchIds.filter(id => !['common-close', 'common-end'].includes(id));
  const parentText = mode === 'parent' ? '由家长引导孩子看图、听句子和回应。图片不会自动翻页，家长可按孩子的节奏切换；可以只看或随时结束。'
    : mode === 'child' ? '孩子可自己点图片听完整页，或点句子前的喇叭重听。图片不会自动翻页，点“下一张”继续；请家长在附近。'
      : mode === 'read' ? '自己看图和英文，不自动播放、不自动翻页。遇到想听的句子，点前面的喇叭即可播放。'
        : '每句播放后留出跟读时间，随后接续本页语句；本页完成后稍候自动播放下一张。点击“暂停”可暂停语音与后续切换，点“继续”接着播放；不录音、不评分。';
  const guideTitle = mode === 'parent' ? '看看这次怎么带' : mode === 'child' ? '点读怎么用' : mode === 'read' ? '自己读怎么用' : '跟读怎么用';

  const origin = params.get('origin');
  const backPath = origin === 'home' ? '/today' : origin === 'learn' ? '/learn' : origin === 'play' && /^[a-z-]+$/.test(params.get('play') ?? '') ? `/play/${params.get('play')}` : '/courses';
  const backQuery = new URLSearchParams();
  if (params.get('q')) backQuery.set('q',params.get('q')!);
  if (backPath === '/courses' && params.get('from') === 'learn') backQuery.set('from','learn');
  const backTo = backQuery.size ? `${backPath}?${backQuery}` : backPath;
  return <section className="formal-scene">
    <Link to={backTo}>{origin === 'home' ? '返回首页' : '返回'}</Link>
    <p className="formal-scene-code">{scene.scene_id} · {index.groups[scene.category] ?? scene.category}</p>
    <h1 tabIndex={-1}>{scene.title}</h1>
    <div className="formal-mode-row" aria-label="学习方式">{modes.map(item => <button key={item.id} aria-pressed={mode === item.id} onClick={() => selectMode(item.id)}>{item.label}</button>)}</div>
    {branchOptions.length > 1 && <div className="formal-branches" aria-label="对话情境">{branchOptions.map(branch => <button key={branch} aria-pressed={activeBranch === branch} onClick={() => { stop(); setSearch(current => { const next = new URLSearchParams(current); next.set('branch', branch); return next; }, { replace: true }); }}>{branchNames[branch] ?? branch}</button>)}</div>}
    <p className="formal-frame-count">第 {frameIndex + 1} / {frames.length} 张</p>
    {mode === 'read' ? <div className="formal-picture"><CourseImage src={`${assetBase}${frame.image}`} alt={`${scene.title}，第${frameIndex + 1}张图片`}/></div> : <button className="formal-picture" aria-label="按顺序播放当前图片中的语句" onClick={() => void playFrame(frame)}>
      <CourseImage src={`${assetBase}${frame.image}`} alt={`${scene.title}，第${frameIndex + 1}张图片`} />
    </button>}
    <div className="formal-dialogue" role="list" aria-label="当前图片对应的英语语句">
      {lines.map(line => <button key={line.line_id} className={`formal-line ${activeLine === line.line_id ? 'is-active' : ''}`} onClick={() => void playOne(line)} aria-pressed={activeLine === line.line_id}>
        <SpeakerIcon/><span><span lang="en-US">{line.text_en}</span>{mode === 'parent' && line.text_zh && <span className="formal-translation">{line.text_zh}</span>}</span>
      </button>)}
    </div>
    <p className="formal-play-status" role="status" aria-live="polite">{paused ? '已暂停' : notice || (playing ? `正在播放：${lines.find(line => line.line_id === activeLine)?.text_en ?? ''}` : showTips && frameComplete ? mode === 'echo' && frameIndex < frames.length - 1 ? '本张完成，稍候继续下一张。' : '本张播放完成，请手动切换图片。' : '')}</p>
    <div className="formal-frame-controls"><button disabled={frameIndex === 0} onClick={() => changeFrame(frameIndex - 1)}>上一张</button><button disabled={frameIndex >= frames.length - 1} onClick={() => changeFrame(frameIndex + 1)}>下一张</button><button onClick={togglePause}>{paused ? '继续' : '暂停'}</button></div>
    <ParentDisclosure title={guideTitle}><p>{parentText}</p><p>请按孩子的兴趣和反应调整；不要求重复，也不把练习表现当成能力结论。</p></ParentDisclosure>
    {mode !== 'read' && wordCards.length > 0 && <details className="formal-wordcards" open><summary><span>本场景词卡 · {wordCards.length}张</span><DisclosureCue/></summary>{showTips && <p className="wordcard-tip">点击图片即可播放单词</p>}<div className="formal-word-grid">{wordCards.map(card => <button key={card.asset_id} onClick={() => void playWord(card)}><CourseImage src={`${assetBase}${card.image}`} alt="" loading="lazy"/><span lang="en-US">{card.word_en}</span>{!scene.dialogue_lines.some(line => [line.text_en, ...(line.branch_variants ?? []).map(variant => variant.text_en)].some(text => new RegExp(`(^|[^a-z])${card.word_en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i').test(text))) && <small>扩展词</small>}</button>)}</div></details>}
    <Link className="formal-finish" to={backTo} onClick={stop}>结束课程</Link>
  </section>;
}

