// V1.5-B5：播放进度／书签页（F26）。
//
// 与学习表现分开存储；书签不代表听懂；恢复播放不等于继续观察。
import { Screen } from './shared';
import { PlaybackPanel } from '../components/PlaybackPanel';

export function PlaybackScreen() {
  return (
    <Screen title="播放进度与书签（V1.5）">
      <p>这里保存「听到哪」，方便下次接着播。它与学习记录分开存储，不构成能力证据。</p>
      <PlaybackPanel />
    </Screen>
  );
}

export default PlaybackScreen;
