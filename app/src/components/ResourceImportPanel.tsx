import {
  CAMERA_STATUS,
  KIND_LABEL,
  RESOURCE_CARDS,
  allowedActions,
  isContentActionBlocked,
  type ResourceCard
} from '../content/resourceCatalog';

// V1.5-B4：资源导入面板（F19–F22 / V15-07）。
//
// 口径：
// - **权利状态先于文件正文**；unknown → 只显示书目卡片，**零正文**（不展示/不解码/不索引）。
// - 文件选择 ≠ 启用麦克风；支持播放 ≠ 支持视频识别；PDF 先渲染，抽取/OCR 分权限。
// - 不注册相机入口（红线）。

const ACTION_LABEL: Record<string, string> = {
  create_card: '建书目卡',
  local_view: '本地查看',
  local_play: '本地播放',
  text_extract: '文字层提取',
  ocr: 'OCR'
};

function CardRow({ card }: { card: ResourceCard }) {
  const blocked = isContentActionBlocked(card);
  const actions = allowedActions(card);

  return (
    <li>
      <strong>{KIND_LABEL[card.kind]}</strong>：{card.title_zh}
      {card.source_note ? <div>来源：{card.source_note}</div> : null}
      <div>
        权利状态：{card.rights_status === 'unknown' ? '未知（unknown）' : card.rights_status === 'original' ? '自制原创' : '已授权'}
        {blocked ? ' —— 仅书目卡片，零正文' : ` —— 证据：${card.rights_evidence}`}
      </div>
      <div>允许操作：{actions.map(a => ACTION_LABEL[a] ?? a).join('、')}</div>
      {blocked ? (
        <div className="notice">
          权利未明：不预读封面、不 OCR、不解码试听、不建索引。请先明确允许操作。
        </div>
      ) : null}
    </li>
  );
}

export function ResourceImportPanel() {
  return (
    <section className="card" aria-label="资源导入（V1.5）">
      <h2>资源使用说明</h2><p className="notice">当前只展示资源类型和使用规则，尚未开放选择文件、导入或恢复备份。请先使用应用内的活动内容。</p>
      <p className="notice">
        <strong>权利状态先于文件正文</strong>：权利未明的资源只建书目卡片，不读取媒体正文。
      </p>

      <ul>
        {RESOURCE_CARDS.map(card => (
          <CardRow key={card.card_id} card={card} />
        ))}
      </ul>

      <h3>相机 / 相册扫描</h3>
      <p className="notice">{CAMERA_STATUS.reason_zh}</p>

      <p className="notice">
        文件选择不等于启用麦克风；支持播放不等于支持视频识别；PDF 先渲染，文字抽取与 OCR 分权限。
      </p>
      <p className="notice">
        导入的资源只作为家长素材，不产生能力成功、不计分、不进记录与周报；付费不改变任何权利红线。
      </p>
    </section>
  );
}

export default ResourceImportPanel;
