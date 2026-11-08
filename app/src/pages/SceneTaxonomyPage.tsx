import { Link } from 'react-router-dom';
import { groupedTaxonomy, type TaxonomyScene } from '../content/taxonomy';
import { findScene } from '../content/scenes';
import { Screen } from './shared';
import { EmptyState } from '../components/EmptyState';

// 批次2-C3：场景库分级页（域 → 类 → 场景），对齐「方案优化1.2 / 09」。
//
// 口径：
// - 三级：域 → 类 → 场景；不做第四级。
// - **已实现**（有已审校自制原创场景图）→ 可点，进入场景图教学。
// - **规划中** → **灰态不可点**，明示「规划中」，不冒充可用。
// - 不显示积分/评分/掌握词数/连胜链。

function SceneRow({ row }: { row: TaxonomyScene }) {
  const implemented = row.app_scene_ids.length > 0;
  const primaryAppSceneId = row.app_scene_ids[0] ?? null;
  // 场景图教学页按**主题**取图（/scenes/:themeId），因此用场景图解析出主题再链接。
  const firstScene = primaryAppSceneId ? findScene(primaryAppSceneId) : null;
  const themeId = firstScene && firstScene.ok ? firstScene.data.theme_id : null;
  return (
    <li>
      <span aria-label={implemented ? '已实现' : '规划中'}>
        {implemented ? '●' : '○'}
      </span>{' '}
      <strong>{row.title_zh}</strong>
      <span className="notice">
        （{row.scene_id} · {row.target_version} · {implemented ? '可点' : '规划中'}）
      </span>
      {implemented && themeId ? (
        <>
          {' '}
          <Link to={`/scenes/${themeId}?scene=${primaryAppSceneId}`} aria-label={`进入 ${row.title_zh} 的场景图`}>
            进入场景图
          </Link>
        </>
      ) : implemented ? (
        <span className="notice">：场景图暂不可定位到主题。</span>
      ) : (
        <span className="notice">：仅设计目录，暂不可点。</span>
      )}
    </li>
  );
}

export function SceneTaxonomyScreen() {
  const groups = groupedTaxonomy();
  const total = groups.reduce(
    (n, g) => n + g.classes.reduce((m, c) => m + c.scenes.length, 0),
    0
  );

  return (
    <Screen title="场景库（分级）">
      <p>
        按「场景域 → 场景类 → 场景」三级浏览，对齐 09 归类体系。已实现的场景可点进入教学；
        规划中的只作目录，暂不可点。
      </p>
      <p className="notice">
        共登记 {groups.length} 个域、{total} 行场景。全部为自制原创场景图，不含受版权保护的绘本页或照片。
      </p>

      {groups.length === 0 ? (
        <EmptyState message="暂无已登记的场景目录。" />
      ) : (
        <div className="stack">
          {groups.map(g => (
            <section className="card" key={g.domain.domain_id} aria-label={g.domain.name_zh}>
              <h2>
                {g.domain.name_zh}（{g.domain.domain_id}）
              </h2>
              {g.classes.map(entry => (
                <div key={entry.cls.class_id}>
                  <h3>
                    {entry.cls.name_zh}（{entry.cls.class_id}）
                  </h3>
                  <ul className="stack">
                    {entry.scenes.map(row => (
                      <SceneRow key={row.scene_id} row={row} />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      <p>
        <Link to="/scenes">场景图库（按图浏览）</Link> · <Link to="/themes">按主题浏览</Link> · <Link to="/scenes/packs">场景课程库</Link>
      </p>
      <p className="notice">规划中的场景不会创建活动，也不产生任何能力事实。</p>
    </Screen>
  );
}

export default SceneTaxonomyScreen;
