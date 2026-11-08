import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCourseIndex, courseAssetBase as assetBase, formalPackageBase as formalBase, type CourseIndex, type ListeningKind, type ListeningProgram } from './formalCourseData';
import { ChevronIcon, DisclosureCue } from '../components/DisclosureCue';
import { cancelSpeech, speak } from '../services/tts';
import { CourseImage } from '../security/CourseImage';
import { courseResourceUrl, encryptedCourses, releaseCourseUrl } from '../security/courseVault';

const kinds: { id: ListeningKind; label: string }[] = [{ id: 'immersion', label: '熏听' }, { id: 'rhyme', label: '熏听韵律' }, { id: 'story', label: '故事' }];

export default function ListenCenter() {
  const { index, error } = useCourseIndex();
  const [query, setQuery] = useSearchParams();
  const [draft, setDraft] = useState<string[] | null>(null);
  const pickerOpen = draft !== null;
  const pickerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!pickerOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const sheet = pickerRef.current;
    const viewport = window.visualViewport;
    const sizeToVisibleViewport = () => {
      const height = viewport?.scale === 1 ? viewport.height : window.innerHeight;
      sheet?.style.setProperty('--listen-picker-viewport', `${height}px`);
    };
    // Non-modal top sheet leaves navigation usable.
    sheet?.querySelector<HTMLButtonElement>('button')?.focus();
    sizeToVisibleViewport();
    viewport?.addEventListener('resize', sizeToVisibleViewport);
    window.addEventListener('resize', sizeToVisibleViewport);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setDraft(null); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      viewport?.removeEventListener('resize', sizeToVisibleViewport);
      window.removeEventListener('resize', sizeToVisibleViewport);
      document.removeEventListener('keydown', keydown);
      previous?.focus();
    };
  }, [pickerOpen]);
  if (error) return <section><h1>听一听</h1><p role="alert">{error}</p>{encryptedCourses && <Link to="/settings/course-access">课程授权与下载</Link>}</section>;
  if (!index) return <section><h1>听一听</h1><p>正在读取场景内容…</p></section>;
  if (!index.runtime_gate.runtime_enabled) return <section><h1>听一听</h1><p>课程暂未开放。</p></section>;
  const kind = kinds.find(item => item.id === query.get('kind'))?.id ?? 'immersion';
  const requested = query.getAll('scene');
  const programs = index.listening_programs ?? [];
  const availablePrograms = programs.filter(program => program.kind === kind);
  const playableIds = new Set(availablePrograms.map(program => program.scene_id));
  const availableScenes = index.scenes.filter(scene => playableIds.has(scene.scene_id));
  const availableGroups = Object.keys(index.groups).filter(group => availableScenes.some(scene => scene.category === group));
  const requestedScenes = availableScenes.filter(scene => requested.includes(scene.scene_id) || requested.includes(scene.category));
  const selected = new Set((requestedScenes.length ? requestedScenes : availableScenes.filter(scene => scene.category === availableGroups[0])).map(scene => scene.scene_id));
  const queue = availablePrograms.filter(program => selected.has(program.scene_id));
  const choose = (scene: string[], nextKind = kind) => {
    setDraft(null);
    setQuery({ scene, kind: nextKind });
  };
  const toggleScenes = (ids: string[], checked: boolean) => {
    setDraft(previous => previous && (checked
      ? [...new Set([...previous, ...ids])]
      : previous.filter(id => !ids.includes(id))));
  };
  const storyHome = kind === 'story' && !requested.length;
  return <section className="listen-center">
    <h1 tabIndex={-1}>听一听</h1>
    <div className="listen-kind-tabs" aria-label="聆听类型">{kinds.map(item => <button key={item.id} aria-pressed={kind === item.id} onClick={() => {
      if (item.id === 'story') { setDraft(null); setQuery({ kind: 'story' }); }
      else choose(requested.length ? requested : availableGroups.slice(0, 1), item.id);
    }}>{item.label}</button>)}</div>
    {storyHome ? <section><h2>故事首页</h2><div className="formal-grid">{availablePrograms.map(program => <button className="listen-scene-card" key={program.id} onClick={() => choose([program.scene_id], 'story')}><CourseImage src={`${assetBase}${index.event_frames.find(frame => frame.scene_id === program.scene_id)?.image}`} alt=""/><span>{program.title}</span></button>)}</div></section> : <>
      {kind === 'story' && <button className="story-back" onClick={() => { setDraft(null); setQuery({ kind: 'story' }); }}>返回故事首页</button>}
      <div className="row">
        <button aria-haspopup="dialog" aria-expanded={pickerOpen} onClick={() => setDraft([...selected])}>选择场景</button>
      </div>
      {draft && <div className="listen-picker-overlay">
        <section ref={pickerRef} className="listen-picker-sheet listen-text-picker" role="dialog" aria-modal="false" aria-label="选择场景">
          <div className="listen-picker-header"><strong>选择场景</strong><button onClick={() => setDraft(null)}>取消</button></div>
          <div className="listen-picker-content">
            {!availableGroups.length && <p role="status">当前类型暂无可选场景。</p>}
            {availableGroups.map(group => {
              const scenes = availableScenes.filter(scene => scene.category === group);
              const ids = scenes.map(scene => scene.scene_id);
              const checkedCount = ids.filter(id => draft.includes(id)).length;
              return <div key={group} role="group" aria-label={index.groups[group]}>
                <label className="listen-text-option">{group} · {index.groups[group]} · 全部小场景
                  <input type="checkbox" checked={checkedCount === ids.length}
                    ref={input => { if (input) input.indeterminate = checkedCount > 0 && checkedCount < ids.length; }}
                    onChange={event => toggleScenes(ids, event.currentTarget.checked)}/>
                </label>
                {scenes.map(scene => <label key={scene.scene_id} className="listen-text-option listen-text-subscene">{scene.title}
                  <input type="checkbox" checked={draft.includes(scene.scene_id)} onChange={event => toggleScenes([scene.scene_id], event.currentTarget.checked)}/>
                </label>)}
              </div>;
            })}
          </div>
          <div className="listen-picker-footer"><span>已选 {draft.length} 个小场景</span><button className="primary" disabled={!draft.length} onClick={() => choose(draft)}>确定</button></div>
        </section>
      </div>}
      {queue.length ? <ListeningSession key={JSON.stringify([kind, ...queue.map(program => program.id)])} queue={queue} index={index}/> : <div className="card listen-empty" role="status">{kind === 'song' ? <p>{index.listening_availability?.song?.reason ?? '本场景尚未入库演唱版儿歌。'}</p> : kind === 'story' ? <><p>这个场景暂无独立故事。</p><button onClick={() => setQuery({ kind: 'story' })}>返回故事首页</button></> : <p>本场景的这一类内容尚未整理完成。</p>}</div>}
    </>}
  </section>;
}

