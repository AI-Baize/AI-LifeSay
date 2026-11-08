// Resolve only the signed, authorized package referenced by a virtual asset URL.
const prefix=()=>`${import.meta.env.BASE_URL}course-package/formal-v1.1/__licensed/`;
export function isLicensedAsset(url:string){return url.startsWith(prefix());}
export async function licensedAssetUrl(url:string){
 if(!isLicensedAsset(url))throw Error('加密资源引用无效');
 const rest=url.slice(prefix().length),slash=rest.indexOf('/');
 if(slash<1)throw Error('加密资源引用无效');
 const id=decodeURIComponent(rest.slice(0,slash)),path=rest.slice(slash+1);
 if(!/^SG0[1-3]\.0[1-4]:[a-f0-9]{64}$/.test(id)||!/^media\/[A-Za-z0-9_-]+\.(?:png|webp|jpg|mp3|wav)$/.test(path))throw Error('加密资源引用无效');
 const {openFormalMedia}=await import('./formalLevelImport');
 return openFormalMedia(id,path);
}
