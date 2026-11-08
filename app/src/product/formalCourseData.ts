import { useEffect, useState } from 'react';
import { encryptedCourses, readEncryptedIndex } from '../security/courseVault';

export type FormalLine = { line_id: string; source_order: number; speaker_label: string; text_en: string; text_zh?: string; audio_asset: string; audio_enabled: boolean; branch_variants?: { branch_id: string; line_id: string; text_en: string; text_zh?: string; audio_asset: string }[] };
export type FormalScene = { scene_id: string; title: string; category: string; age_interest?: string[]; runtime_enabled: boolean; licensed_level_id?:string; segmented?: { packageId: string; frames: number; lines: number; search: string[] }; dialogue_lines: FormalLine[] };
export type EventFrame = { scene_id: string; event_frame_id: string; index: number; branch_id: string; line_ids: string[]; image: string };
export type WordCard = { asset_id: string; word_en: string; audio_asset?: string | null; source_scenes: string[]; image: string };
export type ListeningKind = 'immersion' | 'rhyme' | 'story' | 'song';
export type ListeningProgram = { id: string; scene_id: string; kind: ListeningKind; title: string; audio_mode: string; source: string; lines: { id: string; text: string; audio_asset?: string }[] };
export type CourseIndex = { revision_id: string; runtime_gate: { runtime_enabled: boolean; scope?: string }; groups: Record<string, string>; scenes: FormalScene[]; event_frames: EventFrame[]; word_cards: WordCard[]; listening_programs?: ListeningProgram[]; listening_availability?: { song?: { available: boolean; reason: string } }; unavailableLicensedScenes?: string[]; unavailableLicensedLevels?: string[] };
export const courseAssetBase = `${import.meta.env.BASE_URL}course-package/`;
export const formalPackageBase = `${courseAssetBase}formal-v1.1/`;

export function useCourseIndex(activeSceneId?: string) {
  const [index, setIndex] = useState<CourseIndex | null>(null);
  const [error, setError] = useState('');
  const [catalogNotice,setCatalogNotice]=useState('');
  useEffect(() => {
    let alive = true;let generation=0;let base:CourseIndex|null=null;
    const refresh=async()=>{
      const ticket=++generation;if(!base)return;
      if(import.meta.env.MODE!=='release-prep'){if(alive)setIndex(base);return;}
      try{const {mergeLicensedScenes}=await import('../security/licensedSceneIndex');const next=await mergeLicensedScenes(base, activeSceneId);if(alive&&ticket===generation){setIndex(next);setCatalogNotice(next.unavailableLicensedLevels?.length || next.unavailableLicensedScenes?.length ? '部分授权课程暂未载入，请检查对应资源包。' : '');}}
      catch{if(alive&&ticket===generation){setIndex(base);setCatalogNotice('授权场景暂未载入，请到我的检查资源与许可。');}}
    };
    (encryptedCourses ? readEncryptedIndex<CourseIndex>() : fetch(`${formalPackageBase}learning-index.json`).then(async response => {
      if (!response.ok) throw new Error('Course package unavailable');
      return await response.json() as CourseIndex;
    })).then(value => { base=value;if(alive&&import.meta.env.MODE!=='release-prep')setIndex(value);void refresh(); }).catch((error: unknown) => { if (alive) setError(encryptedCourses && error instanceof Error ? error.message : '课程暂时无法读取，请刷新页面重试。'); });
    window.addEventListener('lifesay-resources-changed',refresh);window.addEventListener('focus',refresh);
    return () => { alive = false;window.removeEventListener('lifesay-resources-changed',refresh);window.removeEventListener('focus',refresh); };
  }, [activeSceneId]);
  return { index, error,catalogNotice };
}
