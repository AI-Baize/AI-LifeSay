import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import catalog from '../content/pilotCatalog.json';
import { ParentDisclosure } from '../components/ParentDisclosure';
import { SpeakerIcon } from '../components/SpeakerIcon';
import { playSceneLine } from '../services/sceneSpeech';
import { cancelAudio } from '../services/audio';
import { cancelSpeech } from '../services/tts';
import './pilot.css';

type Unit = typeof catalog.units[number];
type Story = typeof catalog.stories[number];
const stop = () => { cancelAudio(); cancelSpeech(); };

function Exit({ to, onOpen }: { to: string; onOpen?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <><button className="secondary" onClick={() => { onOpen?.(); stop(); dialog.current?.showModal(); }}>请家长来结束</button>
    <dialog className="card" ref={dialog} aria-labelledby="pilot-exit-title">
      <h2 id="pilot-exit-title">家长确认结束</h2><p>可以随时结束，不必完成全部内容。</p>
      <Link to={to}>结束并返回</Link><button onClick={() => dialog.current?.close()}>继续体验</button>
    </dialog></>;
}

export function ExplorePage() {
  return <section className="pilot"><h1 tabIndex={-1}>一起学英语</h1>
    <p>选一个生活时刻，或者一起听一个故事。</p>
    <p role="note" className="pilot-notice">内部候选版 · 适合3–6岁亲子体验。课程、声音与专属配图仍待审阅；不会根据点读生成能力成绩。</p>
    <h2>生活交流</h2><div className="pilot-grid">{catalog.units.map(unit => <article className="card" key={unit.id}>
      <Link className="pilot-card" to={`/learn/unit/${unit.id}`}><img src={unit.image} alt=""/><h3>{unit.title}</h3><p>1 个活动</p></Link>
    </article>)}</div>
    <h2>故事共读</h2><p>先听懂故事、一起说一说；听懂不等于独立识字。</p>
    <div className="pilot-grid">{catalog.stories.map(story => <article className="card" key={story.id}>
      <Link className="pilot-card" to={`/stories/${story.id}`}><img src={story.frames[0]!.image} alt=""/><h3>{story.title}</h3><p>1 个共读活动</p></Link>
    </article>)}</div>
    <Link to="/scenes">查看原有场景图库</Link>
  </section>;
}

export function UnitPage() {
  const { unitId } = useParams();
  const unit = catalog.units.find(item => item.id === unitId);
  if (!unit) return <Missing />;
  return <section className="pilot"><Link to="/explore">返回探索</Link><h1 tabIndex={-1}>{unit.title}</h1>
    <p className="pilot-notice">内部练习候选 · 尚未通过真人教学与资源终审。</p>
    <img className="pilot-image" src={unit.image} alt={unit.title}/>
    <p>今天试一试：{unit.target}</p><p>准备：{unit.materials}。5–10分钟，也可以随时结束。</p>
    <Link className="button" to={`/learn/play/${unit.id}`}>家长带着做</Link>{' '}
    <Link className="button secondary" to={`/learn/play/${unit.id}?mode=child`}>让孩子点读</Link>
    <p>自主点读需成人在附近；演示图和系统朗读用于内部体验。</p>
    <ParentDisclosure title="看看这次怎么带"><p>{unit.offline}</p><p>{unit.boundary}</p></ParentDisclosure>
    <ParentDisclosure title="支持方式"><p>可以先示范、等一等、接受动作或中文回应；孩子不想玩就结束，无需选择支持方式。</p></ParentDisclosure>
    <details><summary>家长文字版与打印</summary><p>情境句：{unit.stimulus}</p><p>示范：{unit.model}</p><p>{unit.offline}</p><p>{unit.boundary}</p><button onClick={() => window.print()}>打印活动说明</button></details>
  </section>;
}

export function ActivityPage() {
  const { unitId } = useParams();
  const [search] = useSearchParams();
  const unit = catalog.units.find(item => item.id === unitId);
  if (!unit) return <Missing />;
  return <Practice key={`${unit.id}-${search.get('mode')}`} unit={unit} child={search.get('mode') === 'child'}/>;
}

function Practice({ unit, child }: { unit: Unit; child: boolean }) {
  const navigate = useNavigate();
  const [activeUnit, setActiveUnit] = useState(unit);
  const [step, setStep] = useState(child ? 1 : 0);
  const [notice, setNotice] = useState('');
  const [playing, setPlaying] = useState(false);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [waitingAdvance, setWaitingAdvance] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [interaction, setInteraction] = useState(0);
  const request = useRef(0);
  const lines = child
    ? [...new Set([activeUnit.stimulus.trim(), activeUnit.model.trim()].filter(Boolean))]
    : [activeUnit.practice_line];
  const playRef = useRef<((startAt: number, sequential: boolean) => Promise<void>) | null>(null);
  useEffect(() => () => { request.current++; stop(); }, []);

  const playAt = async (startAt = 0, sequential = child) => {
    setInteraction(value => value + 1);
    setWaitingAdvance(false);
    const id = ++request.current;
    stop();
    setPlaying(true);
    setNotice('');
    const endAt = sequential ? lines.length : Math.min(lines.length, startAt + 1);
    try {
      for (let index = startAt; index < endAt; index++) {
        if (request.current !== id) return;
        const line = lines[index];
        if (!line) continue;
        setActiveLine(index);
        const result = await playSceneLine(line);
        if (request.current !== id) return;
        if (!result.ok) {
          setNotice('暂时没有声音，可以请家长照文字说。');
          return;
        }
      }
      if (child) setWaitingAdvance(true);
    } finally {
      if (request.current === id) setPlaying(false);
    }
  };
  playRef.current = playAt;

  useEffect(() => {
    if (!child || step !== 1 || !waitingAdvance) return;
    const index = catalog.units.findIndex(item => item.id === activeUnit.id);
    if (index < 0) return;
    if (index >= catalog.units.length - 1) {
      setWaitingAdvance(false);
      setNotice('已经听完这些图片，可以点击“结束”。');
      return;
    }
    const timer = window.setTimeout(() => {
      request.current++;
      stop();
      setWaitingAdvance(false);
      setNotice('');
      setActiveLine(null);
      setActiveUnit(catalog.units[index + 1]!);
      setAutoPlayNext(true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [activeUnit, child, interaction, step, waitingAdvance]);

  useEffect(() => {
    if (!child || !autoPlayNext) return;
    setAutoPlayNext(false);
    void playRef.current?.(0, true);
  }, [activeUnit, autoPlayNext, child]);

  const next = () => { request.current++; stop(); setWaitingAdvance(false); setNotice(''); setStep(value => Math.min(2, value + 1)); };
  const finish = () => { request.current++; stop(); setWaitingAdvance(false); navigate(`/learn/unit/${activeUnit.id}`); };
  return <section className="pilot" aria-label={child ? '孩子点读体验' : '家长带领练习'}>
    <h1 tabIndex={-1}>{activeUnit.title}</h1><p aria-live="polite">{['准备一下', '点一点，听一听', '放下屏幕，一起试试'][step]}</p>
    {step === 0 && <><p>{activeUnit.target}</p><p>准备：{activeUnit.materials}</p><p>先示范一次，不要求孩子跟说。</p><button onClick={next}>开始体验</button></>}
    {step === 1 && <><button className="pilot-picture" aria-label={child ? '按顺序播放图片下的语句' : `朗读 ${activeUnit.practice_line}`} onClick={() => void playAt(0, child)}><img className="pilot-image" src={activeUnit.image} alt={activeUnit.title}/></button>
      <div className="pilot-child-lines" role="list" aria-label="本页英语语句">{lines.map((line, index) => <div role="listitem" key={`${activeUnit.id}-${index}`} className={activeLine === index ? 'is-active' : ''}>
        <button className="pilot-line" onClick={() => void playAt(index, false)} aria-label={`播放 ${line}`} aria-pressed={activeLine === index}><SpeakerIcon/><span lang="en-US">{line}</span></button>
      </div>)}</div>
      <p role="status" aria-live="polite">{playing ? `正在朗读：${lines[activeLine ?? 0] ?? ''}` : notice}</p>
      {!child && <ParentDisclosure title="家长怎么带"><p>情境句：{activeUnit.stimulus}</p><p>示范回应仅用于练习，不是观察测试。</p><p>{activeUnit.boundary}</p></ParentDisclosure>}
      <button onClick={next}>放下屏幕，去试一试</button>
      {child ? <button className="secondary" onClick={finish}>结束</button> : <Link to={`/learn/unit/${activeUnit.id}`} onClick={stop}>提前结束并返回</Link>}</>}
    {step === 2 && <><p>{activeUnit.offline}</p><p>可以停下来、换材料，也可以只看不说。</p><button className="primary" onClick={finish}>结束</button></>}
  </section>;
}

export function StoryPage() {
  const { storyId } = useParams();
  const [search] = useSearchParams();
  const story = catalog.stories.find(item => item.id === storyId);
  if (!story) return <Missing />;
  return <Reader key={`${story.id}-${search.get('mode')}`} story={story} child={search.get('mode') === 'child'}/>;
}

function Reader({ story, child }: { story: Story; child: boolean }) {
  const [index, setIndex] = useState(0);
  const [automatic, setAutomatic] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState('');
  const [hidden, setHidden] = useState(() => document.hidden);
  const request = useRef(0);
  const frame = story.frames[index]!;
  const isLast = index === story.frames.length - 1;
  const interrupt = () => { request.current++; stop(); setPlaying(false); };
  const move = (next: number) => { interrupt(); setNotice(''); setIndex(next); };
  useEffect(() => {
    const playback = request;
    const onVisibility = () => { setHidden(document.hidden); if (document.hidden) { request.current++; stop(); setPlaying(false); setAutomatic(false); } };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { document.removeEventListener('visibilitychange', onVisibility); playback.current++; stop(); };
  }, []);
  useEffect(() => {
    if (!automatic || hidden || playing || isLast) return;
    const words = frame.text.trim().split(/\s+/).length;
    const timer = setTimeout(() => setIndex(value => value + 1), Math.min(12000, 5000 + Math.max(0, words - 5) * 300));
    return () => clearTimeout(timer);
  }, [automatic, hidden, playing, isLast, frame]);
  const play = async () => {
    const id = ++request.current; stop(); setPlaying(true); setNotice('');
    const result = await playSceneLine(frame.text);
    if (id !== request.current) return;
    setPlaying(false);
    if (!result.ok) { setNotice('暂时没有声音，可以请家长照文字说。'); setAutomatic(false); }
  };
  return <section className="pilot" aria-label="故事共读">
    <h1 tabIndex={-1}>{story.title}</h1>
    {!child && <><p className="pilot-notice">共读文字草稿 · 沿用演示插图，专属图与真人审阅待完成。不是已定级的自主阅读材料。</p>
      <Link to={`/stories/${story.id}?mode=child`}>进入孩子听看模式</Link></>}
    <p aria-live="polite">第 {index + 1} / {story.frames.length} 页</p>
    <button className="pilot-picture" onClick={() => void play()} aria-label={`朗读 ${frame.text}`}><img className="pilot-image" src={frame.image} alt={`${story.title}第${index + 1}页示意图`}/></button>
    <button className="pilot-line" onClick={() => void play()} aria-label={`播放 ${frame.text}`}><SpeakerIcon/><span lang="en-US">{frame.text}</span></button>
    <p role="status">{playing ? '正在朗读' : notice}</p>
    {!child && <ParentDisclosure title="看看这页怎么带"><p>{frame.parent_note}</p><p>可以请孩子指一指、演一演，不要求读出文字。</p></ParentDisclosure>}
    <div className="pilot-controls"><button disabled={index === 0} onClick={() => move(index - 1)}>上一页</button>
      <button disabled={isLast} onClick={() => move(index + 1)}>下一页</button>
      <button onClick={() => { interrupt(); setAutomatic(value => !value); }}>{automatic ? '暂停自动翻页' : '自动翻页'}</button>
      <button disabled={!playing} onClick={() => { interrupt(); setAutomatic(false); }}>停止朗读</button></div>
    {isLast && <p>故事结束。可以放下屏幕，在生活中试一试。</p>}
    {child ? <Exit to="/explore" onOpen={() => { interrupt(); setAutomatic(false); }}/> : <Link to="/explore" onClick={stop}>返回探索</Link>}
  </section>;
}

function Missing() { return <section className="pilot"><h1>没有找到这份内容</h1><Link to="/explore">返回探索选择</Link></section>; }
