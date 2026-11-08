import { useCallback, useEffect, useRef, useState } from 'react';
import { sceneForTheme, findScene } from '../content/scenes';
import type { SceneHotspot } from '../content/scenes';
import { cancelSpeech } from '../services/tts';
import { playSceneLine as speak } from '../services/sceneSpeech';
import { cancelAudio } from '../services/audio';
import { SpeakerIcon } from './SpeakerIcon';
import { useAppStore } from '../stores/appStore';
import { StatusNotice } from './StatusNotice';

export function SceneHotspotPanel({ themeId, sceneId }: { themeId: string; sceneId?: string }) {
  const exact = sceneId ? findScene(sceneId) : null;
  const scene = sceneId ? (exact?.ok && exact.data.theme_id === themeId ? exact.data : null) : sceneForTheme(themeId);
  const [active, setActive] = useState<SceneHotspot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const request = useRef(0);
  const activeLine = useRef<HTMLDivElement | null>(null);
  const ready = useAppStore(v => v.status === 'ready');
  const autoplay = useAppStore(v => v.snapshot?.settings?.scene_autoplay ?? true);
  const played = useRef<string | null>(null);

  const speakOne = useCallback(async (hotspot: SceneHotspot) => {
    if (!scene) return;
    played.current = scene.scene_id;
    const id = ++request.current;
    cancelSpeech();
    cancelAudio();
    setPlaying(true);
    setActive(hotspot);
    setNotice(null);
    try {
      const result = await speak(hotspot.label_en);
      if (request.current !== id) return;
      if (!result.ok) setNotice('暂时没有声音，可以照文字说。');
    } finally {
      if (request.current === id) setPlaying(false);
    }
  }, [scene]);

  const speakAll = useCallback(async () => {
    if (!scene) return;
    played.current = scene.scene_id;
    const id = ++request.current;
    cancelSpeech();
    cancelAudio();
    setPlaying(true);
    setNotice(null);
    try {
      for (const hotspot of scene.hotspots) {
        if (request.current !== id) return;
        setActive(hotspot);
        const result = await speak(hotspot.label_en);
        if (request.current !== id) return;
        if (!result.ok) {
          setNotice('播放中断了；点击整张图片可以从头再听。');
          return;
        }
      }
    } finally {
      if (request.current === id) setPlaying(false);
    }
  }, [scene]);

  useEffect(() => {
    if (!ready || !autoplay || !scene?.hotspots.length) return;
    const timer = window.setTimeout(() => {
      if (played.current === scene.scene_id) return;
      void speakAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready, autoplay, scene, speakAll]);

  useEffect(() => {
    if (active) activeLine.current?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  useEffect(() => () => {
    request.current++;
    cancelSpeech();
    cancelAudio();
  }, []);

  if (!scene) return <StatusNotice error message="没有找到这个场景图。"/>;

  return <section className="card" aria-label="场景图片教学" aria-busy={playing}>
    <h2>点一点，听一听</h2>
    <p>{scene.dialogue ? '点击整张图片，按顺序听下面的语句；点击单句可重听。每次只播放一轮。' : '点击整张图片，按顺序听图中的词语。每次只播放一轮。'}</p>
    <div className="scene-frame">
      <button className="scene-picture-target" type="button" aria-label={scene.dialogue ? '按顺序播放图片下的全部语句' : '按顺序播放图中的词语'} onClick={() => void speakAll()}>
        <img className="scene-preview" src={scene.dialogue ? scene.image_path.replace('scenes/', 'scenes/observation/') : scene.image_path} alt={scene.alt_zh}/>
      </button>
    </div>
    {scene.dialogue && <div className="scene-dialogue" role="list" aria-label="场景对话">
      {scene.hotspots.map(h => <div role="listitem" ref={active?.hotspot_id === h.hotspot_id ? activeLine : null}
        id={`${scene.scene_id}-${h.hotspot_id}-line`} key={h.hotspot_id}
        className={'scene-dialogue-line' + (active?.hotspot_id === h.hotspot_id ? ' is-active' : '')}
        aria-current={active?.hotspot_id === h.hotspot_id ? 'true' : undefined}>
        <button type="button" className="dialogue-play" aria-label={`播放 ${h.label_en}`} onClick={() => void speakOne(h)}>
          <SpeakerIcon/><span lang="en-US">{h.label_en}</span>
        </button>
      </div>)}
    </div>}
    {notice && <StatusNotice message={notice}/>}
    <p><small>点读帮助熟悉词语，不计入记录与周报。点击只播放已有标注语句，不识别孩子表现。</small></p>
  </section>;
}
