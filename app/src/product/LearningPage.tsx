import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ParentDisclosure } from '../components/ParentDisclosure';
import { SpeakerIcon } from '../components/SpeakerIcon';
import { contentVersion, findActivity, makeGroup, modeNames, validMode, type Activity } from './catalog';
import { LearningPlayer } from './player';
import { localDate, useProductStore, type Experience } from './store';

export default function LearningPage() {
  const { unitId, storyId } = useParams();
  const [query] = useSearchParams();
  return <ResolvedLearning key={`${unitId ?? storyId}-${query.toString()}`} id={unitId ?? storyId ?? ''} query={query}/>;
}
function ResolvedLearning({ id, query }: { id: string; query: URLSearchParams }) {
  const data = useProductStore(s => s.data);
  const activity = findActivity(id);
  const [resumeSnapshot] = useState(() => activity ? data.experiences.find(e => e.id === query.get('resume') && e.endedAt === null && e.version === contentVersion && e.mode === validMode(query.get('mode'), activity)) ?? null : null);
  if (!activity) return <section><h1>没有找到这份内容</h1><Link to="/learn">返回学习</Link></section>;
  if (!data.accepted) return <section><h1>开始本机体验</h1><p>图片和声音可直接使用。你同意后，我们会在这台设备保存偏好和体验位置；不录音、不上传学习记录。</p><button className="primary" onClick={() => useProductStore.getState().accept()}>同意本机保存并开始</button><p><Link to="/learn">返回浏览</Link></p></section>;
  const mode = validMode(query.get('mode'), activity);
  const saved = resumeSnapshot;
  if (query.has('resume') && !saved) return <section><h1>上次的体验暂时无法继续</h1><p>可能已经结束，或内容版本发生了变化。请重新选择，不会自动开始另一项体验。</p><Link to="/learn">重新选择</Link></section>;
  const ids = saved?.group ?? makeGroup(activity.id, (query.get('group') ?? '').split(',').filter(Boolean), mode);
  const group = ids.map(findActivity).filter((a): a is Activity => !!a);
  if (group.length !== ids.length) return <section><h1>上次的内容版本已变化</h1><p>请重新选择本次内容组，不会用其他内容代替继续。</p><Link to="/learn">重新选择</Link></section>;
  if (saved && !group[saved.unit]?.frames[saved.frame]) return <section><h1>上次的位置不可用</h1><Link to="/learn">重新选择内容</Link></section>;
  return <Session key={`${activity.id}-${mode}-${query.get('resume') ?? ''}`} group={group} mode={mode} saved={saved ?? null}/>;
}

