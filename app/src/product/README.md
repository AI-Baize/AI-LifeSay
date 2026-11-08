# PD-1.0 产品实现

ProductApp.tsx为新入口，LearningPage.tsx绑定页面与会话，player.ts是可注入声音输出的播放控制器，store.ts负责独立本机偏好/目标/体验资料，catalog.ts只将现有候选适配为内部体验对象，不改变课程审核状态。

新资料使用localStorage键aienglish-product-v1；旧观察IndexedDB保持独立，经LegacyBridge按原合同读取。首次学习需明确同意本机保存。无账号、录音、识别评分、支付、兑换或课程导入。导出个人资料不包含课程素材，当前没有导入恢复入口。

产品内所有台词统一使用同一台设备的本机英语声线，优先选取已知女性英语声线并在本次运行中固定；无已知声线时固定选用一个本机声线，绝不在静态音轨与系统TTS之间自动切换。没有本机声线时提示家长照文字朗读。听一听按睡前、昼夜及句意使用较慢语速、较长句间停顿和轻微语调调整。合成效果和情绪表达仍须真人审听；不同设备的系统声线音色可能不同。按line_id保留同文台词，不按字符串去重。

每次播放、暂停、切页和结束都有请求序号；异步完成仅可更新所属请求。整页完整成功后才可接续，单句播放不会提前完成整页。跟读回应等待和页后5秒等待不重叠。有限组版本冻结，恢复静音，不取整个目录后续内容。

## 构建边界

默认npm run build输出dist，含内部候选及旧版兼容模块。npm run build:market-free通过Vite预解析钩子把候选目录替换成marketCatalog.json，并关闭public目录复制；条件编译排除LegacyBridge和LegacyEvening。当前市场清单为空，不能拿空包直接上架。

未来批准首批免费内容后，需完善经过审阅的发布目录、依赖资源allowlist、hash/可信来源及内容更新流程，再做正式市场构建。不得直接重新打开整个public复制以夹带候选、付费或未知权利资产。

## 本轮资源接入

`courses/pilot/catalog.json`是10个口语活动与3个共读故事的候选源，应用副本需保持hash一致。C03-001入园问候与C03-002离园告别的两张真实场景图已复制到`public/scenes/course/`并挂到各自对应活动；颜色、动物与其余候选继续使用应用已有主题插画。两张新图的视觉验收仍为pending。

新增内部“听一听”入口，使用SC-C01-009与SC-C02-003逐句清单和本机合成音频。播放顺序一次，不记表现；真人声音审听、权利证据及设备离线/后台能力仍待验证。SC-C03-009列为待整理素材，因为其音频manifest使用占位标签，不能与逐句脚本可靠匹配。市场构建以`marketListeningCatalog.json`替换候选播放列表，且不复制public资源。

## 验证

播放器/存储测试在tests/product-*.unit.test.ts，浏览器新流程在tests/e2e/product-design.spec.ts，市场边界在tests/e2e/market-free.spec.ts。静态构建测试可设置E2E_STATIC_DIST=1，并用E2E_DIST_DIR选择dist或dist-market-free；该方式不验证HTTP。真实HTTP测试应设E2E_EXTERNAL_SERVER=1及真实E2E_BASE_URL。

浏览器声音用明确替身产生结束事件，因此不代表真实音色、语音许可、设备音频或关屏能力已通过。完整当前交付记录在项目根迭代记录/2026-10-24-产品设计实现。
