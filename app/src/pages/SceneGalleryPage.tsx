// 批次1 · 可见性：场景图库页。
//
// 口径：
// - 只展示**已审校（reviewed）**且含热点的自制原创场景图；未审校不冒充可用。
// - 打开即见图，替代「场景 → 文字主题卡」的语义错位。
// - 图为自制原创 SVG；不含绘本页/教材页/地标照片。
import { Link } from 'react-router-dom';
import { publishableScenes } from '../content/scenes';
import { readCatalog } from '../content/catalog';
import { Screen } from './shared';
import { EmptyState } from '../components/EmptyState';

export function SceneGalleryScreen() {
  const catalog = readCatalog();
  const allScenes = publishableScenes();
  // The extra scene records are transfer variants of the same learning scene.
  // Keep one clear entry point per theme until there is genuinely distinct content.
  const scenes = allScenes.filter((scene, index, all) =>
    all.findIndex(candidate => candidate.theme_id === scene.theme_id) === index
  );

  const titleOf = (themeId: string): string => {
    if (!catalog.ok) return themeId;
    const found = catalog.data.find(t => t.id === themeId);
    return found ? found.title_zh : themeId;
  };

  const activityCountOf = (themeId: string): number => {
    if (!catalog.ok) return 0;
    return catalog.data.find(theme => theme.id === themeId)?.tasks.length ?? 0;
  };

  const sceneTitles:Record<string,string>={
   'scene-family-greetings':'玩偶与孩子问候',
   'scene-colors-shapes':'认识彩色积木',
   'scene-animals-actions':'猫、狗和小鸟'
  };
  return <Screen title="场景图库">
   <p><Link to="/explore">探索生活交流与故事共读</Link></p>
   {!scenes.length?<EmptyState message="暂无可用场景图。"/>:<div className="scene-gallery-grid">{scenes.map(scene=><article className="card scene-gallery-card" key={scene.scene_id} aria-label={titleOf(scene.theme_id)}>
    <Link className="scene-image-link" aria-label={`进入${sceneTitles[scene.scene_id]??scene.alt_zh}`} to={`/scenes/${scene.theme_id}?scene=${scene.scene_id}`}><img src={scene.image_path} alt={scene.alt_zh}/></Link>
    <h3>{sceneTitles[scene.scene_id]??scene.alt_zh}</h3><p className="scene-gallery-count">{activityCountOf(scene.theme_id)} 个活动</p>
   </article>)}</div>}
  </Screen>;
}
export default SceneGalleryScreen;
