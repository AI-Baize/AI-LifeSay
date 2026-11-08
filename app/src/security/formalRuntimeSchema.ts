import type { Manifest } from './formalLevelImport';
export type RuntimeLine={speaker:string;text_en:string;text_zh:string;audio:string};
export type RuntimeFrame={image:string;lines:RuntimeLine[]};
export type RuntimeScene={scene_id:string;title:string;category:string;category_title:string;frame_indexes:number[]};
export type RuntimeLesson={schema:'lifesay-runtime-course-v1';level_id:string;level_version:string;approval_ref:string;title:string;frames:RuntimeFrame[];scenes?:RuntimeScene[]};
export const runtimeCatalogPath = 'runtime/catalog.json';
export const runtimeScenePath = (id: string) => `runtime/scenes/${id}.json`;
export const maxRuntimeScenes = 128;
export const maxRuntimeJsonBytes = 1024 * 1024;
export type RuntimeCatalogScene = {
 scene_id: string; title: string; category: string; category_title: string;
 cover: string; frame_count: number; line_count: number; search: string[];
};
const exact=(value:unknown,keys:string[]): value is Record<string,unknown> => !!value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).sort().join('|')===[...keys].sort().join('|');
const clean=(v:unknown,max:number):v is string=>typeof v==='string' && v.trim().length>0 && v.length<=max && ![...v].some(c=>c.charCodeAt(0)<32||c.charCodeAt(0)===127||c==='<'||c==='>') && !/(?:https?:\/\/|file:|[a-z]:\\|\.\.\/|<script)/i.test(v);
const resourcePath=(v:unknown):v is string=>typeof v==='string' && /^media\/[a-zA-Z0-9_-]+\.(?:png|webp|jpg|mp3|wav)$/.test(v);

