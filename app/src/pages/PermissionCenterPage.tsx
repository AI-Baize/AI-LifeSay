// V1.5-B6：隐私与权限中心页（F30）+ 离线（F27）。
import { Screen } from './shared';
import { PermissionCenterPanel } from '../components/PermissionCenterPanel';

export function PermissionCenterScreen() {
  return (
    <Screen title="隐私与权限中心（V1.5）">
      <p>这里说明本应用索取了哪些权限、数据存在哪里、以及离线时哪些内容可用。</p>
      <PermissionCenterPanel />
    </Screen>
  );
}

export default PermissionCenterScreen;