function ListeningSession({ queue, index }: { queue: ListeningProgram[]; index: CourseIndex }) {
  const [programIndex, setProgramIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const pauseRef = useRef(false);
  const lastInteraction = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pending = useRef<((ok: boolean) => void) | null>(null);
  const program = queue[programIndex]!;
  const [loaded, setLoaded] = useState<{id: string; lines: ListeningProgram['lines']} | null>(null);
  const tracks = loaded?.id === program.id ? loaded.lines : program.lines;
  const track = tracks[trackIndex];
  const scene = index.scenes.find(scene => scene.scene_id === program.scene_id);
  const groupTitle = scene && index.groups[scene.category];
  const sceneOrder = [...new Set(queue.map(item => item.scene_id))];
  const cover = index.event_frames.find(frame => frame.scene_id === program.scene_id)?.image;
  useEffect(() => {
    if (!scene?.segmented || playing || loaded?.id === program.id) return;
    let current = true;
    void import('../security/licensedSceneIndex').then(module => module.loadSegmentedListening(scene)).then(lines => {
      if (current) setLoaded({id: program.id, lines});
    }).catch(() => { if (current) setError('当前场景暂未载入，请检查对应资源包。'); });
    return () => { current = false; };
  }, [scene, playing, loaded?.id, program.id]);
  const halt = () => { generation.current++; pending.current?.(false); pending.current = null; audioRef.current?.pause(); if (audioRef.current) { releaseCourseUrl(audioRef.current.src); audioRef.current.src = ''; } audioRef.current = null; cancelSpeech(); pauseRef.current = false; };
  const stop = () => { halt(); setPaused(false); setPlaying(false); setWaiting(false); };
  useEffect(() => () => { generation.current++; pending.current?.(false); audioRef.current?.pause(); if (audioRef.current) { releaseCourseUrl(audioRef.current.src); audioRef.current.src = ''; } cancelSpeech(); }, []);
  const wait = async (milliseconds: number, token: number, idle = false) => {
    if (idle) lastInteraction.current = Date.now();
    let remaining = milliseconds;
    while (token === generation.current && (pauseRef.current || (idle ? Date.now() - lastInteraction.current < milliseconds : remaining > 0))) {
      await new Promise(resolve => window.setTimeout(resolve, 100));
      if (pauseRef.current) { if (idle) lastInteraction.current = Date.now(); }
      else if (!idle) remaining -= 100;
    }
  };
  const playLoop = async () => {
    stop(); const token = generation.current; setError(''); setPlaying(true);
    let pi = programIndex; let firstTrack = trackIndex;
    while (token === generation.current) {
      const current = queue[pi]!;
      let lines = current.id === loaded?.id ? loaded.lines : current.lines;
      const nextScene = index.scenes.find(item => item.scene_id === current.scene_id);
      if (!lines.length && nextScene?.segmented) {
        try {
          const module = await import('../security/licensedSceneIndex');
          lines = await module.loadSegmentedListening(nextScene);
        } catch {
          if (token === generation.current) { setError('当前场景暂未载入，请检查对应资源包。'); setPlaying(false); }
          return;
        }
      }
      if (token !== generation.current) return;
      if (!lines.length) { setError('当前场景没有可播放的语句。'); setPlaying(false); return; }
      if (nextScene?.segmented) setLoaded({id:current.id, lines});
      const bedtime = current.scene_id === 'SC-C01-009';
      setProgramIndex(pi); setWaiting(false);
      for (let ti = firstTrack; ti < lines.length; ti++) {
        if (token !== generation.current) return;
        await wait(0, token); if (token !== generation.current) return;
        const line = lines[ti]!; setTrackIndex(ti);
        let ok: boolean;
        if (line.audio_asset) {
          let url: string;
          try { url = await courseResourceUrl(`${formalBase}${line.audio_asset}`); }
          catch { setError('课程音频尚未下载或读取失败，请到课程授权页检查。'); setPlaying(false); return; }
          await wait(0, token);
          if (token !== generation.current) { releaseCourseUrl(url); return; }
          ok = await new Promise<boolean>(resolve => {
            const audio = new Audio(url); audioRef.current = audio; pending.current = resolve;
            audio.playbackRate = current.audio_mode === 'melodic_rhyme' ? 1 : bedtime ? 0.8 : 0.9;
            const finish = (result: boolean) => { releaseCourseUrl(url); if (audioRef.current === audio) audioRef.current = null; pending.current = null; resolve(result); };
            audio.onended = () => finish(true); audio.onerror = () => finish(false); audio.onabort = () => finish(false);
            audio.play().catch(() => finish(false));
          });
        } else {
          const quiet = bedtime || /night|sleep|moon|rest/i.test(line.text);
          ok = (await speak(line.text, { rate: quiet ? 0.76 : 0.84, pitch: quiet ? 0.92 : 1 })).ok;
        }
        if (token !== generation.current) return;
        if (!ok) { setError('暂时无法播放，请检查设备声音和本机英语语音设置。'); setPlaying(false); return; }
        if (ti < lines.length - 1) await wait(bedtime ? 1400 : 1100, token);
      }
      setWaiting(true);
      const words = (lines.at(-1)?.text ?? '').split(/\s+/).length;
      await wait(Math.min(9000, 3000 + Math.max(0, words - 5) * 180), token, true);
      if (token !== generation.current) return;
      pi = (pi + 1) % queue.length; firstTrack = 0; setTrackIndex(0);
    }
  };
  const selectTrack = (value: number) => { stop(); setError(''); setTrackIndex(value); };
  const togglePause = () => { if (paused) { pauseRef.current = false; if (audioRef.current) void audioRef.current.play(); window.speechSynthesis?.resume(); setPaused(false); } else { pauseRef.current = true; audioRef.current?.pause(); window.speechSynthesis?.pause(); setPaused(true); } };
  return <section onPointerDownCapture={() => { lastInteraction.current = Date.now(); }}>
    <p className="product-muted">
      <span className="listen-scene-progress">{groupTitle && `${groupTitle} · `}第{sceneOrder.indexOf(program.scene_id) + 1}/{sceneOrder.length}个小场景</span>；
      {program.kind === 'immersion' && sceneOrder.length > 1 && <br/>}
      按顺序循环播放。每轮结束后留出至少3秒，可以随时暂停；离开本页后结束播放。
    </p>
    <h2>{program.title || scene?.title}</h2>
    <article className="listen-player card">
      {cover && <CourseImage className="listen-cover" src={`${assetBase}${cover}`} alt={scene?.title ?? program.title}/>}
      <p className="product-muted">{program.audio_mode === 'melodic_rhyme' ? '原创旋律伴奏 · 慢速念读' : program.audio_mode === 'device_tts' ? '本机朗读 · 非演唱' : '课程音频'} · 慢速 · 句间留白</p>
      <p className="product-muted">{tracks.length ? `第${trackIndex + 1}/${tracks.length}段 · ` : '正在读取语句 · '}{paused ? '已暂停' : waiting ? queue.length > 1 ? '稍候接续下一个场景' : '稍候再次播放本场景' : playing ? '循环播放中' : '未开始'}</p>
      <p lang="en-US" className="listen-line">{track?.text}</p>
      <div className="row"><button disabled={trackIndex === 0} onClick={() => selectTrack(trackIndex - 1)}>上一段</button>{playing ? <button className="primary" onClick={togglePause}>{paused ? '继续' : '暂停'}</button> : <button className="primary" onClick={() => void playLoop()}>循环播放</button>}<button disabled={trackIndex >= tracks.length - 1} onClick={() => selectTrack(trackIndex + 1)}>下一段</button></div>
      {error && <p role="alert">{error}</p>}
    </article>
    <details className="listen-queue"><summary><span>查看全部语句</span><DisclosureCue/></summary><ol>{tracks.map((line, i) => <li key={line.id}><button className={i === trackIndex ? 'is-active' : ''} onClick={() => selectTrack(i)} lang="en-US">{line.text}</button></li>)}</ol><button className="parent-disclosure-close" onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}><ChevronIcon up/>收起</button></details>
  </section>;
}
