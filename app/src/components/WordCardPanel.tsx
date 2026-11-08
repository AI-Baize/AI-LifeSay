import { AudioPhrase } from './AudioPhrase';
import { wordsForTheme } from '../content/words';
import { readCatalog } from '../content/catalog';
import { StatusNotice } from './StatusNotice';

// 批次2 单词卡面板：「每个单词都要配图」的可见落地。
//
// 边界：
// - 单词卡为**自制原创 SVG**；只做展示与朗读。
// - 看图/播放**不产生能力成功**，不计分、不进记录与周报。
// - 本机声线不可用时回退文字带领，不谎报已播放。

export function WordCardPanel({ themeId }: { themeId: string }) {
  const words = wordsForTheme(themeId);

  const catalog = readCatalog();
  const titleOf = (id: string): string => {
    if (!catalog.ok) return id;
    const found = catalog.data.find(t => t.id === id);
    return found ? found.title_zh : id;
  };

  if (words.length === 0) {
    return <StatusNotice message="这个主题暂时没有单词卡。" />;
  }

  return (
    <section className="card" aria-label="单词卡">
      <h2>单词卡：每个词都有图</h2>
      <p>{titleOf(themeId)} · 共 {words.length} 张</p>

      <div className="catalog-grid">
        {words.map(word => (
          <div key={word.word_id} className="card">
            <img
              src={word.image_path}
              alt={`单词卡：${word.label_en}（${word.label_zh}）`}
              style={{ width: '100%', display: 'block', borderRadius: 8 }}
            />
            <p className="english"><AudioPhrase text={word.label_en} label={`播放 ${word.label_en}`}/><small className="translation">{word.label_zh}</small></p>
          </div>
        ))}
      </div>

      <p className="notice">单词卡为自制原创（rights: original）；不含受版权保护的绘本页、教材页或照片。</p>
      <p className="notice">看图与播放不代表孩子已会说；不计入记录与周报，也不计分。</p>
    </section>
  );
}

export default WordCardPanel;
