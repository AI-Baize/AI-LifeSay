// V1.5-B1：场景图片教学页（F09 / F15）。
//
// 仅提供已审校（reviewed）的自制原创场景图；热点命中即朗读标注词，
// 属标签检索而非模型识别。点击不产生能力事实。
import { useParams, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { sceneForTheme, findScene } from '../content/scenes';
import { readCatalog } from '../content/catalog';
import { Screen } from './shared';
import { EmptyState } from '../components/EmptyState';
import { SceneHotspotPanel } from '../components/SceneHotspotPanel';

export function SceneTeachingScreen() {
  const { themeId } = useParams();
  const catalog = readCatalog();
  const theme = catalog.ok && themeId ? catalog.data.find(t => t.id === themeId) ?? null : null;
  const [query] = useSearchParams();
  const requested = query.get('scene');
  const exact = requested ? findScene(requested) : null;
  const scene = requested ? (exact?.ok && exact.data.theme_id === themeId ? exact.data : null) : themeId ? sceneForTheme(themeId) : null;

  return (
    <Screen title="场景图教学（V1.5）">
      {!theme || !scene ? (
        <EmptyState message="没有找到这个主题的场景图；不会用别的主题冒充。" />
      ) : (
        <>
          <p>{theme.title_zh}</p>
          <SceneHotspotPanel key={scene.scene_id} themeId={theme.id} sceneId={scene.scene_id} />
          <Link className="button-link primary" to={`/goals/select?theme=${theme.id}`}>用这个主题玩一次</Link>
          <p>
            <Link to={`/themes/${theme.id}`}>回到主题</Link>
          </p>
        </>
      )}
    </Screen>
  );
}

export default SceneTeachingScreen;
