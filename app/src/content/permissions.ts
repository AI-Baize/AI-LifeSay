// V1.5-B6：权限最小化声明（F30 隐私与权限中心）。
//
// 核心口径（对 01 §67「权限最小化」与 §173–175 红线）：
// - 本 App **不索取相机、麦克风、定位、通讯录、相册**任何敏感运行时权限。
// - 「不索取」是**声明**，不是「申请了再拒绝」；两者对家长的含义完全不同。
// - 儿童声纹/照片/位置一律不采集；导入的文件只在用户主动选择后读取元数据。
// - 通知（F31）为可选增强、可关闭，当前 V1.5 不注册通知权限。
//
// 注意：文件选择（F19–F22）由 <input type="file"> 触发，属于**用户主动行为**，
// 不构成应用级权限申请；「文件选择 ≠ 启用麦克风」。

export type PermissionId =
  | 'camera'
  | 'microphone'
  | 'location'
  | 'contacts'
  | 'photos'
  | 'notifications'
  | 'network';

export interface PermissionDecl {
  id: PermissionId;
  label_zh: string;
  /** 是否向系统申请该运行时权限。 */
  requested: boolean;
  /** 用途（若申请）或「为何不申请」的说明。 */
  reason_zh: string;
}

export const PERMISSIONS: readonly PermissionDecl[] = [
  { id: 'camera', label_zh: '相机', requested: false, reason_zh: '不索取。拍照识别（F17）被红线阻塞，未经红线变更决策不启用。' },
  { id: 'microphone', label_zh: '麦克风', requested: false, reason_zh: '不索取。不做录音、不做 ASR、不做口语评分（F36）。' },
  { id: 'location', label_zh: '定位', requested: false, reason_zh: '不索取。不采集位置；图片 EXIF 定位也需处理（F37）。' },
  { id: 'contacts', label_zh: '通讯录', requested: false, reason_zh: '不索取。不读取联系人，不做社交分享拉人。' },
  { id: 'photos', label_zh: '相册整库', requested: false, reason_zh: '不索取整库。仅在你主动点选文件时读取该文件（F19–F22），不扫描相册。' },
  { id: 'notifications', label_zh: '通知', requested: false, reason_zh: '当前不注册。本地提醒（F31）为可选增强、独立且可关闭，不强制。' },
  { id: 'network', label_zh: '网络', requested: false, reason_zh: '本地优先。核心内容随包分发，无需联网；不向外部服务器上传儿童记录。' }
];

/** 实际需要的运行时权限集合（当前为空）。 */
export const REQUESTED_PERMISSIONS: readonly PermissionDecl[] = PERMISSIONS.filter(p => p.requested);

/** 启动时是否申请过任何敏感权限。 */
export function requestsSensitivePermissions(): boolean {
  return REQUESTED_PERMISSIONS.some(p => p.id !== 'notifications' && p.id !== 'network');
}

/**
 * 文件选择是否属于应用级权限。
 * 口径：**不是**。由用户主动点选触发，且仅读取被选中的文件。
 */
export const FILE_PICKER_IS_APP_PERMISSION = false;

/** 降级与替代路径（不索取权限也能用）。 */
export const DEGRADATION_PATHS: readonly { feature: string; without_permission: string }[] = [
  { feature: '图片识别（F16）', without_permission: '使用内置自制场景图 + 人工预标注热点；不读相册、不拍照。' },
  { feature: '音频（F10）', without_permission: '播放随包 mp3；无麦克风仍可用（只播不录）。' },
  { feature: '资源导入（F19–F22）', without_permission: '用户主动点选文件读取最小元数据；不扫描相册、不解码试听。' },
  { feature: '隐私中心（F30）', without_permission: '无条件可用：本页只读展示，不需要任何权限。' }
];
