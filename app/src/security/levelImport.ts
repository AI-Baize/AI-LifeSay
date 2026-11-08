// Isolated test protocol only. This store is separate from free courses and old licenses.
import Dexie from 'dexie';
import { Capacitor, registerPlugin } from '@capacitor/core';
import trust from './test-level-trust.json';
import { getDevice } from './courseVault';
import { base64, unbase64, sha256, verifyEnvelope, encode, type SignedEnvelope } from './protocol';
type Resource={path:string;mime:string;file:string;bytes:number;sha256:string;nonce:string;wrapped_rk:{nonce:string;ciphertext:string}};
type Manifest={schema:number;level_id:string;level_version:string;resources:Resource[]};
type License={schema:string;license_id:string;product_id:string;app_id:string;device_fingerprint:string;perpetual:boolean;levels:{level_id:string;level_version:string;manifest_hash:string;wrapped_lk:string}[]};
type Installed={id:string;manifest:Manifest;hash:string;files:Record<string,Uint8Array<ArrayBuffer>>};
const db=new Dexie('aienglish-level-test-v2');db.version(1).stores({levels:'id',licenses:'id'});
const native=registerPlugin<{identity():Promise<{spki:string}>;unwrap(v:{label:string;wrapped:string}):Promise<{key:string}>}>('DeviceApplication');
const safe=(p:string)=>{if(!p||p.length>512||p.includes('\\')||p.includes(':')||p.startsWith('/')||p.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('资源路径不安全');return p;};
const parse=(b:Uint8Array)=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));
export async function browserTestRequest(){const d=await getDevice();return {schema_version:2,product_id:'aienglish',app_id:'aienglish-test',app_version:'test-1',request_id:crypto.randomUUID(),public_key_spki:base64(await crypto.subtle.exportKey('spki',d.publicKey))};}
// Current issuer ZIP is ZIP_STORED. Deliberately reject deflate/ZIP64/encrypted ZIP.
// 64MiB mobile test limit; no arbitrary filesystem extraction, no active content execution.
export async function importLevelArchive(file:File){
 if(file.size>64*1024*1024)throw Error('测试包上限64MiB，请使用分片测试包');
 const bytes=new Uint8Array(await file.arrayBuffer()),v=new DataView(bytes.buffer);const files:Record<string,Uint8Array<ArrayBuffer>>={};let pos=0,total=0;
 while(pos+30<=bytes.length&&v.getUint32(pos,true)===0x04034b50){
  const flags=v.getUint16(pos+6,true),method=v.getUint16(pos+8,true),size=v.getUint32(pos+18,true),raw=v.getUint32(pos+22,true),nl=v.getUint16(pos+26,true),extra=v.getUint16(pos+28,true);
  if((flags&9)!==0||method!==0||size!==raw||size>16*1024*1024)throw Error('压缩格式不兼容测试协议');
  const start=pos+30+nl+extra;if(start+size>bytes.length)throw Error('资源包不完整');
  const name=safe(new TextDecoder('utf-8',{fatal:true}).decode(bytes.slice(pos+30,pos+30+nl)));
  if(Object.hasOwn(files,name)||Object.keys(files).length>=4096)throw Error('重复或过多资源');
  files[name]=bytes.slice(start,start+size);total+=size;if(total>64*1024*1024)throw Error('解包大小超限');pos=start+size;
 }
 if(!files['major-index.json'])throw Error('缺少签名索引');
 const outer=await verifyEnvelope<{schema:string;macro_grade:string;levels:{level_id:string;level_version:string;manifest_hash:string;manifest:string}[];files:Record<string,{sha256:string;bytes:number}>}>(parse(files['major-index.json']),trust);
 if(outer.value.schema!=='aienglish-major-zip-v1'||!/^SG0[1-3]$/.test(outer.value.macro_grade)||outer.value.levels.length!==4)throw Error('大级协议无效');
 if(Object.keys(files).length!==Object.keys(outer.value.files).length+1)throw Error('存在未登记文件');
 for(const [p,meta] of Object.entries(outer.value.files)){safe(p);if(!files[p]||files[p].length!==meta.bytes||await sha256(files[p])!==meta.sha256)throw Error('资源文件校验失败');}
 const staged:Installed[]=[];const seen=new Set<string>();const covered=new Set<string>();
 for(const l of outer.value.levels){
  if(!new RegExp(`^${outer.value.macro_grade}\\.0[1-4]$`).test(l.level_id)||seen.has(l.level_id)||l.manifest!==`levels/${l.level_id}/manifest.json`)throw Error('小级列表无效');seen.add(l.level_id);covered.add(l.manifest);
  const child=await verifyEnvelope<Manifest>(parse(files[l.manifest]!),trust),m=child.value;
  if(m.schema!==2||m.level_id!==l.level_id||m.level_version!==l.level_version||child.hash!==l.manifest_hash||!Array.isArray(m.resources))throw Error('小级清单不匹配');
  const content:Installed['files']={};const paths=new Set<string>();
  for(const r of m.resources){safe(r.path);safe(r.file);if(paths.has(r.path)||r.file!==`blobs/${r.sha256}.bin`||unbase64(r.nonce).length!==12)throw Error('资源描述无效');paths.add(r.path);const p=`levels/${l.level_id}/${r.file}`;covered.add(p);const b=files[p];if(!b||b.length!==r.bytes||await sha256(b)!==r.sha256)throw Error('密文损坏');content[r.file]=b;}
  staged.push({id:`${m.level_id}:${child.hash}`,manifest:m,hash:child.hash,files:content});
 }
 if(covered.size!==Object.keys(outer.value.files).length)throw Error('存在清单以外资源');
 await db.transaction('rw',db.table('levels'),async()=>{for(const row of staged)await db.table('levels').put(row);});
 return staged.map(s=>s.manifest.level_id);
}
export async function importLevelLicense(file:File){
 if(file.size>65536)throw Error('许可文件过大');
 const signed=JSON.parse(await file.text()) as SignedEnvelope;const {value:l}=await verifyEnvelope<License>(signed,trust);
 const spki=Capacitor.isNativePlatform()?(await native.identity()).spki:base64(await crypto.subtle.exportKey('spki',(await getDevice()).publicKey));
 if(l.schema!=='aienglish-license-v2'||l.app_id!=='aienglish-test'||l.product_id!=='aienglish'||l.perpetual!==true||l.device_fingerprint!==await sha256(unbase64(spki))||!Array.isArray(l.levels))throw Error('许可不属于本设备或测试协议');
 if(!/^[A-Za-z0-9-]{1,80}$/.test(l.license_id))throw Error('许可编号无效');
 await db.table('licenses').put({id:`${l.device_fingerprint}:${l.license_id}`,signed});
}
async function decrypt(key:CryptoKey,nonce:string,data:Uint8Array<ArrayBuffer>,aad:unknown[]){return crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(nonce),additionalData:encode(JSON.stringify(aad))},key,data);}
export async function previewInstalled(){
 const rows=await db.table<Installed>('levels').toArray();const results:{id:string;text:string}[]=[];
 for(const row of rows){
  const spki=Capacitor.isNativePlatform()?(await native.identity()).spki:base64(await crypto.subtle.exportKey('spki',(await getDevice()).publicKey));const fp=await sha256(unbase64(spki));
  const stored=await db.table('licenses').toArray();if(!stored.length){results.push({id:row.id,text:'资源已安装，等待本机许可'});continue;}
  let e:License['levels'][number]|undefined;
  for(const saved of stored){const {value:l}=await verifyEnvelope<License>(saved.signed,trust);if(l.device_fingerprint!==fp||l.schema!=='aienglish-license-v2'||l.product_id!=='aienglish'||l.app_id!=='aienglish-test'||l.perpetual!==true)continue;e=l.levels.find(x=>x.level_id===row.manifest.level_id&&x.manifest_hash===row.hash&&x.level_version===row.manifest.level_version);if(e)break;}
  if(!e){results.push({id:row.id,text:'此小级尚未授权'});continue;}
  const label=encode(JSON.stringify(['aienglish-lk-v2',e.level_id,e.level_version,e.manifest_hash,fp]));
  let lk:CryptoKey;
  if(Capacitor.isNativePlatform()){const raw=unbase64((await native.unwrap({label:base64(label.buffer),wrapped:e.wrapped_lk})).key);lk=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);raw.fill(0);}
  else lk=await crypto.subtle.unwrapKey('raw',unbase64(e.wrapped_lk),(await getDevice()).privateKey,{name:'RSA-OAEP',label},{name:'AES-GCM',length:256},false,['decrypt']);
  for(const r of row.manifest.resources){const rkRaw=await decrypt(lk,r.wrapped_rk.nonce,unbase64(r.wrapped_rk.ciphertext),['aienglish-rk-v2',e.level_id,e.level_version,r.path]);const rk=await crypto.subtle.importKey('raw',rkRaw,'AES-GCM',false,['decrypt']);new Uint8Array(rkRaw).fill(0);const plain=await decrypt(rk,r.nonce,row.files[r.file]!,['aienglish-resource-v2',e.level_id,e.level_version,r.path,r.mime]);results.push({id:`${row.id}/${r.path}`,text:r.mime==='text/plain'?new TextDecoder().decode(plain):'已解密资源（测试预览仅显示纯文本）'});}
 }
 return results;
}
