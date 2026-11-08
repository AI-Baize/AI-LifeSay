// V1.5-B4：资源导入页（F19–F22 / V15-07）。
//
// 权利状态先于文件正文；unknown 只手填书目卡、零正文；不注册相机入口。
import { Screen } from './shared';
import { ResourceImportPanel } from '../components/ResourceImportPanel';

export function ResourceImportScreen() {
  return (
    <Screen title="资源使用说明">
      <p>
        这里管理家长导入的图片 / 音频 / 视频 / PDF 资源。权利状态先于正文：权利未明只保留书目卡片。
      </p>
      <ResourceImportPanel />
    </Screen>
  );
}

export default ResourceImportScreen;
