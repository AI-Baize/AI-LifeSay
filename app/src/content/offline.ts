// V1.5-B6：离线可用性（F27）。
//
// 口径（对 01 §164 F27）：
// - 「下载后离线」= 验证**已装载核心内容**在无网时可读；核心内容随包分发。
// - **缓存不承诺永不丢失**：浏览器/WebView 可能被系统清理，离线可用是"尽力而为"。
// - 离线只解决**读取**，不承诺写入队列；本 App 学习写入本身就是本机 Dexie，不依赖网络。
import { SCENES } from './scenes';
import { MEDIA_ITEMS } from './resources';

export interface OfflineAsset {
  kind: 'scene' | 'audio';
  path: string;
  bundled: boolean;
}

/** 随包分发的核心离线资产清单。 */
export function offlineAssets(): readonly OfflineAsset[] {
  const scenes: OfflineAsset[] = SCENES.map(s => ({ kind: 'scene' as const, path: s.image_path, bundled: true }));
  const audio: OfflineAsset[] = MEDIA_ITEMS.filter(m => m.kind === 'audio' && m.rights_status === 'original')
    .flatMap(m => (m.path ? [{ kind: 'audio' as const, path: m.path, bundled: true }] : []));
  return [...scenes, ...audio];
}

export interface OfflineReadiness {
  assets: readonly OfflineAsset[];
  core_ready: boolean;
  /** 诚实标注：缓存非持久保证。 */
  caveat_zh: string;
}

export function offlineReadiness(): OfflineReadiness {
  const assets = offlineAssets();
  return {
    assets,
    core_ready: assets.length > 0 && assets.every(a => a.bundled),
    caveat_zh: '缓存不承诺永不丢失：系统可能清理 WebView 缓存。离线仅保证随包核心内容的读取，不保证写入队列。'
  };
}
