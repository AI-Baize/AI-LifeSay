import type { SpeechStatus } from '../services/tts';
const LABEL: Record<SpeechStatus, string> = {
  loading: '准备声音…',
  ready: '朗读这一句',
  speaking: '正在朗读',
  text: '按文字带领'
};
export function SpeechControls({
  status,
  onPlay,
  onCancel
}: {
  status: SpeechStatus;
  onPlay: () => void;
  onCancel: () => void;
}) {
  const speaking = status === 'speaking';
  const unavailable = status === 'text';
  return (
    <div className="row">
      <button
        type="button"
        disabled={unavailable || status === 'loading'}
        onClick={speaking ? onCancel : onPlay}
      >
        {speaking ? '停止' : LABEL[status]}
      </button>
      {unavailable && <span>没有可用的本机美式声线，请按文字带领。</span>}
    </div>
  );
}