function Session({ group, mode, saved }: { group: Activity[]; mode: 'parent' | 'child' | 'echo'; saved: Experience | null }) {
  const navigate = useNavigate(), location = useLocation();
  const prefs = useProductStore(s => s.data.prefs);
  const [stage, setStage] = useState(mode === 'parent' && !saved ? 'prepare' : 'play');
  const [saveError, setSaveError] = useState(false);
  const [pictureError, setPictureError] = useState(false);
  const [engine] = useState(() => new LearningPlayer(group, mode, prefs, saved ? { unit: saved.unit, frame: saved.frame } : undefined));
  const player = useSyncExternalStore(engine.subscribe, engine.snapshot);
  const [initial] = useState<Experience>(() => saved ?? { id: crypto.randomUUID(), version: contentVersion, group: group.map(a => a.id), mode,
    unit: 0, frame: 0, startedAt: Date.now(), updatedAt: Date.now(), endedAt: null, reason: 'interrupted',
    localDate: localDate(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const finished = useRef(false);
  const resuming = useRef(!!saved);
  const a = engine.current(), frame = engine.frame();
  const returnTo = useMemo(() => {
    const previous = (location.state as { returnTo?: string } | null)?.returnTo;
    return previous === '/today' || previous === '/learn' ? previous : `/learn/unit/${group[0]!.id}`;
  }, [location.state, group]);
  useEffect(() => {
    engine.activate(); engine.enter(resuming.current);
    const visibility = () => { if (document.hidden) engine.pause(); };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      engine.dispose(); document.removeEventListener('visibilitychange', visibility);
      const last = engine.snapshot();
      if (!finished.current) useProductStore.getState().experience({ ...initial, unit: last.unit, frame: last.frame, updatedAt: Date.now(), endedAt: last.phase === 'done' ? Date.now() : null, reason: last.phase === 'done' ? 'group_done' : 'interrupted' });
    };
  }, [engine, initial]);
  useEffect(() => { engine.configure(prefs); }, [engine, prefs]);
  useEffect(() => {
    if (finished.current) return;
    const success = useProductStore.getState().experience({ ...initial, unit: player.unit, frame: player.frame, updatedAt: Date.now(), endedAt: player.phase === 'done' ? Date.now() : null, reason: player.phase === 'done' ? 'group_done' : 'interrupted' });
    // Store failures are already surfaced by the shared shell; continue learning.
    if (!success) queueMicrotask(() => setSaveError(true));
  }, [player.unit, player.frame, player.phase, initial]);
  const finish = () => {
    const done = player.phase === 'done';
    finished.current = true; engine.end();
    useProductStore.getState().experience({ ...initial, unit: player.unit, frame: player.frame, updatedAt: Date.now(), endedAt: Date.now(), reason: done ? 'group_done' : 'user_end' });
    navigate(returnTo, { replace: true, state: { finished: true } });
  };
  if (stage === 'prepare') return <section className="product-session"><h1>{a.title}</h1><h2>准备一下</h2><p>{a.goal}</p><p>准备：{a.materials}</p><p>可以只看、做动作，随时结束。</p><div className="row"><button className="primary" onClick={() => { setStage('play'); if (prefs.auto) engine.play(); }}>开始体验</button><button onClick={finish}>结束</button></div></section>;
  if (stage === 'offline') return <section className="product-session"><h1>放下屏幕，一起试试</h1><p>{a.offline}</p><p>给孩子回应的时间，没有回应也可以结束。</p><button className="primary" onClick={finish}>结束</button></section>;
  const message = player.phase === 'speaking' ? '先听一听' : player.phase === 'response' ? '轮到你了，不想说也可以继续' : player.phase === 'idle' ? '点图片听本页；点句子可单独重听。' : player.message;
  return <section className="product-session" onPointerDown={() => engine.interact()} onKeyDown={() => engine.interact()}>
    <header className="product-row"><h1 tabIndex={-1}>{a.title}</h1><button onClick={finish}>结束</button></header>
    <p className="product-muted">{modeNames[mode]} · 第{player.unit + 1}/{group.length}项 · 第{player.frame + 1}/{a.frames.length}张</p>
    {saveError && <p role="alert">本次位置未能保存，仍可继续体验。请检查本机存储。</p>}
    <button className="product-picture" aria-label="按顺序播放图片下的语句" onClick={() => { if (!pictureError) engine.play(); }}>
      <img key={frame.id} src={frame.image} alt={`${a.title}情境图`} onLoad={() => setPictureError(false)} onError={() => { setPictureError(true); engine.failed('图片加载失败，请重新载入或结束。'); }}/>
    </button>
    {pictureError && <button onClick={() => { setPictureError(false); const img = document.querySelector<HTMLImageElement>('.product-picture img'); if (img) img.src = frame.image; }}>重新载入图片</button>}
    <div className="product-lines" role="list" aria-label="本页英语语句">{frame.lines.map((line, index) => <div role="listitem" key={line.id}>
      <button className={`product-line ${player.line === index ? 'is-active' : ''}`} aria-pressed={player.line === index} onClick={() => { if (!pictureError) engine.play(index); }}><SpeakerIcon/><span lang="en-US">{line.text}</span></button>
    </div>)}</div>
    <p role="status" className="product-status">{message}</p>
    <div className="row"><button onClick={() => player.phase === 'paused' ? engine.resume() : engine.pause()} disabled={['idle', 'done', 'error'].includes(player.phase)}>{player.phase === 'paused' ? '继续' : '暂停'}</button>
      <button onClick={() => engine.play()} disabled={pictureError}>重听本页</button>
      {mode === 'echo' && <button onClick={() => engine.nextLine()}>下一句</button>}
      <button disabled={player.unit === 0 && player.frame === 0} onClick={() => engine.move(-1)}>上一张</button>
      <button disabled={player.unit === group.length - 1 && player.frame === a.frames.length - 1} onClick={() => engine.move(1)}>下一张</button>
    </div>
    {mode === 'echo' && <p className="product-muted">听一句，再试着说。不使用麦克风，不识别或评分。</p>}
    {mode === 'parent' && <><ParentDisclosure title="看看回应示例"><p>{frame.note}</p><p>{a.boundary}</p></ParentDisclosure><ParentDisclosure title="需要帮助时看提示"><p>可以示范、等一等，接受动作或中文参与。示范后的跟说不算独立表达。</p></ParentDisclosure><button className="primary" onClick={() => { engine.pause(); setStage('offline'); }}>放下屏幕，去试试</button></>}
  </section>;
}
