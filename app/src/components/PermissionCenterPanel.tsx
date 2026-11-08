import { DEGRADATION_PATHS, FILE_PICKER_IS_APP_PERMISSION, PERMISSIONS, REQUESTED_PERMISSIONS } from '../content/permissions';
import { offlineReadiness } from '../content/offline';

// V1.5-B6：隐私与权限中心（F30）+ 离线可用性（F27）。
//
// 口径：
// - 展示权限、保存位置、删除与网络边界（01 §167）。
// - **本 App 不索取任何敏感运行时权限**——这里展示的是"为什么不要"，不是"申请了再拒绝"。
// - 离线：核心内容随包；**缓存不承诺永不丢失**。
// - 删除入口指向本机数据管理（P17），不在本页执行破坏性操作。

const STORAGE_LOCATION_ZH = '全部学习记录、草稿、同意保存在本机浏览器 IndexedDB（Dexie），不上传服务器。播放进度单独存于 localStorage 独立命名空间。';

export function PermissionCenterPanel() {
  const offline = offlineReadiness();
  const requested = REQUESTED_PERMISSIONS;

  return (
    <section className="card" aria-label="隐私与权限中心（V1.5）">
      <h2>隐私与权限中心</h2>

      <h3>本应用索取的权限</h3>
      <p className="notice">
        {requested.length === 0
          ? '本应用不索取相机、麦克风、定位、通讯录或相册整库权限。'
          : `本应用申请 ${requested.length} 项权限。`}
      </p>

      <h3>逐项说明</h3>
      <ul>
        {PERMISSIONS.map(p => (
          <li key={p.id}>
            <strong>{p.label_zh}</strong>：{p.requested ? '申请' : '不索取'}——{p.reason_zh}
          </li>
        ))}
      </ul>

      <h3>文件选择不是权限申请</h3>
      <p className="notice">
        {FILE_PICKER_IS_APP_PERMISSION
          ? '文件选择属于应用级权限。'
          : '导入资源时由你主动点选文件，仅读取该文件，不扫描相册，不构成应用级权限申请。'}
      </p>

      <h3>数据保存位置</h3>
      <p>{STORAGE_LOCATION_ZH}</p>
      <p className="notice">本机数据未另加应用层加密；导出文件需由家长自行保管。</p>

      <h3>网络边界</h3>
      <p>核心内容随安装包分发，不向外部服务器上传儿童记录、照片或声音。Web版首次打开仍需要能访问部署地址。</p>

      <h3>离线可用性（F27）</h3>
      <p>
        随包内容清单（不代表已缓存）：{offline.core_ready ? '已随包装载' : '未装载'}（{offline.assets.length} 项）
      </p>
      <p className="notice">Web版没有离线启动缓存：已打开的内容可继续使用，关闭后离线不保证重新打开。{offline.caveat_zh}</p>

      <h3>不索取权限时的降级路径</h3>
      <ul>
        {DEGRADATION_PATHS.map(d => (
          <li key={d.feature}>
            <strong>{d.feature}</strong>：{d.without_permission}
          </li>
        ))}
      </ul>

      <p>
        <a href="#/settings/data">前往本机数据管理（导出／彻底清除）</a>
      </p>
    </section>
  );
}

export default PermissionCenterPanel;
