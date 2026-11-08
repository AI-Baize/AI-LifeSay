export const playways = [
  { id: 'toy-hello', title: '玩偶问好', description: '拿起玩偶，轮流打招呼', scenes: ['SC-C01-001', 'SC-C01-007', 'SC-C03-001', 'SC-C03-004'], materials: '一个熟悉的玩偶', steps: ['先选一个问候场景，看图听一遍。', '家长拿玩偶示范，再留出时间让孩子用声音或动作回应。', '只听、挥手或随时结束都可以，不要求跟说。'], mode: 'parent' },
  { id: 'find-picture', title: '听音找图', description: '听一听，一起找对应的图', scenes: ['SC-C02-002'], materials: '日与夜两张图片', steps: ['先在选定场景里熟悉日、夜图片。', '家长用该场景已有的句子邀请孩子选图。', '接受指图、拿图或中文参与；这不等于独立读字。'], mode: 'parent' },
  { id: 'name-picture', title: '看图说名称', description: '看颜色和动物，说说发现', scenes: ['SC-C01-002', 'SC-C01-004', 'SC-C01-010', 'SC-C01-011', 'SC-C03-007', 'SC-C03-008', 'SC-C03-010'], materials: '场景词卡或对应实物', steps: ['选一个场景，先一起看图片或实物。', '点词卡听示范，再留出孩子自愿回应的时间。', '播放答案后跟说只算练习，不自动记为独立命名。'], mode: 'child' },
  { id: 'take-turns', title: '轮流玩', description: '拿个玩具，一人一轮', scenes: ['SC-C01-012', 'SC-C03-011'], materials: '一个可以轮流玩的玩具', steps: ['选择当前场景，听里面的轮流表达。', '家长和孩子各玩一轮，想继续时可参考场景句子。', '不强迫交出玩具；等待行为不等于说出了英语。'], mode: 'parent' },
  { id: 'story-clues', title: '共读找线索', description: '一起看故事，指指画面', scenes: ['SC-C01-009', 'SC-C01-015', 'SC-C02-003'], materials: '当前场景图片或图画书', steps: ['选择一个故事或共读场景，先看看画面。', '家长读一句，邀请孩子指一指熟悉的人物或物品。', '顺着孩子的兴趣接话，不把看图理解当作独立解码。'], mode: 'parent' },
  { id: 'rhythm-move', title: '韵律律动', description: '听轻柔旋律，自愿轻拍节奏', scenes: ['SC-C01-001', 'SC-C01-007', 'SC-C02-001', 'SC-C03-009'], materials: '安全的活动空间，无需额外道具', steps: ['选一个韵律场景，先小音量听一轮。', '孩子愿意时可轻拍手或点头，不需要追求动作准确。', '想休息就暂停，动作参与不生成语言成绩。'], mode: 'rhyme' }
] as const;
