import { Link } from 'react-router-dom';
import { GAME_MODES, MODE_BOUNDARY_ZH } from '../content/gameModes';
import { Screen } from './shared';

// 批次3：玩法一览页（课内玩法变体的集中说明入口）。
//
// 口径：
// - 三种玩法都是**课内变体**，不是三门课程。
// - 展示「家长怎么做／孩子做什么／需要什么材料」。
// - 改变回应模态的玩法明确标注需另立决策。
export function GameModeGalleryScreen() {
  return (
    <Screen title="玩法一览">
      <p>{MODE_BOUNDARY_ZH}</p>
      <div className="stack">
        {GAME_MODES.map(mode => (
          <div className="card" key={mode.mode_id}>
            <h2>{mode.title_zh}</h2>
            <p>家长怎么做：{mode.parent_zh}</p>
            <p>孩子做什么：{mode.child_zh}</p>
            <p className="notice">材料：{mode.materials_zh.join('、')}</p>
            {mode.changes_response_modality ? (
              <p className="notice">改变回应模态：需另立决策后才会生效。</p>
            ) : (
              <p className="notice">与当前课同族：可在课内切换，不新建会话、不写记录。</p>
            )}
          </div>
        ))}
      </div>
      <p>
        <Link to="/themes">按主题浏览</Link> · <Link to="/scenes">场景图库</Link> ·{' '}
        <Link to="/words">单词卡图库</Link>
      </p>
      <p className="notice">玩法素材全部为自制原创 + 本机声线；不含受版权保护的音频或绘本页。</p>
    </Screen>
  );
}

export default GameModeGalleryScreen;
