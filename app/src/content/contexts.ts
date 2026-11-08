import {
  fail,
  ok,
  type ContentReviewStatus,
  type Result
} from "./types";

// 九情境目录（I-6 / 08 §2.3）。
//
// 说明：
// - 每主题 2 个主情境 + 1 个迁移情境，共 9 个 context_id；ID 全局唯一。
// - 迁移情境（*-C03）是同一目标在另一材料/场景的再观察机会，**不冒充新能力**，
//   不能自动算作进阶或迁移成功；必须另建会话（不跨条件合并证据）。
// - 全部情境已通过内容审校（reviewed / approved_with_issues，见方案优化1.2/20）；
//   遗留问题（权利证据未外部核验、音频占位）见审校记录。
// - 情境只描述对象/材料/刺激/可接受回应，不含任何受版权保护的绘本页、教材页或原音频。

export interface Stimulus {
  stimulus_id: string;
  description_zh: string;
  accepted_responses: readonly string[];
}

export interface ContextDef {
  context_id: string;
  theme_id: string;
  title_zh: string;
  roles_zh: string;
  materials_zh: readonly string[];
  stimulus: Stimulus;
  observation_condition_key: string;
  is_transfer: boolean;
  review_status: ContentReviewStatus;
}

const KINDERGARTEN_CONTEXTS: readonly ContextDef[] = [
  {
    "context_id": "KG-hello-family",
    "theme_id": "kindergarten",
    "title_zh": "圈圈时间问候",
    "roles_zh": "家长说明玩「圈圈时间」游戏：家长扮老师，孩子可选一只玩偶当自己。接受或拒绝角色均可，不强迫参与，不调用真实同学姓名。",
    "materials_zh": [
      "两只玩偶、地垫围成小圈（不调用同学姓名，不建同伴档案）"
    ],
    "stimulus": {
      "stimulus_id": "KG-hello-family",
      "description_zh": "老师重新自然问好，家长不替孩子补答案。孩子回应 Hello 或 Hi 即可，不纠结口音；对话课独立 session，引用同一 reply-hello，不借用词卡课事实。",
      "accepted_responses": [
        "Hello!"
      ]
    },
    "observation_condition_key": "KG-hello-family",
    "is_transfer": false,
    "review_status": "reviewed"
  },
  {
    "context_id": "KG-name-color",
    "theme_id": "kindergarten",
    "title_zh": "美术课色纸命名",
    "roles_zh": "家长扮美术课老师，三张色纸放桌面。孩子可以看、选一张或拿在手里；无作品、无剪刀颜料，不强迫参与。",
    "materials_zh": [
      "红、蓝、黄三张大色纸（卡纸自制）；不用剪刀颜料，不拍作品照"
    ],
    "stimulus": {
      "stimulus_id": "KG-name-color",
      "description_zh": "老师举起另一张明确色纸（如红色）向孩子提问，等一个目标回答，不替答。说出对应颜色即正确；换目标物必须同步刺激与答案。对话课独立 session，引用同一 reply-color，不借用词卡课事实。",
      "accepted_responses": [
        "Red!"
      ]
    },
    "observation_condition_key": "KG-name-color",
    "is_transfer": false,
    "review_status": "reviewed"
  },
  {
    "context_id": "KG-name-animal",
    "theme_id": "kindergarten",
    "title_zh": "分享动物卡",
    "roles_zh": "家长扮玩偶同伴，孩子带一张自选动物卡进入「分享时间」。接受或拒绝角色均可，可用玩偶代答；同伴为虚构玩偶，不用真实同学资料，拒绝不记负向。",
    "materials_zh": [
      "自制猫/狗/鸟动物卡三张，孩子自选一张；家长扮玩偶同伴（不用真实同学资料）"
    ],
    "stimulus": {
      "stimulus_id": "KG-name-animal",
      "description_zh": "同伴对所选卡中性提问，等孩子接回答话，不替答。与所选卡一致的 cat/a cat、dog/a dog、bird/a bird 均正确（答案随所选卡同步，不固定）；冠词遗漏不判失败。对话课独立 session，引用同一 reply-animal，不借用词卡课事实。",
      "accepted_responses": ["Cat", "Dog", "Bird"]
    },
    "observation_condition_key": "KG-name-animal",
    "is_transfer": false,
    "review_status": "reviewed"
  }
];

