import { MEDIA_ITEMS, VIDEO_STATUS, mediaGate, safeMediaPath, type MediaItem } from '../content/resources';

// V1.5-B3：媒体输入面板（图片/音频/视频）。
//
// 口径（08 §5.1/§5.3/§5.4）：
// - 媒体只提供输入；**点击/播放结束不产生能力成功**，不计分、不进记录。
// - 权利未明（unknown）→ 逐条显示为「未知权利：不做展示/解码」，**零正文**。
// - 视频：无自制/已授权视频 → **明示不可用**，不放占位播放器、不假装可播。
// - 不接相机、不留儿童照片。

const KIND_LABEL: Record<MediaItem['kind'], string> = {
  image: '图片',
  audio: '音频',
  video: '视频'
};

export function MediaInputPanel() {
  const items = MEDIA_ITEMS;

  return (
    <section className="card" aria-label="媒体输入（V1.5）">
      <h2>媒体输入（图片 / 音频 / 视频）</h2>
      <p className="notice">
        媒体只提供输入：点击或播放结束都<strong>不产生能力成功</strong>，不计入记录与周报、不计分。
      </p>

      <ul>
        {items.map(item => {
          const verdict = mediaGate(item);
          if (verdict === 'blocked_unknown_rights') {
            return (
              <li key={item.media_id}>
                <strong>{KIND_LABEL[item.kind]}</strong>：{item.title_zh} —— 未知权利：不做展示或解码（零正文）。
              </li>
            );
          }
          if (verdict === 'unavailable') {
            return (
              <li key={item.media_id}>
                <strong>{KIND_LABEL[item.kind]}</strong>：{item.title_zh} —— 暂不可用（缺文件或路径不受控），不凭空承诺。
              </li>
            );
          }
          const path = item.path as string;
          return (
            <li key={item.media_id}>
              <strong>{KIND_LABEL[item.kind]}</strong>：{item.title_zh}
              {item.kind === 'image' && safeMediaPath(path) ? (
                <>
                  <br />
                  <img src={path} alt={item.title_zh} width={160} />
                </>
              ) : null}
              {item.kind === 'audio' ? (
                <>
                  <br />
                  <audio controls preload="none" src={path}>
                    本机合成音频（非人类母语者录音）。
                  </audio>
                </>
              ) : null}
              <br />
              <span className="notice">来源：{item.rights_evidence}</span>
            </li>
          );
        })}
      </ul>

      <h3>视频</h3>
      <p className="notice">{VIDEO_STATUS.reason_zh}</p>
      <p>视频：{VIDEO_STATUS.available ? '可用' : '暂无可用视频（明示不可用）'}。</p>

      <p className="notice">
        音频为本机合成（AI，非人类母语者录音）；不上传孩子视频、不留儿童照片、不接相机。
      </p>
    </section>
  );
}

export default MediaInputPanel;
