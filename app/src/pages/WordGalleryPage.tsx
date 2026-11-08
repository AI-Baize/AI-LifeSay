import { AudioPhrase } from '../components/AudioPhrase';
import { Link } from 'react-router-dom';
import { publishableWords } from '../content/words';
import { readCatalog } from '../content/catalog';
import { Screen } from './shared';
import { EmptyState } from '../components/EmptyState';

// 批次2：单词卡图库页（「每个单词都要配图」的浏览入口）。
//
// 口径：
// - 只展示已审校（reviewed）的自制原创单词卡；未审校不冒充可用。
// - 打开即见图，纯展示与朗读，不产生能力成功、不计分。
export function WordGalleryScreen() {
  const catalog = readCatalog();
  const words = publishableWords();

  const titleOf = (themeId: string): string => {
    if (!catalog.ok) return themeId;
    const found = catalog.data.find(t => t.id === themeId);
    return found ? found.title_zh : themeId;
  };

  return (
    <Screen title="单词卡图库">
      <p>每个教学词都有一张自制原创配图。点开听一听，看图不代表已经会说。</p>

      {words.length === 0 ? (
        <EmptyState message="暂无可用单词卡。" />
      ) : (
        <div className="catalog-grid">
          {words.map(word => (
            <div className="card" key={word.word_id}>
              <img
                src={word.image_path}
                alt={`单词卡：${word.label_en}（${word.label_zh}）`}
                style={{ width: '100%', display: 'block', borderRadius: 8 }}
              />
              <h2>
                <AudioPhrase text={word.label_en}/>（{word.label_zh}）
              </h2>
              <p className="notice">主题：{titleOf(word.theme_id)}</p>
            </div>
          ))}
        </div>
      )}

      <p>
        <Link to="/scenes">场景图库</Link> · <Link to="/themes">按主题浏览</Link>
      </p>
      <p className="notice">全部为自制原创 SVG；不含受版权保护的绘本页、教材页或照片。</p>
    </Screen>
  );
}

export default WordGalleryScreen;
