import Dexie, { type Table } from 'dexie';
import {isLicensedAsset,licensedAssetUrl} from './licensedAsset';
import trust from 'virtual:course-trust';
import { base64, decryptResource, sha256, unlockLicense, validateManifest, verifyEnvelope, type CourseLicense, type SealedManifest, type SignedEnvelope } from './protocol';

export const encryptedCourses = import.meta.env.MODE === 'encrypted';
type Device = { id: string; privateKey: CryptoKey; publicKey: CryptoKey };
type Entry = { id: string; value: unknown };
class VaultDatabase extends Dexie {
  entries!: Table<Entry, string>;
  constructor() { super('aienglish-course-vault-v1'); this.version(1).stores({ entries: '&id' }); }
}
const db = new VaultDatabase();
const base = `${import.meta.env.BASE_URL}encrypted-course/`;
async function stored<T>(id: string) { return (await db.entries.get(id))?.value as T | undefined; }
const save = (id: string, value: unknown) => db.entries.put({ id, value });
let devicePromise: Promise<Device> | undefined;
export function getDevice(): Promise<Device> {
  devicePromise ??= (async () => {
    if (!globalThis.crypto?.subtle) throw new Error('课程授权需要HTTPS或本机安全环境');
    const old = await stored<Device>('device'); if (old) return old;
    const keys = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, false, ['wrapKey', 'unwrapKey']);
    const device = { id: await sha256(await crypto.subtle.exportKey('spki', keys.publicKey)), ...keys };
    // Another tab may have created a key while this tab was generating one.
    return await db.transaction('rw', db.entries, async () => { const existing = await stored<Device>('device'); if (existing) return existing; await save('device', device); return device; });
  })().catch(error => { devicePromise = undefined; throw error; });
  return devicePromise;
}
let manifestPromise: Promise<{ manifest: SealedManifest; hash: string }> | undefined;
export function getManifest() {
  manifestPromise ??= (async () => {
    if (!encryptedCourses || !trust) throw new Error('当前版本不接受付费课程许可');
    let signed: SignedEnvelope;
    // Keep the purchased installed version. A server update must not silently replace
    // its manifest and strand a perpetual offline license. Version migration is explicit.
    const cached = await stored<SignedEnvelope>('manifest');
    if (cached) signed = cached;
    else {
      try { const response = await fetch(`${base}manifest.json`, { cache: 'no-store' }); if (!response.ok) throw new Error('下载不可用'); signed = await response.json() as SignedEnvelope; }
      catch { throw new Error('尚未下载课程，请先联网获取课程包'); }
    }
    const checked = await verifyEnvelope<SealedManifest>(signed, trust); validateManifest(checked.value);
    await save('manifest', signed);
    return { manifest: checked.value, hash: checked.hash };
  })().catch(error => { manifestPromise = undefined; throw error; });
  return manifestPromise;
}
export async function createActivationRequest() {
  const { manifest, hash } = await getManifest(); const device = await getDevice();
  return { schema: 1, package_id: manifest.package_id, manifest_hash: hash, public_key_spki: base64(await crypto.subtle.exportKey('spki', device.publicKey)) };
}
export async function checkCourseUpdate() {
  const active = await getManifest();
  const response = await fetch(`${base}manifest.json?update=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('暂时无法检查课程更新，请联网后重试');
  const signed = await response.json() as SignedEnvelope;
  const next = await verifyEnvelope<SealedManifest>(signed, trust!); validateManifest(next.value);
  if (next.hash === active.hash) return null;
  await save('pending-manifest', signed);
  const device = await getDevice();
  return { schema: 1, package_id: next.value.package_id, manifest_hash: next.hash, public_key_spki: base64(await crypto.subtle.exportKey('spki', device.publicKey)) };
}
let contentKey: Promise<CryptoKey> | undefined;
async function getKey() {
  contentKey ??= (async () => {
    const { manifest, hash } = await getManifest();
    const signed = await stored<SignedEnvelope>(`license:${hash}`);
    if (!signed) throw new Error('课程尚未激活，请到“我的 → 课程授权”导入本机许可');
    const checked = await verifyEnvelope<CourseLicense>(signed, trust!);
    const device = await getDevice();
    return await unlockLicense(checked.value, manifest, hash, device.privateKey, device.publicKey);
  })().catch(error => { contentKey = undefined; throw error; });
  return contentKey;
}
export async function importLicense(signed: SignedEnvelope) {
  let { manifest, hash } = await getManifest(); const checked = await verifyEnvelope<CourseLicense>(signed, trust!); const device = await getDevice();
  let pending: SignedEnvelope | undefined;
  if (checked.value.manifest_hash !== hash) {
    pending = await stored<SignedEnvelope>('pending-manifest');
    if (!pending) throw new Error('许可版本不匹配，请先检查课程更新');
    const next = await verifyEnvelope<SealedManifest>(pending, trust!); validateManifest(next.value);
    manifest = next.value; hash = next.hash;
  }
  await unlockLicense(checked.value, manifest, hash, device.privateKey, device.publicKey);
  // Verify and unwrap before replacing any working license.
  await db.transaction('rw', db.entries, async () => {
    await save(`license:${hash}`, signed);
    if (pending) { await save('previous-manifest', await stored('manifest')); await save('manifest', pending); }
  });
  manifestPromise = undefined; contentKey = undefined;
}
async function ciphertext(path: string) {
  const { manifest } = await getManifest(); const resource = manifest.resources[path];
  if (!resource) throw new Error('课程没有包含这项资源');
  const id = `cipher:${resource.sha256}`;
  const old = await stored<ArrayBuffer>(id);
  if (old && old.byteLength === resource.bytes && await sha256(old) === resource.sha256) return new Uint8Array(old);
  const response = await fetch(`${base}${resource.file}`);
  if (!response.ok) throw new Error('课程资源尚未下载，请联网完成下载');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== resource.bytes || await sha256(bytes) !== resource.sha256) throw new Error('下载文件损坏，请重试');
  await save(id, bytes); return new Uint8Array(bytes);
}
export async function decryptCourseFile(path: string) {
  const { manifest } = await getManifest(); const resource = manifest.resources[path];
  if (!resource) throw new Error('课程资源不存在');
  const key = await getKey();
  return { bytes: await decryptResource(manifest, resource, await ciphertext(path), key), mime: resource.mime };
}
export async function readEncryptedIndex<T>(): Promise<T> { const { bytes } = await decryptCourseFile('formal-v1.1/learning-index.json'); return JSON.parse(new TextDecoder().decode(bytes)) as T; }
export async function courseResourceUrl(url: string): Promise<string> {
  if(isLicensedAsset(url))return licensedAssetUrl(url);
  if (!encryptedCourses) return url;
  const prefix = `${import.meta.env.BASE_URL}course-package/`;
  if (!url.startsWith(prefix)) throw new Error('加密版拒绝读取课程包以外的资源');
  const { bytes, mime } = await decryptCourseFile(url.slice(prefix.length));
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}
export function releaseCourseUrl(url: string) { if (url.startsWith('blob:')) URL.revokeObjectURL(url); }
export async function downloadCourse(onProgress: (done: number, total: number) => void) {
  await getKey(); const { manifest, hash } = await getManifest(); const paths = Object.keys(manifest.resources);
  const persistent = await navigator.storage?.persist?.() ?? false;
  const estimate = await navigator.storage?.estimate?.();
  const existing = new Set(await db.entries.toCollection().primaryKeys());
  const required = Object.values(manifest.resources).filter(item => !existing.has(`cipher:${item.sha256}`)).reduce((sum, item) => sum + item.bytes, 0);
  if (estimate?.quota && estimate.quota - (estimate.usage ?? 0) < required) throw new Error(`存储空间不足，尚需约${Math.ceil(required / 1048576)} MiB，请先释放空间。`);
  for (let i = 0; i < paths.length; i++) { await ciphertext(paths[i]!); onProgress(i + 1, paths.length); }
  await save(`download:${hash}`, true);
  return persistent;
}
export async function courseStatus() {
  const { hash, manifest } = await getManifest();
  let activated = false; try { await getKey(); activated = true; } catch { /* Show activation controls without exposing keys. */ }
  return { activated, downloaded: Boolean(await stored(`download:${hash}`)), resources: Object.keys(manifest.resources).length, bytes: Object.values(manifest.resources).reduce((sum, resource) => sum + resource.bytes, 0), version: manifest.version };
}
