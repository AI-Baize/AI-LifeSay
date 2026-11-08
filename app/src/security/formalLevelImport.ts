// Candidate V3 protocol, isolated database and pinned production trust. No test-key fallback.
import Dexie from 'dexie';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { validateFormalLicense } from './formalLicenseSchema';
import { formalTrust, isOperationTestBuild, isLocalProductionAcceptanceBuild, isFormalIdentityVerificationBuild } from './formalLevelTrust';
import { maxRuntimeJsonBytes, maxRuntimeScenes, runtimeCatalogPath, runtimeScenePath, validateRuntimeCatalog, validateRuntimeLesson } from './formalRuntimeSchema';
import { unbase64, sha256, verifyEnvelope, encode, SignatureVerificationError, type SignedEnvelope } from './protocol';
export type Resource={path:string;mime:string;file:string;bytes:number;sha256:string;nonce:string;wrapped_rk:{nonce:string;ciphertext:string}};
export type Manifest={profile?:string;release_status?:string;approval_ref?:string;schema:number;product_id:string;app_id:string;level_id:string;level_version:string;resources:Resource[]};
export type License={schema:string;request_id:string;license_id:string;product_id:string;app_id:string;device_fingerprint:string;perpetual:boolean;environment?:string;project_id?:string;levels:{level_id:string;level_version:string;manifest_hash:string;wrapped_lk:string}[]};
type Installed={id:string;signed:SignedEnvelope;manifest:Manifest;hash:string;blobPrefix?:string;files?:Record<string,Uint8Array<ArrayBuffer>>;archiveName?:string;importedAt?:number};
const db=new Dexie('lifesay-formal-level-v3');db.version(1).stores({levels:'id',licenses:'id'});db.version(2).stores({levels:'id',licenses:'id',blobs:'id'});
const native=registerPlugin<{identity():Promise<{spki:string}>;unwrapFormal(v:{wrapped:string}):Promise<{key:string}>;formalIdentity():Promise<{spki:string;environment?:string}>;hasFormalRequest(v:{requestId:string}):Promise<{known:boolean}>}>('DeviceApplication');
const safe=(p:string)=>{if(!p||p.length>512||p.includes('\\')||p.includes(':')||p.startsWith('/')||p.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('资源路径不安全');return p;};
const parse=(b:Uint8Array)=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));
async function verifyImportedFile<T>(signed: SignedEnvelope, trust: JsonWebKey, kind: 'archive' | 'license') {
 try { return await verifyEnvelope<T>(signed, trust); }
 catch (error) {
  if (!(error instanceof SignatureVerificationError)) throw error;
  if (kind === 'license') throw Error('设备许可验签失败，请获取由当前 App 环境签发的原始许可。');
  // This field is untrusted and only selects an error message. All failed signatures are rejected.
  let legacy = false;
  try { legacy = parse(unbase64(signed.payload))?.schema === 2; } catch { /* Report the generic signature error. */ }
  if (legacy) throw Error('该资源包采用旧版内部档案格式，请获取适用于当前 App 的课程运行包。');
  throw Error('课程资源包验签失败，请确认资源包适用于当前 App 环境，或重新获取原文件。');
 }
}
function assertRuntimeManifest(m:Manifest){
 const allowedStatus=m.release_status==='approved'||(isOperationTestBuild()&&m.release_status==='internal_test'&&m.approval_ref==='INTERNAL-TEST-ONLY')||(isLocalProductionAcceptanceBuild()&&m.release_status==='local_production_acceptance'&&m.approval_ref==='LOCAL-PRODUCTION-ACCEPTANCE-20261106')||
  (isFormalIdentityVerificationBuild()&&m.release_status==='formal_identity_verification'&&m.approval_ref==='FORMAL-IDENTITY-VERIFICATION-ONLY');
 const segmented = m.profile === 'lifesay-runtime-v2';
 if((!segmented && m.profile!=='lifesay-runtime-v1')||!allowedStatus||typeof m.approval_ref!=='string'||!/^[A-Za-z0-9._-]{1,100}$/.test(m.approval_ref)||!Array.isArray(m.resources)||!m.resources.length)throw Error('课程尚无可用的运行审阅标记');
 const types: Record<string,string> = {png:'image/png',webp:'image/webp',jpg:'image/jpeg',mp3:'audio/mpeg',wav:'audio/wav'};
 const indexPath = segmented ? runtimeCatalogPath : 'runtime.json';
 let indexes = 0, scenes = 0;
 for (const resource of m.resources) {
  if (resource.path === indexPath || (segmented && /^runtime\/scenes\/[A-Za-z0-9-]{1,80}\.json$/.test(resource.path))) {
   if (resource.mime !== 'application/json' || resource.bytes > maxRuntimeJsonBytes + 16) throw Error('课程运行数据过大或格式无效');
   if (resource.path === indexPath) indexes++;
   else scenes++;
   continue;
  }
  const match = /^media\/[A-Za-z0-9_-]+\.(png|webp|jpg|mp3|wav)$/.exec(resource.path);
  if (!match || resource.mime !== types[match[1]!]) throw Error('课程包含未批准类型的资源');
 }
 if (indexes !== 1 || (segmented && (scenes < 1 || scenes > maxRuntimeScenes))) throw Error('课程运行清单不完整');
}
// Read ZIP_STORED entries in bounded slices; no untrusted filesystem extraction.
// A 1 GiB archive, 4096 entries and 16 MiB per file are explicit safety limits.
export async function importFormalLevelArchive(file:File){
 const trust=formalTrust();if(!Capacitor.isNativePlatform())throw Error('正式资源仅支持Android设备');
 if(file.size>1024*1024*1024)throw Error('资源包超过1 GiB限制');
 type Entry={offset:number;size:number};const entries:Record<string,Entry>=Object.create(null);let pos=0,total=0,count=0;
 const read=async(e:Entry)=>new Uint8Array(await file.slice(e.offset,e.offset+e.size).arrayBuffer());
 while(pos+30<=file.size){
  const h=new DataView(await file.slice(pos,pos+30).arrayBuffer());if(h.getUint32(0,true)!==0x04034b50)break;
  const flags=h.getUint16(6,true),method=h.getUint16(8,true),size=h.getUint32(18,true),raw=h.getUint32(22,true),nl=h.getUint16(26,true),extra=h.getUint16(28,true);
  if((flags&9)!==0||method!==0||size!==raw||size>16*1024*1024||!nl||nl>2048)throw Error('资源包格式暂不受支持');
  const start=pos+30+nl+extra;if(start+size>file.size)throw Error('资源包不完整');
  const name=safe(new TextDecoder('utf-8',{fatal:true}).decode(await file.slice(pos+30,pos+30+nl).arrayBuffer()));
  if(Object.hasOwn(entries,name)||++count>4096)throw Error('重复或过多资源');entries[name]={offset:start,size};total+=size;if(total>1024*1024*1024)throw Error('解包大小超限');pos=start+size;
 }
 async function contents(path:string){const entry=entries[path];if(!entry)throw Error('资源包缺少文件');return read(entry);}
 const staged:Installed[]=[];const covered=new Set<string>();const resources:{id:string;path:string;sha256:string;bytes:number}[]=[];
 const prefix=crypto.randomUUID()+':';
 const importedAt=Date.now();
 async function stage(manifestPath:string,expected?:{level_id:string;level_version:string;manifest_hash:string}) {
  const envelope=await contents(manifestPath);if(envelope.length>4*1024*1024)throw Error('清单过大');
  const signed=parse(envelope) as SignedEnvelope;const child=await verifyImportedFile<Manifest>(signed,trust,'archive'),m=child.value;
  if(m.schema!==3||m.app_id!=='org.aibaize.lifesay'||m.product_id!=='aienglish'||!/^SG0[1-3]\.0[1-4]$/.test(m.level_id)||typeof m.level_version!=='string'||!m.level_version||m.level_version.length>80||!Array.isArray(m.resources)||!m.resources.length||m.resources.length>4095||(expected&&(m.level_id!==expected.level_id||m.level_version!==expected.level_version||child.hash!==expected.manifest_hash)))throw Error('小级清单不匹配');
  assertRuntimeManifest(m);
  covered.add(manifestPath);const pathPrefix=manifestPath==='manifest.json'?'':`levels/${m.level_id}/`;const paths=new Set<string>();
  for(const r of m.resources){safe(r.path);safe(r.file);if(paths.has(r.path)||!/^[a-f0-9]{64}$/.test(r.sha256)||r.file!==`blobs/${r.sha256}.bin`||unbase64(r.nonce).length!==12||!Number.isSafeInteger(r.bytes)||r.bytes<16||typeof r.mime!=='string'||!r.mime||!r.wrapped_rk||unbase64(r.wrapped_rk.nonce).length!==12||unbase64(r.wrapped_rk.ciphertext).length!==48)throw Error('资源描述无效');paths.add(r.path);const path=pathPrefix+r.file;covered.add(path);if(!entries[path]||entries[path].size!==r.bytes)throw Error('密文缺失或长度无效');resources.push({id:prefix+m.level_id+':'+r.file,path,sha256:r.sha256,bytes:r.bytes});}
  staged.push({id:`${m.level_id}:${child.hash}`,signed,manifest:m,hash:child.hash,blobPrefix:prefix+m.level_id+':',archiveName:file.name,importedAt});
 }
 if(entries['major-index.json']){
  const indexBytes=await contents('major-index.json');if(indexBytes.length>4*1024*1024)throw Error('清单过大');
  const outer=await verifyImportedFile<{schema:string;macro_grade:string;levels:{level_id:string;level_version:string;manifest_hash:string;manifest:string}[];files:Record<string,{sha256:string;bytes:number}>}>(parse(indexBytes),trust,'archive');
  if(outer.value.schema!=='lifesay-major-zip-v3'||!/^SG0[1-3]$/.test(outer.value.macro_grade)||!Array.isArray(outer.value.levels)||outer.value.levels.length!==4||!outer.value.files||typeof outer.value.files!=='object')throw Error('大级协议无效');
  if(Object.keys(entries).length!==Object.keys(outer.value.files).length+1)throw Error('存在未登记文件');
  for(const [p,meta] of Object.entries(outer.value.files)){safe(p);if(!entries[p]||entries[p].size!==meta.bytes||await sha256(await contents(p))!==meta.sha256)throw Error('资源文件校验失败');}
  const seen=new Set<string>();for(const l of outer.value.levels){if(!new RegExp(`^${outer.value.macro_grade}\\.0[1-4]$`).test(l.level_id)||seen.has(l.level_id)||l.manifest!==`levels/${l.level_id}/manifest.json`)throw Error('小级列表无效');seen.add(l.level_id);await stage(l.manifest,l);}
  if(covered.size!==Object.keys(outer.value.files).length||[...covered].some(p=>!Object.hasOwn(outer.value.files,p)))throw Error('存在清单以外资源');
 }else{await stage('manifest.json');if(covered.size!==Object.keys(entries).length||[...covered].some(p=>!Object.hasOwn(entries,p)))throw Error('存在清单以外资源');}
 // Write into a unique generation first. Commit visible level metadata together only after
 // all ciphertext is authenticated and stored. Previous installed versions remain usable.
 const previousPrefixes:string[]=[];
 try{
  for(const r of resources){const b=await contents(r.path);if(b.length!==r.bytes||await sha256(b)!==r.sha256)throw Error('密文损坏');await db.table('blobs').put({id:r.id,bytes:b});}
  await db.transaction('rw',db.table('levels'),async()=>{for(const row of staged){const previous=await db.table<Installed>('levels').get(row.id);if(previous?.blobPrefix)previousPrefixes.push(previous.blobPrefix);await db.table('levels').put(row);}});
 }catch(e){await db.table('blobs').where('id').startsWith(prefix).delete();throw e;}
 // Cleanup is best-effort after the new generation is committed; abrupt termination may leave orphaned ciphertext.
 for(const old of previousPrefixes){try{await db.table('blobs').where('id').startsWith(old).delete();}catch{/* The new generation remains valid. */}}
 if(typeof window!=='undefined')window.dispatchEvent(new Event('lifesay-resources-changed'));
 return staged.map(s=>s.manifest.level_id);
}
export async function importFormalLevelLicense(file:File){
 const trust=formalTrust();
 if(!Capacitor.isNativePlatform())throw Error('正式许可仅支持Android设备');
 if(file.size>65536)throw Error('许可文件过大');
 const signed=JSON.parse(await file.text()) as SignedEnvelope;const {value:l}=await verifyImportedFile<License>(signed,trust,'license');
 const identity=await native.formalIdentity();const spki=identity.spki;validateFormalLicense(l,identity.environment);
 if(!['lifesay-license-v3','lifesay-license-v4'].includes(l.schema)||l.app_id!=='org.aibaize.lifesay'||l.product_id!=='aienglish'||l.perpetual!==true||l.device_fingerprint!==await sha256(unbase64(spki))||!Array.isArray(l.levels))throw Error('许可不属于本设备或正式候选协议');
 if(!/^[A-Za-z0-9-]{1,80}$/.test(l.request_id)||!/^[A-Za-z0-9-]{1,80}$/.test(l.license_id)||!(await native.hasFormalRequest({requestId:l.request_id})).known)throw Error('许可申请编号不属于本机');
 await db.table('licenses').put({id:`${l.device_fingerprint}:${l.license_id}`,signed});
 if(typeof window!=='undefined')window.dispatchEvent(new Event('lifesay-resources-changed'));
}
async function decrypt(key:CryptoKey,nonce:string,data:Uint8Array<ArrayBuffer>,aad:unknown[]){return crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(nonce),additionalData:encode(JSON.stringify(aad))},key,data);}
export async function decryptFormalResource(lk:CryptoKey,entry:License['levels'][number],r:Resource,cipher:Uint8Array<ArrayBuffer>){
 if(cipher.length!==r.bytes||await sha256(cipher)!==r.sha256)throw Error('本机资源损坏');
 const rkRaw=await decrypt(lk,r.wrapped_rk.nonce,unbase64(r.wrapped_rk.ciphertext),['lifesay-rk-v3',entry.level_id,entry.level_version,r.path]);
 const rk=await crypto.subtle.importKey('raw',rkRaw,'AES-GCM',false,['decrypt']);new Uint8Array(rkRaw).fill(0);
 return decrypt(rk,r.nonce,cipher,['lifesay-resource-v3',entry.level_id,entry.level_version,r.path,r.mime]);
}
export async function verifyFormalPair(manifest:SignedEnvelope,license:SignedEnvelope,trust:JsonWebKey,fp:string,requestId:string,expectedEnvironment:string='production'){
 const m=await verifyEnvelope<Manifest>(manifest,trust), l=(await verifyEnvelope<License>(license,trust)).value;validateFormalLicense(l,expectedEnvironment);
 if(m.value.schema!==3||m.value.app_id!=='org.aibaize.lifesay'||m.value.product_id!=='aienglish'||!['lifesay-license-v3','lifesay-license-v4'].includes(l.schema)||l.product_id!=='aienglish'||l.app_id!=='org.aibaize.lifesay'||l.device_fingerprint!==fp||l.request_id!==requestId||l.perpetual!==true||!Array.isArray(l.levels))throw Error('许可不属于本设备或正式候选协议');
 const entry=l.levels.find(x=>x.level_id===m.value.level_id&&x.level_version===m.value.level_version&&x.manifest_hash===m.hash);if(!entry)throw Error('小级未授权或版本不匹配');return {manifest:m.value,entry};
}
async function authorizedRow(id:string){
 const trust=formalTrust();if(!Capacitor.isNativePlatform())throw Error('课程仅支持Android设备');
 if(!/^SG0[1-3]\.0[1-4]:[a-f0-9]{64}$/.test(id))throw Error('课程编号无效');
 const row=await db.table<Installed>('levels').get(id);if(!row)throw Error('没有找到课程资源');
 const verified=await verifyEnvelope<Manifest>(row.signed,trust);const m=verified.value;
 if(verified.hash!==row.hash||id!==`${m.level_id}:${verified.hash}`||JSON.stringify(m)!==JSON.stringify(row.manifest)||m.schema!==3||m.app_id!=='org.aibaize.lifesay'||m.product_id!=='aienglish')throw Error('课程清单校验失败');assertRuntimeManifest(m);
 const identity=await native.formalIdentity();const fp=await sha256(unbase64(identity.spki));let entry:License['levels'][number]|undefined;
 for(const saved of await db.table('licenses').toArray()){
  const l=(await verifyEnvelope<License>(saved.signed,trust)).value;validateFormalLicense(l,identity.environment);
  if(l.device_fingerprint!==fp||!['lifesay-license-v3','lifesay-license-v4'].includes(l.schema)||l.product_id!=='aienglish'||l.app_id!=='org.aibaize.lifesay'||l.perpetual!==true||!Array.isArray(l.levels)||!(await native.hasFormalRequest({requestId:l.request_id})).known)continue;
  entry=l.levels.find(x=>x.level_id===m.level_id&&x.manifest_hash===row.hash&&x.level_version===m.level_version);if(entry)break;
 }
 if(!entry)throw Error('此课程尚未获得本机许可');return {row,entry};
}
export async function listFormalLevels(){
 formalTrust();if(!Capacitor.isNativePlatform())throw Error('课程仅支持Android设备');
 const rows=(await db.table<Installed>('levels').toArray()).sort((a,b)=>(b.importedAt??0)-(a.importedAt??0));
 const result:{id:string;level:string;version:string;archiveName:string;authorized:boolean;profile:string|undefined}[]=[];
 for(const row of rows){let authorized=false;try{await authorizedRow(row.id);authorized=true;}catch{/* The ciphertext remains available for a matching license. */}if(/^SG0[1-3]\.0[1-4]$/.test(row.manifest.level_id))result.push({id:row.id,level:row.manifest.level_id,version:row.manifest.level_version,archiveName:row.archiveName||row.manifest.level_id,authorized,profile:row.manifest.profile});}
 return result;
}
async function openAuthorizedResources({row, entry}: Awaited<ReturnType<typeof authorizedRow>>){
 const raw=unbase64((await native.unwrapFormal({wrapped:entry.wrapped_lk})).key);
 const lk=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']).finally(()=>raw.fill(0));
 async function readResource(path:string){const r=row.manifest.resources.find(x=>x.path===path);if(!r)throw Error('课程资源缺失');const b=row.blobPrefix?await db.table('blobs').get(row.blobPrefix+r.file):undefined;const content=b?.bytes??row.files?.[r.file];if(!content)throw Error('课程资源缺失');const plain=await decryptFormalResource(lk,entry,r,content);return {plain:new Uint8Array(plain),mime:r.mime};}
 async function json(path: string): Promise<unknown> {
  const {plain} = await readResource(path);
  try {
   if (plain.length > maxRuntimeJsonBytes) throw Error('课程运行数据过大');
   return parse(plain);
  } finally { plain.fill(0); }
 }
 async function media(path:string){
  if (!path.startsWith('media/')) throw Error('资源不属于课程');
  const {plain,mime}=await readResource(path);const n=plain.length;
  const ascii=(i:number,s:string)=>[...s].every((c,j)=>plain[i+j]===c.charCodeAt(0));
  const valid=(mime==='image/png'&&n>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>plain[i]===v))||(mime==='image/webp'&&n>=12&&ascii(0,'RIFF')&&ascii(8,'WEBP'))||(mime==='image/jpeg'&&n>=3&&plain[0]===255&&plain[1]===216&&plain[2]===255)||(mime==='audio/wav'&&n>=12&&ascii(0,'RIFF')&&ascii(8,'WAVE'))||(mime==='audio/mpeg'&&n>=3&&(ascii(0,'ID3')||(plain[0]===255&&((plain[1]??0)&224)===224)));
  if(!valid){plain.fill(0);throw Error('资源内容与类型不匹配');}const blob=new Blob([plain],{type:mime});plain.fill(0);return URL.createObjectURL(blob);
 }
 return {manifest:row.manifest,json,media};
}

