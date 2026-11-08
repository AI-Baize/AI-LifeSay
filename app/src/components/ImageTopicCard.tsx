export function ImageTopicCard({title,image,count,onSelect}:{title:string;image:string;count:number;onSelect:()=>void}){
 return <article className="image-topic-card"><button type="button" className="topic-image-button" onClick={onSelect} aria-label={`进入${title}`}><img src={image} alt={title}/></button><div className="topic-caption"><h2>{title}</h2><span>{count}个活动</span></div></article>;
}
