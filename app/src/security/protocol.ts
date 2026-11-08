export type SignedEnvelope = { payload: string; signature: string };
export type SealedResource = { id: string; mime: string; nonce: string; file: string; sha256: string; bytes: number };
export type SealedManifest = { schema: 1; package_id: string; version: string; resources: Record<string, SealedResource> };
export type CourseLicense = { schema: 1; license_id: string; package_id: string; manifest_hash: string; device: string; perpetual: true; wrapped_key: string };
export const encode = (value: string) => new TextEncoder().encode(value);
export const unbase64 = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value), c => c.charCodeAt(0));
export const base64 = (value: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(value)));
export async function sha256(value: BufferSource) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', value))].map(b => b.toString(16).padStart(2, '0')).join(''); }
export class SignatureVerificationError extends Error {}
export async function verifyEnvelope<T>(envelope: SignedEnvelope, publicKey: JsonWebKey): Promise<{ value: T; hash: string }> {
  if (!envelope || typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string') throw new Error('签名文件格式无效');
  const data = unbase64(envelope.payload);
  const key = await crypto.subtle.importKey('jwk', publicKey, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['verify']);
  if (!await crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, key, unbase64(envelope.signature), data)) throw new SignatureVerificationError('签名验证失败，文件可能已被修改');
  return { value: JSON.parse(new TextDecoder().decode(data)) as T, hash: await sha256(data) };
}
export function validateManifest(value: SealedManifest) {
  if (value.schema !== 1 || value.package_id !== 'aienglish-c01-c03' || typeof value.version !== 'string' || !value.resources || !value.resources['formal-v1.1/learning-index.json']) throw new Error('课程包格式不兼容');
  for (const item of Object.values(value.resources)) {
    if (!/^[a-f0-9]{64}$/.test(item.id) || !/^[a-f0-9]{64}$/.test(item.sha256) || item.file !== `blobs/${item.sha256}.bin` || unbase64(item.nonce).length !== 12 || !Number.isSafeInteger(item.bytes) || item.bytes < 16) throw new Error('课程资源描述无效');
  }
}
export async function unlockLicense(license: CourseLicense, manifest: SealedManifest, manifestHash: string, privateKey: CryptoKey, publicKey: CryptoKey) {
  const device = await sha256(await crypto.subtle.exportKey('spki', publicKey));
  if (license.schema !== 1 || !license.license_id || license.package_id !== manifest.package_id || license.manifest_hash !== manifestHash || license.device !== device || license.perpetual !== true) throw new Error('授权与当前设备或课程版本不匹配');
  const label = encode(JSON.stringify([1, manifest.package_id, manifestHash, device]));
  // The resulting content key is non-exportable and only has decrypt usage.
  return await crypto.subtle.unwrapKey('raw', unbase64(license.wrapped_key), privateKey, { name: 'RSA-OAEP', label }, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
}
export async function decryptResource(manifest: SealedManifest, resource: SealedResource, ciphertext: Uint8Array<ArrayBuffer>, key: CryptoKey) {
  if (ciphertext.byteLength !== resource.bytes || await sha256(ciphertext) !== resource.sha256) throw new Error('课程文件损坏，请重新下载');
  const aad = encode(JSON.stringify([1, manifest.package_id, manifest.version, resource.id, resource.mime]));
  return await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(resource.nonce), additionalData: aad, tagLength: 128 }, key, ciphertext);
}
