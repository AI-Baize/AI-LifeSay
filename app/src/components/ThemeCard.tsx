import type { Theme } from '../content/types';
import { themePicture } from '../content/topicArtwork';
import { ImageTopicCard } from './ImageTopicCard';
export function ThemeCard({theme,onSelect}:{theme:Theme;onSelect:()=>void}){
 return <ImageTopicCard title={theme.title_zh} image={themePicture(theme.id)} count={theme.tasks.length} onSelect={onSelect}/>;
}