export const CONTEXTS: readonly ContextDef[] = Object.freeze([
  {
    context_id: "FG-C01",
    theme_id: "family-greetings",
    title_zh: "坐垫边，玩偶朝孩子问好",
    roles_zh: "玩偶（家长操作）向孩子问好；孩子回应。",
    materials_zh: ["玩偶或家长手偶", "一张问候情境卡（自制）", "无需家庭照片"],
    stimulus: {
      stimulus_id: "greeting-hello",
      description_zh: "玩偶面向孩子自然说 Hello! 或 Hi!",
      accepted_responses: ["Hello", "Hi"]
    },
    observation_condition_key: "FG-C01",
    is_transfer: false,
    review_status: "reviewed"
  },
  {
    context_id: "FG-C02",
    theme_id: "family-greetings",
    title_zh: "假装玩偶来做客，家长当来客、孩子当迎接者",
    roles_zh: "家长扮来客，孩子扮迎接者。",
    materials_zh: ["同一玩偶", "用手势表示门口；无需实际开门或陌生人参与"],
    stimulus: {
      stimulus_id: "greeting-hi",
      description_zh: "来客重新向孩子自然问候",
      accepted_responses: ["Hello", "Hi"]
    },
    observation_condition_key: "FG-C02",
    is_transfer: false,
    review_status: "reviewed"
  },
  {
    context_id: "FG-C03",
    theme_id: "family-greetings",
    title_zh: "换到桌边或换一个玩偶，再次自然问候",
    roles_zh: "另一玩偶或换座位，再次自然问候。",
    materials_zh: ["另一个玩偶或换座位", "不增加新问句"],
    stimulus: {
      stimulus_id: "greeting-hello",
      description_zh: "换位置或换玩偶后自然问候",
      accepted_responses: ["Hello", "Hi"]
    },
    observation_condition_key: "FG-C03",
    is_transfer: true,
    review_status: "reviewed"
  },
  {
    context_id: "CS-C01",
    theme_id: "colors-shapes",
    title_zh: "桌上摆红蓝黄积木，家长举起一块",
    roles_zh: "家长举起一块积木提问；孩子说出颜色。",
    materials_zh: ["现有三色积木或彩纸", "家长先确认颜色明确", "无须买新玩具"],
    stimulus: {
      stimulus_id: "color-blue",
      description_zh: "家长举起明确蓝色物，问 What color is this?",
      accepted_responses: ["blue"]
    },
    observation_condition_key: "CS-C01",
    is_transfer: false,
    review_status: "reviewed"
  },
  {
    context_id: "CS-C02",
    theme_id: "colors-shapes",
    title_zh: "一起收积木，玩偶拿起一块询问颜色",
    roles_zh: "玩偶（家长操作）举起一块询问；孩子接话回答。",
    materials_zh: ["同三色积木与收纳盒", "收纳只是情节，不单评整理能力"],
    stimulus: {
      stimulus_id: "color-blue",
      description_zh: "玩偶举蓝积木向孩子提问",
      accepted_responses: ["blue"]
    },
    observation_condition_key: "CS-C02",
    is_transfer: false,
    review_status: "reviewed"
  },
  {
    context_id: "CS-C03",
    theme_id: "colors-shapes",
    title_zh: "看熟悉衣物上清楚的红/蓝/黄区域",
    roles_zh: "家长选纯色、无歧义物品；孩子说出颜色。",
    materials_zh: ["纯色、无歧义衣物或物品", "不用拍照", "不要求脱换衣物"],
    stimulus: {
      stimulus_id: "color-blue",
      description_zh: "指向衣物上明确蓝色区域提问",
      accepted_responses: ["blue"]
    },
    observation_condition_key: "CS-C03",
    is_transfer: true,
    review_status: "reviewed"
  },
  {
    context_id: "AA-C01",
    theme_id: "animals-actions",
    title_zh: "桌上依次出现猫狗鸟卡片",
    roles_zh: "家长举起卡片提问；孩子说出动物。",
    materials_zh: ["自制或已明确有权的三张卡", "也可用现有玩具", "不让孩子接触真实动物"],
    stimulus: {
      stimulus_id: "animal-dog",
      description_zh: "显示可辨狗卡，问 What is this?",
      accepted_responses: ["dog", "a dog"]
    },
    observation_condition_key: "AA-C01",
    is_transfer: false,
    review_status: "reviewed"
  },
  {
    context_id: "AA-C02",
    theme_id: "animals-actions",
    title_zh: "玩偶主人迎接“动物客人”，问 What is this?",
    roles_zh: "家长扮主人，孩子作回答方。",
    materials_zh: ["猫狗鸟卡片/玩具", "家长扮主人", "叫声和动作只作暖场"],
    stimulus: {
      stimulus_id: "animal-dog",
      description_zh: "主人指狗客人问孩子",
      accepted_responses: ["dog", "a dog"]
    },
    observation_condition_key: "AA-C02",
    is_transfer: false,
    review_status: "reviewed"
  },
  {
    context_id: "AA-C03",
    theme_id: "animals-actions",
    title_zh: "在另一张自制动物场景图中看猫/狗/鸟",
    roles_zh: "家长出示自制场景图；孩子说出动物。",
    materials_zh: ["自有或明确授权插画", "改图必须先审动物可辨性", "不自动读取第三方绘本"],
    stimulus: {
      stimulus_id: "animal-dog",
      description_zh: "在自制场景图中指向可辨狗",
      accepted_responses: ["dog", "a dog"]
    },
    observation_condition_key: "AA-C03",
    is_transfer: true,
    review_status: "reviewed"
  }
  ,...KINDERGARTEN_CONTEXTS
] as const);

export function readContexts(): Result<readonly ContextDef[]> {
  return ok(CONTEXTS);
}

export function findContext(contextId: string): Result<ContextDef> {
  const found = CONTEXTS.find(c => c.context_id === contextId);
  if (!found) return fail("NOT_FOUND", "没有找到这个观察情境。");
  return ok(found);
}

export function contextsForTheme(themeId: string): Result<readonly ContextDef[]> {
  const found = CONTEXTS.filter(c => c.theme_id === themeId);
  if (found.length === 0) return fail("NOT_FOUND", "该主题没有可用情境。");
  return ok(found);
}

// 迁移情境只提供同目标再观察，不是新能力，也不等于进阶。
export function isTransferContext(contextId: string): boolean {
  return CONTEXTS.some(c => c.context_id === contextId && c.is_transfer);
}
