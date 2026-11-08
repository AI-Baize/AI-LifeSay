import { fail, ok, type ContentReviewStatus, type CourseId, type Result } from "./types";

// 两玩法素材（E-2 / 08 §3.1、§4.1）。
//
// 说明：
// - 每个「课程单元」补一份玩法素材：词卡课与对话课各有自己的四段文案与 condition_key。
// - 素材来自 08 §4.3 六单元四段脚本，已通过内容审校（reviewed / approved_with_issues）：
//   审校结论见方案优化1.2/20；遗留问题见该记录。仍不内嵌受版权保护素材。
// - 素材不内嵌任何受版权保护的绘本页/教材页/原音频；音频仍为本机 TTS 占位，可文字降级。
// - 「无第二玩法」不在本文件里假装有：第二玩法素材存在时标记 draft；
//   若某课程单元缺失素材，查询函数显式返回 UNSUPPORTED，绝不凭空承诺可用。

export interface UnitMaterialStep {
  phase: "prepare" | "practice" | "observe" | "finish";
  instruction_zh: string;
  line_en: string;
  expected_response_en: string | null;
}

export interface UnitMaterial {
  unit_id: string;
  course_id: CourseId;
  condition_key: string;
  review_status: ContentReviewStatus;
  steps: readonly UnitMaterialStep[];
}

const KINDERGARTEN_MATERIALS: readonly UnitMaterial[] = [
  {
    "unit_id": "kindergarten-hello-family-dialogue",
    "course_id": "dialogue",
    "condition_key": "KG-hello-family",
    "review_status": "reviewed",
    "steps": [
      {
        "phase": "prepare",
        "instruction_zh": "家长说明玩「圈圈时间」游戏：家长扮老师，孩子可选一只玩偶当自己。接受或拒绝角色均可，不强迫参与，不调用真实同学姓名。",
        "line_en": "Let's play circle time! I'm the teacher.",
        "expected_response_en": null
      },
      {
        "phase": "practice",
        "instruction_zh": "用两只玩偶演示「老师问候—小朋友回应」一轮，答案提示本段可见/可播。孩子可跟说小朋友一侧；只作练习，不进事实。",
        "line_en": "Hello!",
        "expected_response_en": "Hello!"
      },
      {
        "phase": "observe",
        "instruction_zh": "老师重新自然问好，家长不替孩子补答案。孩子回应 Hello 或 Hi 即可，不纠结口音；对话课独立 session，引用同一 reply-hello，不借用词卡课事实。",
        "line_en": "Hello!",
        "expected_response_en": "Hello!"
      },
      {
        "phase": "finish",
        "instruction_zh": "圈圈小情节自然结束，挥手或结束；不评流程完成度，不评礼貌表现。",
        "line_en": "Good job! Bye, friends!",
        "expected_response_en": null
      }
    ]
  },
  {
    "unit_id": "kindergarten-name-color-dialogue",
    "course_id": "dialogue",
    "condition_key": "KG-name-color",
    "review_status": "reviewed",
    "steps": [
      {
        "phase": "prepare",
        "instruction_zh": "家长扮美术课老师，三张色纸放桌面。孩子可以看、选一张或拿在手里；无作品、无剪刀颜料，不强迫参与。",
        "line_en": "It's art class! Red, blue, yellow.",
        "expected_response_en": null
      },
      {
        "phase": "practice",
        "instruction_zh": "老师举一张色纸演示问答，玩偶当学生，答案提示本段可见/可播。孩子可跟说回答；只作练习，不进事实。",
        "line_en": "What color is this?",
        "expected_response_en": "Blue!"
      },
      {
        "phase": "observe",
        "instruction_zh": "老师举起另一张明确色纸（如红色）向孩子提问，等一个目标回答，不替答。说出对应颜色即正确；换目标物必须同步刺激与答案。对话课独立 session，引用同一 reply-color，不借用词卡课事实。",
        "line_en": "What color is this?",
        "expected_response_en": "Red!"
      },
      {
        "phase": "finish",
        "instruction_zh": "一起收好色纸，任意温和结束；不要求做完收纳才可记录，不评完整句。",
        "line_en": "Good job! Let's put them away.",
        "expected_response_en": null
      }
    ]
  },
  {
    "unit_id": "kindergarten-name-animal-dialogue",
    "course_id": "dialogue",
    "condition_key": "KG-name-animal",
    "review_status": "reviewed",
    "steps": [
      {
        "phase": "prepare",
        "instruction_zh": "家长扮玩偶同伴，孩子带一张自选动物卡进入「分享时间」。接受或拒绝角色均可，可用玩偶代答；同伴为虚构玩偶，不用真实同学资料，拒绝不记负向。",
        "line_en": "Sharing time! What card do you have?",
        "expected_response_en": null
      },
      {
        "phase": "practice",
        "instruction_zh": "演示「同伴问—孩子答」一轮，答案提示本段可见/可播，以当次所选卡为准同步。孩子可跟说回答；只作练习，不进事实。",
        "line_en": "What is this?",
        "expected_response_en": "A dog!"
      },
      {
        "phase": "observe",
        "instruction_zh": "同伴对所选卡中性提问，等孩子接回答话，不替答。与所选卡一致的 cat/a cat、dog/a dog、bird/a bird 均正确（答案随所选卡同步，不固定）；冠词遗漏不判失败。对话课独立 session，引用同一 reply-animal，不借用词卡课事实。",
        "line_en": "What is this?",
        "expected_response_en": null
      },
      {
        "phase": "finish",
        "instruction_zh": "结束分享小情节，挥手或结束；不以礼貌表现、分享配合度替代动物命名，不评分享行为。",
        "line_en": "Bye, cat! See you tomorrow!",
        "expected_response_en": null
      }
    ]
  }
];