export function validateRuntimeCatalog(raw: unknown, manifest: Manifest): RuntimeCatalogScene[] {
 if (!exact(raw, ['schema', 'level_id', 'level_version', 'approval_ref', 'scenes']) ||
     raw.schema !== 'lifesay-runtime-v2' || raw.level_id !== manifest.level_id ||
     raw.level_version !== manifest.level_version || raw.approval_ref !== manifest.approval_ref ||
     !Array.isArray(raw.scenes) || !raw.scenes.length || raw.scenes.length > maxRuntimeScenes) throw Error('课程目录格式无效');
 const resources = new Map(manifest.resources.map(resource => [resource.path, resource]));
 const ids = new Set<string>();
 const categories = new Map<string, string>();
 const scenes: RuntimeCatalogScene[] = [];
 for (const scene of raw.scenes) {
  if (!exact(scene, ['scene_id', 'title', 'category', 'category_title', 'cover', 'frame_count', 'line_count', 'search']) ||
      typeof scene.scene_id !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(scene.scene_id) || ids.has(scene.scene_id) ||
      !clean(scene.title, 100) || typeof scene.category !== 'string' || !/^(?:C0[1-3]|T(?:0[1-9]|1[0-9]|2[0-4]))$/.test(scene.category) ||
      !clean(scene.category_title, 100) || !resourcePath(scene.cover) ||
      !resources.get(scene.cover)?.mime.startsWith('image/') || !resources.has(runtimeScenePath(scene.scene_id)) ||
      typeof scene.frame_count !== 'number' || !Number.isInteger(scene.frame_count) || scene.frame_count < 1 || scene.frame_count > 20 ||
      typeof scene.line_count !== 'number' || !Number.isInteger(scene.line_count) || scene.line_count < scene.frame_count || scene.line_count > Math.min(120, scene.frame_count * 12) ||
      !Array.isArray(scene.search) || scene.search.length > 240 || !scene.search.every(term => clean(term, 400))) throw Error('场景目录字段无效');
  if (categories.has(scene.category) && categories.get(scene.category) !== scene.category_title) throw Error('课程主题名称不一致');
  categories.set(scene.category, scene.category_title);
  ids.add(scene.scene_id);
  scenes.push(scene as RuntimeCatalogScene);
 }
 if (manifest.resources.filter(resource => resource.path.startsWith('runtime/scenes/')).length !== ids.size) throw Error('场景目录与签名清单不一致');
 return scenes;
}
export function validateRuntimeScenes(raw:unknown,frameCount:number):RuntimeScene[]{
 if(!Array.isArray(raw)||raw.length<1||raw.length>20)throw Error('场景目录格式无效');
 const ids=new Set<string>(),used=new Set<number>();const scenes:RuntimeScene[]=[];
 for(const s of raw){
  if(!exact(s,['scene_id','title','category','category_title','frame_indexes'])||typeof s.scene_id!=='string'||!/^[A-Za-z0-9-]{1,80}$/.test(s.scene_id)||ids.has(s.scene_id)||!clean(s.title,100)||typeof s.category!=='string'||!/^(?:C0[1-3]|T(?:0[1-9]|1[0-9]|2[0-4]))$/.test(s.category)||!clean(s.category_title,100)||!Array.isArray(s.frame_indexes)||!s.frame_indexes.length)throw Error('场景目录字段无效');
  ids.add(s.scene_id);for(const i of s.frame_indexes){if(!Number.isInteger(i)||i<0||i>=frameCount||used.has(i))throw Error('场景分页对应无效');used.add(i);}
  scenes.push({scene_id:s.scene_id,title:s.title,category:s.category,category_title:s.category_title,frame_indexes:s.frame_indexes as number[]});
 }
 if(used.size!==frameCount)throw Error('场景分页不完整');return scenes;
}
export function validateRuntimeLesson(raw:unknown,manifest:Manifest):RuntimeLesson{
 const keys=['schema','level_id','level_version','approval_ref','title','frames'];
 if(!exact(raw,raw&&typeof raw==='object'&&'scenes' in raw?[...keys,'scenes']:keys)||raw.schema!=='lifesay-runtime-course-v1'||raw.level_id!==manifest.level_id||raw.level_version!==manifest.level_version||raw.approval_ref!==manifest.approval_ref||!clean(raw.approval_ref,100)||!clean(raw.title,100)||!Array.isArray(raw.frames)||raw.frames.length<1||raw.frames.length>20)throw Error('课程运行数据格式无效');
 const resources=new Map(manifest.resources.map(r=>[r.path,r]));let count=0;const frames:RuntimeFrame[]=[];
 for(const f of raw.frames){
  if(!exact(f,['image','lines'])||!resourcePath(f.image)||!Array.isArray(f.lines)||f.lines.length<1||f.lines.length>12)throw Error('课程图片或语句格式无效');
  const img=resources.get(f.image);if(!img||!['image/png','image/webp','image/jpeg'].includes(img.mime))throw Error('课程图片未包含在签名清单');
  const lines:RuntimeLine[]=[];for(const l of f.lines){
   if(!exact(l,['speaker','text_en','text_zh','audio'])||!clean(l.speaker,60)||!clean(l.text_en,400)||!clean(l.text_zh,400)||!resourcePath(l.audio))throw Error('课程语句格式无效');
   const a=resources.get(l.audio);if(!a||!['audio/mpeg','audio/wav'].includes(a.mime))throw Error('课程音频未包含在签名清单');
   if(++count>120)throw Error('课程语句过多');lines.push({speaker:l.speaker,text_en:l.text_en,text_zh:l.text_zh,audio:l.audio});
  }
  frames.push({image:f.image,lines});
 }
 return {schema:'lifesay-runtime-course-v1',level_id:manifest.level_id,level_version:manifest.level_version,approval_ref:raw.approval_ref,title:raw.title,frames,...(raw.scenes?{scenes:validateRuntimeScenes(raw.scenes,frames.length)}:{})};
}
