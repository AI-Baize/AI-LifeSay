import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { courseResourceUrl, encryptedCourses, releaseCourseUrl } from './courseVault';
import {isLicensedAsset} from './licensedAsset';

export function CourseImage({ src = '', alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const protectedSource=encryptedCourses||isLicensedAsset(src);
  const [result, setResult] = useState<{ input: string; url: string; failed: boolean }>();
  useEffect(() => {
    if (!protectedSource || !src) return;
    let alive = true; let blob = '';
    void courseResourceUrl(src).then(url => { blob = url; if (alive) setResult({ input: src, url, failed: false }); else releaseCourseUrl(url); }).catch(() => { if (alive) setResult({ input: src, url: '', failed: true }); });
    return () => { alive = false; releaseCourseUrl(blob); };
  }, [src,protectedSource]);
  if (!protectedSource) return <img src={src} alt={alt} {...props}/>;
  if (result?.input !== src || !result.url) return <span role="img" aria-label={alt || '课程图片'}>{result?.input === src && result.failed ? '图片读取失败，请检查课程下载。' : '正在读取图片…'}</span>;
  return <img src={result.url} alt={alt} {...props}/>;
}