export const UNIT_MATERIALS: readonly UnitMaterial[] = Object.freeze([
  {
    unit_id: "family-greetings-word-card",
    course_id: "word_card",
    condition_key: "FG-C01",
    review_status: "reviewed",
    steps: [
      {
        phase: "prepare",
        instruction_zh: "展示玩偶来客情境图，再让真实玩偶出场。",
        line_en: "Hello! I'm Teddy.",
        expected_response_en: null
      },
      {
        phase: "practice",
        instruction_zh: "家长扮双方先问候一次；答案示范仅在家长操作后提供。",
        line_en: "Hello!",
        expected_response_en: "Hello!"
      },
      {
        phase: "observe",
        instruction_zh: "玩偶面向孩子自然问好；观察卡隐藏“跟我说”的答案提示。",
        line_en: "Hi!",
        expected_response_en: "Hi!"
      },
      {
        phase: "finish",
        instruction_zh: "玩偶告别，孩子可挥手结束。",
        line_en: "Bye-bye! See you!",
        expected_response_en: null
      }
    ]
  },
  {
    unit_id: "family-greetings-dialogue",
    course_id: "dialogue",
    condition_key: "FG-C02",
    review_status: "reviewed",
    steps: [
      {
        phase: "prepare",
        instruction_zh: "家长说明玩偶来做客；家长扮来客，孩子可当迎接者。",
        line_en: "Hello! I'm Teddy.",
        expected_response_en: null
      },
      {
        phase: "practice",
        instruction_zh: "家长用另一玩偶演示“来客说Hello—主人回Hello”。",
        line_en: "Hello!",
        expected_response_en: "Hello!"
      },
      {
        phase: "observe",
        instruction_zh: "来客重新向孩子问候，家长不替孩子补答案。",
        line_en: "Hi!",
        expected_response_en: "Hi!"
      },
      {
        phase: "finish",
        instruction_zh: "结束来客小情节。",
        line_en: "Bye-bye! See you!",
        expected_response_en: null
      }
    ]
  },
  {
    unit_id: "colors-shapes-word-card",
    course_id: "word_card",
    condition_key: "CS-C01",
    review_status: "reviewed",
    steps: [
      {
        phase: "prepare",
        instruction_zh: "摆红蓝黄三物；初次可由家长逐一展示。",
        line_en: "Look! Red, blue, and yellow.",
        expected_response_en: null
      },
      {
        phase: "practice",
        instruction_zh: "举红色物，示范中性提问和红色答案。",
        line_en: "What color is this?",
        expected_response_en: "Red!"
      },
      {
        phase: "observe",
        instruction_zh: "举明确蓝色物；儿童侧仅保留目标物，中性提问；按支持需要才展开答案。",
        line_en: "What color is this?",
        expected_response_en: "Blue!"
      },
      {
        phase: "finish",
        instruction_zh: "一起收好。",
        line_en: "Good job! Let's put them away.",
        expected_response_en: null
      }
    ]
  },
  {
    unit_id: "colors-shapes-dialogue",
    course_id: "dialogue",
    condition_key: "CS-C02",
    review_status: "reviewed",
    steps: [
      {
        phase: "prepare",
        instruction_zh: "玩偶想把积木放回盒子，家长出示三色材料。",
        line_en: "Look! Red, blue, and yellow.",
        expected_response_en: null
      },
      {
        phase: "practice",
        instruction_zh: "家长演示玩偶举红积木询问，另一角色回答。",
        line_en: "What color is this?",
        expected_response_en: "Red!"
      },
      {
        phase: "observe",
        instruction_zh: "玩偶举蓝积木向孩子提问；等孩子接回答回合。",
        line_en: "What color is this?",
        expected_response_en: "Blue!"
      },
      {
        phase: "finish",
        instruction_zh: "玩偶与孩子结束收纳。",
        line_en: "Good job! Let's put them away.",
        expected_response_en: null
      }
    ]
  },
  {
    unit_id: "animals-actions-word-card",
    course_id: "word_card",
    condition_key: "AA-C01",
    review_status: "reviewed",
    steps: [
      {
        phase: "prepare",
        instruction_zh: "依次显示猫狗鸟；可有轻微模仿动作暖场。",
        line_en: "Look! A cat, a dog, and a bird.",
        expected_response_en: null
      },
      {
        phase: "practice",
        instruction_zh: "显示猫卡，家长示范问答。",
        line_en: "What is this?",
        expected_response_en: "Cat!"
      },
      {
        phase: "observe",
        instruction_zh: "显示狗卡；隐藏答案文字/自动播放。",
        line_en: "What is this?",
        expected_response_en: "Dog!"
      },
      {
        phase: "finish",
        instruction_zh: "收起卡片，道别。",
        line_en: "Bye-bye, cat! Bye-bye, dog!",
        expected_response_en: null
      }
    ]
  },
  {
    unit_id: "animals-actions-dialogue",
    course_id: "dialogue",
    condition_key: "AA-C02",
    review_status: "reviewed",
    steps: [
      {
        phase: "prepare",
        instruction_zh: "家长扮主人，三位“动物客人”出现。",
        line_en: "Look! A cat, a dog, and a bird.",
        expected_response_en: null
      },
      {
        phase: "practice",
        instruction_zh: "家长/玩偶对着猫客人演示一问一答。",
        line_en: "What is this?",
        expected_response_en: "Cat!"
      },
      {
        phase: "observe",
        instruction_zh: "主人指狗客人问孩子，等一个目标回答。",
        line_en: "What is this?",
        expected_response_en: "Dog!"
      },
      {
        phase: "finish",
        instruction_zh: "向客人道别。",
        line_en: "Bye-bye, cat! Bye-bye, dog!",
        expected_response_en: null
      }
    ]
  }
  ,...KINDERGARTEN_MATERIALS
] as const);

export function readUnitMaterials(): Result<readonly UnitMaterial[]> {
  return ok(UNIT_MATERIALS);
}

// 无第二玩法素材时明示不可用，不凭空承诺。
export function materialForUnit(unitId: string): Result<UnitMaterial> {
  const found = UNIT_MATERIALS.find(m => m.unit_id === unitId);
  if (!found) {
    return fail("UNSUPPORTED", "这个课程单元暂无可用的玩法素材，不能凭空开始。");
  }
  return ok(found);
}

export function isPublishableMaterial(material: UnitMaterial): boolean {
  return material.review_status === "reviewed";
}

export function isDraftMaterial(material: UnitMaterial): boolean {
  return material.review_status === "draft";
}
