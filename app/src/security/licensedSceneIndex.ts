import { Capacitor } from '@capacitor/core';
import { listFormalLevels, openFormalCatalog, openFormalRuntime, openFormalScene } from './formalLevelImport';
import legacy from './legacySceneCatalog.json';
import { validateRuntimeScenes, type RuntimeFrame, type RuntimeScene } from './formalRuntimeSchema';
import type { CourseIndex, FormalScene, EventFrame, ListeningProgram } from '../product/formalCourseData';

const mediaReference = (packageId: string, path: string) => `__licensed/${encodeURIComponent(packageId)}/${path}`;

function sceneContent(packageId: string, sceneId: string, pages: RuntimeFrame[], indexes: number[]) {
 const lines: FormalScene['dialogue_lines'] = [];
 const frames: EventFrame[] = [];
 for (const [position, frameIndex] of indexes.entries()) {
  const frame = pages[frameIndex]!;
  const ids = frame.lines.map((line, i) => {
   const id = `${sceneId}-F${frameIndex}-L${i}`;
   lines.push({line_id:id,source_order:lines.length+1,speaker_label:line.speaker,text_en:line.text_en,text_zh:line.text_zh,audio_asset:mediaReference(packageId,line.audio),audio_enabled:true});
   return id;
  });
  frames.push({scene_id:sceneId,event_frame_id:`${sceneId}-F${frameIndex}`,index:position+1,branch_id:'common',line_ids:ids,image:`formal-v1.1/${mediaReference(packageId,frame.image)}`});
 }
 return {lines, frames};
}

export async function loadSegmentedListening(scene: FormalScene): Promise<ListeningProgram['lines']> {
 if (!scene.segmented) throw Error('没有找到分场景课程');
 const opened = await openFormalScene(scene.segmented.packageId, scene.scene_id);
 return sceneContent(scene.segmented.packageId, scene.scene_id, opened.frames, opened.frames.map((_, i) => i)).lines
  .map(line => ({id:line.line_id,text:line.text_en,audio_asset:line.audio_asset}));
}

export async function mergeLicensedScenes(base: CourseIndex, activeSceneId?: string): Promise<CourseIndex> {
 if (!Capacitor.isNativePlatform()) return base;
 const rows = (await listFormalLevels()).filter(row => row.authorized).sort((a,b) => b.version.localeCompare(a.version,undefined,{numeric:true}));
 const scenes = [...base.scenes], frames = [...base.event_frames], programs = [...(base.listening_programs ?? [])];
 const groups = {...base.groups}, seen = new Set(scenes.map(scene => scene.scene_id)), loadedLevels = new Set<string>();
 const unavailableLicensedLevels: string[] = [], unavailableLicensedScenes: string[] = [];
 const add = (scene: FormalScene, categoryTitle: string, pages: EventFrame[]) => {
  if (seen.has(scene.scene_id)) return;
  seen.add(scene.scene_id);
  groups[scene.category] = categoryTitle;
  scenes.push(scene);
  frames.push(...pages);
  programs.push({id:`${scene.scene_id}-immersion`,scene_id:scene.scene_id,kind:'immersion',title:scene.title,audio_mode:'recorded_dialogue',source:'authorized_runtime_mainline',lines:scene.dialogue_lines.map(line=>({id:line.line_id,text:line.text_en,audio_asset:line.audio_asset}))});
 };
 for (const row of rows) {
  if (loadedLevels.has(row.level)) continue;
  try {
   if (row.profile === 'lifesay-runtime-v2') {
    for (const entry of await openFormalCatalog(row.id)) {
     if (seen.has(entry.scene_id)) continue;
     const scene: FormalScene = {scene_id:entry.scene_id,title:entry.title,category:entry.category,runtime_enabled:true,licensed_level_id:row.level,
      segmented:{packageId:row.id,frames:entry.frame_count,lines:entry.line_count,search:entry.search},dialogue_lines:[]};
     let pages: EventFrame[] = [{scene_id:entry.scene_id,event_frame_id:`${entry.scene_id}-cover`,index:1,branch_id:'common',line_ids:[],image:`formal-v1.1/${mediaReference(row.id,entry.cover)}`}];
     if (activeSceneId === entry.scene_id) {
      try {
       const opened = await openFormalScene(row.id, entry.scene_id);
       const content = sceneContent(row.id, entry.scene_id, opened.frames, opened.frames.map((_, i) => i));
       scene.dialogue_lines = content.lines;
       pages = content.frames;
      } catch { unavailableLicensedScenes.push(entry.scene_id); continue; }
     }
     add(scene, entry.category_title, pages);
    }
   } else {
    const opened = await openFormalRuntime(row.id);
    const definitions = opened.lesson.scenes ?? (legacy as Record<string, RuntimeScene[]>)[row.id.split(':')[1]!];
    for (const entry of validateRuntimeScenes(definitions, opened.lesson.frames.length)) {
     const content = sceneContent(row.id, entry.scene_id, opened.lesson.frames, entry.frame_indexes);
     add({scene_id:entry.scene_id,title:entry.title,category:entry.category,runtime_enabled:true,licensed_level_id:row.level,dialogue_lines:content.lines},entry.category_title,content.frames);
    }
   }
   loadedLevels.add(row.level);
  } catch { unavailableLicensedLevels.push(row.level); }
 }
 return {...base,groups,scenes,event_frames:frames,listening_programs:programs,unavailableLicensedScenes,unavailableLicensedLevels};
}
