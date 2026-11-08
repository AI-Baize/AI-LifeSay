import { useState } from 'react';
import {
  DEFAULT_GAME_MODE,
  GAME_MODES,
  MODE_BOUNDARY_ZH,
  type GameModeDef
} from '../content/gameModes';
import { StatusNotice } from './StatusNotice';

// 批次3（P-玩法 G1/G3）：课内玩法变体选择面板。
//
// 硬边界：
// - 这是**课内玩法变体**，不是第三门课程；切换不新建会话、不写记录、不计分。
// - 改变了回应模态的变体（动作律动）只做说明与展示，**不在此静默生效**，需另立决策。
// - 素材全部为本机自制原创 + 本机声线；不内嵌受版权保护素材。

export function GameModePanel({ themeId }: { themeId: string }) {
  const [active, setActive] = useState<GameModeDef>(DEFAULT_GAME_MODE);
  const [notice, setNotice] = useState<string | null>(null);

  const pick = (mode: GameModeDef) => {
    setActive(mode);
    setNotice(
      mode.changes_response_modality
        ? '该玩法改变回应模态（改为做动作），属新目标，需另立决策后才会生效；此处仅作说明。'
        : null
    );
  };

  return (
    <section className="card" aria-label="课内玩法">
      <h2>玩法介绍</h2>
      <p>这里介绍家长可以怎样带领，不会更改当前活动。动作律动暂只作说明。</p><details><summary>关于记录的说明</summary><p>{MODE_BOUNDARY_ZH}</p></details>

      <fieldset>
        <legend>查看一种玩法</legend>
        {GAME_MODES.map(mode => (
          <button
            key={mode.mode_id}
            type="button"
            disabled={active.mode_id === mode.mode_id}
            onClick={() => pick(mode)}
            aria-label={`玩法 ${mode.title_zh}`}
          >
            {mode.title_zh}
            {active.mode_id === mode.mode_id ? '（正在查看）' : ''}
          </button>
        ))}
      </fieldset>

      <div className="card">
        <h3>{active.title_zh}</h3>
        <p>家长怎么做：{active.parent_zh}</p>
        <p>孩子做什么：{active.child_zh}</p>
        <p className="notice">材料：{active.materials_zh.join('、')}</p>
        {active.changes_response_modality ? (
          <p className="notice">此玩法改变回应模态，需另立决策；不会静默替换当前目标。</p>
        ) : (
          <p className="notice">与当前课同属命名／识别族，可在课内切换；不新建会话、不写记录。</p>
        )}
      </div>

      {notice ? <StatusNotice message={notice} /> : null}

      <p className="notice">
        玩法主题：{themeId}。三种玩法共用同一门课的目标与观察条件，切换玩法不会复制上一门课的结果。
      </p>
      <p className="notice">这里不做计分或排名；玩法切换不是能力表现。</p>
    </section>
  );
}

export default GameModePanel;
