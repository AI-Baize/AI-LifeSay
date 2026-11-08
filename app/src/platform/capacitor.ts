import { webPlatform, type Platform } from './web';
// V1未接文件与分享插件；WebView能力待真机实测，不用远程服务兜底。
export const capacitorPlatform:Platform={...webPlatform};