async function openLegacyRuntime(opened: Awaited<ReturnType<typeof openAuthorizedResources>>) {
 const lesson = validateRuntimeLesson(await opened.json('runtime.json'), opened.manifest);
 const allowed = new Set(lesson.frames.flatMap(frame => [frame.image, ...frame.lines.map(line => line.audio)]));
 return {lesson, async media(path: string) {
  if (!allowed.has(path)) throw Error('资源不属于课程');
  return opened.media(path);
 }};
}

export async function openFormalRuntime(id: string) {
 return openLegacyRuntime(await openAuthorizedResources(await authorizedRow(id)));
}

export async function openFormalCatalog(id: string) {
 const opened = await openAuthorizedResources(await authorizedRow(id));
 return validateRuntimeCatalog(await opened.json(runtimeCatalogPath), opened.manifest);
}

export async function openFormalScene(id: string, sceneId: string) {
 const opened = await openAuthorizedResources(await authorizedRow(id));
 const catalog = validateRuntimeCatalog(await opened.json(runtimeCatalogPath), opened.manifest);
 const scene = catalog.find(item => item.scene_id === sceneId);
 if (!scene) throw Error('场景不属于当前课程');
 const lesson = validateRuntimeLesson(await opened.json(runtimeScenePath(sceneId)), opened.manifest);
 if (lesson.scenes || lesson.title !== scene.title || lesson.frames[0]?.image !== scene.cover ||
     lesson.frames.length !== scene.frame_count || lesson.frames.reduce((n, frame) => n + frame.lines.length, 0) !== scene.line_count) throw Error('场景与课程目录不一致');
 return {scene, frames: lesson.frames};
}

export async function openFormalMedia(id: string, path: string) {
 const grant = await authorizedRow(id);
 const opened = await openAuthorizedResources(grant);
 if (grant.row.manifest.profile !== 'lifesay-runtime-v2') return (await openLegacyRuntime(opened)).media(path);
 return opened.media(path);
}
