import type { ScenePackUnit } from "./types";

// C01a 场景课程库数据（8 包逐字转写自 内容生产/C01-家庭/SC-C01-001~008）。
// 契约与口径见 ./types.ts；goal_kind/record_enabled 按 types.ts 注释规则。
// 转写忠实内容包：不改写台词、不增删步骤；标题含中文的元数据照抄。
// 步骤 line_en = §4/§5 该段 stimulus（多句按序以 " / " 连接）；expected_response_en = 该段 answer_hint（无则 null）。
// audio.lines 逐行转写 §7：观察段刺激行与 answer_hint 行 auto_play=false，其余 true。

export const C01A: readonly ScenePackUnit[] = [
  {
    scene_id: "SC-C01-001",
    class_id: "C01",
    title_zh: "生活起居·起床后玩偶问好",
    goal_kind: "existing",
    goal_id: "reply-hello",
    record_enabled: true,
    target_version: "V1.5·规划",
    word_cards: [
      { word_en: "wake up", ipa: "/weɪk ʌp/", hint_zh: "起床动作词；带孩子伸个懒腰再读，动一遍比读三遍有效" },
      { word_en: "hello", ipa: "/həˈloʊ/", hint_zh: "本场景目标词；孩子回应时说 Hello 或 Hi 都算" },
      { word_en: "face", ipa: "/feɪs/", hint_zh: "摸摸自己的脸；只做指认输入，不评分" },
      { word_en: "bed", ipa: "/bed/", hint_zh: "起床情境词；指着床说 It's a bed 即可" },
      { word_en: "wave", ipa: "/weɪv/", hint_zh: "挥手是可参与方式，但挥手 ≠ 口头回应成功（记录边界）" }
    ],
    audio: {
      dir: "audio/SC-C01-001/",
      lines: [
        { id: "01", text_en: "Hello! I'm Teddy.", auto_play: true },
        { id: "02", text_en: "Hello!", auto_play: true },
        { id: "03", text_en: "Hello!", auto_play: false },
        { id: "04", text_en: "Hi!", auto_play: false },
        { id: "05", text_en: "Bye! See you!", auto_play: true },
        { id: "06", text_en: "Hello! I'm Teddy.", auto_play: true },
        { id: "07", text_en: "Hello!", auto_play: true },
        { id: "08", text_en: "Hello!", auto_play: false },
        { id: "09", text_en: "Hi!", auto_play: false },
        { id: "10", text_en: "Bye! See you!", auto_play: true },
        { id: "11", text_en: "Good morning! The sun is up.", auto_play: true },
        { id: "12", text_en: "Hello! I'm Teddy.", auto_play: true },
        { id: "13", text_en: "Wake up, wake up! Stretch your arms.", auto_play: true },
        { id: "14", text_en: "Look at Teddy. Wave and say hello!", auto_play: true },
        { id: "15", text_en: "Hi! Good morning!", auto_play: true },
        { id: "16", text_en: "Hello, Teddy!", auto_play: true },
        { id: "17", text_en: "Hello! Hello!", auto_play: true },
        { id: "18", text_en: "Wash your face. This is my face.", auto_play: true },
        { id: "19", text_en: "Time for breakfast. Let's go!", auto_play: true },
        { id: "20", text_en: "Bye-bye! See you!", auto_play: true },
        { id: "21", text_en: "Sun is up, the sky is blue,", auto_play: true },
        { id: "22", text_en: "Good morning, morning, hello to you!", auto_play: true },
        { id: "23", text_en: "Wake up, wake up, stretch up tall,", auto_play: true },
        { id: "24", text_en: "Wave to Teddy — say hello to all!", auto_play: true }
      ]
    },
    courses: [
      {
        course_id: "word_card",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "先出晨光小床情境图，再让真实玩偶出场；确认孩子已醒、愿参与才开始", line_en: "Hello! I'm Teddy.", expected_response_en: null, audio_line: "01" },
          { phase: "practice", instruction_zh: "家长扮双方先问候一轮；把答案示范交给孩子（支持档 0／1 按需选）", line_en: "Hello!", expected_response_en: "Hello!", audio_line: "02" },
          { phase: "observe", instruction_zh: "玩偶面向孩子自然问好；观察卡隐藏“跟我说”答案提示与自动播放；中性等待几秒", line_en: "Hi!", expected_response_en: null, audio_line: "04" },
          { phase: "finish", instruction_zh: "玩偶告别，孩子可挥手结束；随后由家长记录", line_en: "Bye! See you!", expected_response_en: null, audio_line: "05" }
        ]
      },
      {
        course_id: "dialogue",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "家长说明“Teddy 来到床边/桌边”；家长扮来客，孩子可当迎接者，也可拒绝角色", line_en: "Hello! I'm Teddy.", expected_response_en: null, audio_line: "06" },
          { phase: "practice", instruction_zh: "用另一只玩偶演示“来客说 Hello — 主人回 Hello”一轮", line_en: "Hello!", expected_response_en: "Hello!", audio_line: "07" },
          { phase: "observe", instruction_zh: "来客重新向孩子问好；家长不替孩子补答案，先等再帮", line_en: "Hi!", expected_response_en: null, audio_line: "09" },
          { phase: "finish", instruction_zh: "结束来客小情节，挥手即可", line_en: "Bye! See you!", expected_response_en: null, audio_line: "10" }
        ]
      }
    ]
  },
  {
    scene_id: "SC-C01-002",
    class_id: "C01",
    title_zh: "生活起居·挑衣物看颜色",
    goal_kind: "existing",
    goal_id: "reply-color",
    record_enabled: true,
    target_version: "V1·基线",
    word_cards: [
      { word_en: "red", ipa: "/red/", hint_zh: "目标词；对应当前红衣才说对，别让孩子乱猜" },
      { word_en: "blue", ipa: "/bluː/", hint_zh: "目标词；说 blue 时眼前必须是蓝色物" },
      { word_en: "yellow", ipa: "/ˈjeloʊ/", hint_zh: "目标词；三色只做这 3 个，不扩 orange 等新词" },
      { word_en: "shirt", ipa: "/ʃɝːrt/", hint_zh: "情境词；指着说 This is a shirt 即可，不评分" },
      { word_en: "pants", ipa: "/pænts/", hint_zh: "情境词；美式用词 pants（不用 trousers）" }
    ],
    audio: {
      dir: "audio/SC-C01-002/",
      lines: [
        { id: "01", text_en: "Look! Red, blue, and yellow.", auto_play: true },
        { id: "02", text_en: "What color is this?", auto_play: true },
        { id: "03", text_en: "Red!", auto_play: false },
        { id: "04", text_en: "What color is this?", auto_play: false },
        { id: "05", text_en: "Good job! Let's put them away.", auto_play: true },
        { id: "06", text_en: "Look! Red, blue, and yellow.", auto_play: true },
        { id: "07", text_en: "What color is this?", auto_play: true },
        { id: "08", text_en: "Red!", auto_play: false },
        { id: "09", text_en: "What color is this?", auto_play: false },
        { id: "10", text_en: "Good job! Let's put them away.", auto_play: true },
        { id: "11", text_en: "Look! Red, blue, and yellow.", auto_play: true },
        { id: "12", text_en: "This is a red shirt.", auto_play: true },
        { id: "13", text_en: "Red! Red!", auto_play: true },
        { id: "14", text_en: "Here are blue pants. Blue!", auto_play: true },
        { id: "15", text_en: "Yellow socks, yellow, yellow!", auto_play: true },
        { id: "16", text_en: "What color is this?", auto_play: true },
        { id: "17", text_en: "Blue!", auto_play: true },
        { id: "18", text_en: "Yes! Blue!", auto_play: true },
        { id: "19", text_en: "Pick a shirt. Which one do you like?", auto_play: true },
        { id: "20", text_en: "I like the red one!", auto_play: true },
        { id: "21", text_en: "Good job! Let's put them away.", auto_play: true },
        { id: "22", text_en: "Red and blue and yellow, too,", auto_play: true },
        { id: "23", text_en: "Three good shirts in front of you.", auto_play: true },
        { id: "24", text_en: "Point and pick and say it too —", auto_play: true },
        { id: "25", text_en: "Red, blue, yellow, me and you!", auto_play: true }
      ]
    },
    courses: [
      {
        course_id: "word_card",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "桌面摆出红/蓝/黄三件纯色衣物，家长逐一点认；不拿在孩子身上比划、不拍照", line_en: "Look! Red, blue, and yellow.", expected_response_en: null, audio_line: "01" },
          { phase: "practice", instruction_zh: "举起红色那件，示范中性提问与红色答案（支持档 0／1 按需选）", line_en: "What color is this?", expected_response_en: "Red!", audio_line: "02" },
          { phase: "observe", instruction_zh: "举起一件明确目标物（本次示例＝蓝色衣物）；儿童侧只保留该目标物，中性提问；按支持需要才展开答案", line_en: "What color is this?", expected_response_en: null, audio_line: "04" },
          { phase: "finish", instruction_zh: "一起把衣物收好", line_en: "Good job! Let's put them away.", expected_response_en: null, audio_line: "05" }
        ]
      },
      {
        course_id: "dialogue",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "家长说明“我们来挑衣服”，出示三件纯色衣物；孩子可自己选一件拿着", line_en: "Look! Red, blue, and yellow.", expected_response_en: null, audio_line: "06" },
          { phase: "practice", instruction_zh: "家长扮家长、玩偶扮孩子，演示“举红衣问—红衣答”一轮", line_en: "What color is this?", expected_response_en: "Red!", audio_line: "07" },
          { phase: "observe", instruction_zh: "玩偶举起本次目标衣物向孩子提问；家长不替孩子补答案，先等再帮", line_en: "What color is this?", expected_response_en: null, audio_line: "09" },
          { phase: "finish", instruction_zh: "玩偶与孩子一起收衣物", line_en: "Good job! Let's put them away.", expected_response_en: null, audio_line: "10" }
        ]
      }
    ]
  },
  {
    scene_id: "SC-C01-003",
    class_id: "C01",
    title_zh: "生活起居·洗漱用品提出请求",
    goal_kind: "new_goal",
    goal_id: "req-cup",
    record_enabled: false,
    target_version: "V1.5·规划",
    word_cards: [
      { word_en: "cup", ipa: "/kʌp/", hint_zh: "本场景核心物；指着说 This is a cup 即可，不追问" },
      { word_en: "toothbrush", ipa: "/ˈtuθ.brʌʃ/", hint_zh: "洗漱情境词；只看图/实物，不实操刷牙" },
      { word_en: "towel", ipa: "/ˈtaʊəl/", hint_zh: "洗漱情境词；指认即可" },
      { word_en: "water", ipa: "/ˈwɔːtɚ/", hint_zh: "饮品词；孩子真渴了先满足需要，不等英语" },
      { word_en: "wash", ipa: "/wɑːʃ/", hint_zh: "动作词；可带孩子做洗手动作暖场，动作完成≠命名成功" }
    ],
    audio: {
      dir: "audio/SC-C01-003/",
      lines: [
        { id: "01", text_en: "Look! A cup, a towel, and a toothbrush.", auto_play: true },
        { id: "02", text_en: "Cup, please.", auto_play: true },
        { id: "03", text_en: "Here you go.", auto_play: true },
        { id: "04", text_en: "Cup, please.", auto_play: false },
        { id: "05", text_en: "The cup is here.", auto_play: false },
        { id: "06", text_en: "Cup, please.", auto_play: false },
        { id: "07", text_en: "Here you go.", auto_play: true },
        { id: "08", text_en: "Look! A cup, a towel, and a toothbrush.", auto_play: true },
        { id: "09", text_en: "I want to brush my teeth.", auto_play: true },
        { id: "10", text_en: "First, wash your hands. Wash, wash!", auto_play: true },
        { id: "11", text_en: "Cup... cup...", auto_play: true },
        { id: "12", text_en: "What do you want?", auto_play: true },
        { id: "13", text_en: "Cup, please!", auto_play: true },
        { id: "14", text_en: "Here you go!", auto_play: true },
        { id: "15", text_en: "Thank you!", auto_play: true },
        { id: "16", text_en: "Water, water. Time to drink some water.", auto_play: true },
        { id: "17", text_en: "Bye-bye! See you!", auto_play: true },
        { id: "18", text_en: "Cup, please! Cup, please! Pass it here,", auto_play: true },
        { id: "19", text_en: "Water, water, nice and clear.", auto_play: true },
        { id: "20", text_en: "Ask politely, loud and true —", auto_play: true },
        { id: "21", text_en: "\"Here you go!\" is what we hear!", auto_play: true }
      ]
    },
    courses: [
      {
        course_id: "word_card",
        supported: false,
        unsupported_note_zh: "场景总表 SC-C01-003 适配玩法＝对话；08 §7.2「两课分别验收：不适合某课可只发布另一课并标明」，不为填矩阵强造第二门课。单词卡仅作对话课 prepare 段的实物/图卡指认输入，不产生独立 session、不产生 record。",
        steps: []
      },
      {
        course_id: "dialogue",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "桌面/洗漱台面摆出空塑料杯、毛巾、牙刷图卡（不拿牙膏、不操作水与药物）；孩子可以看、指、拿一件", line_en: "Look! A cup, a towel, and a toothbrush.", expected_response_en: null, audio_line: "01" },
          { phase: "practice", instruction_zh: "玩偶想要杯子，家长演示完整一轮“请求—递物—收下”；答案示范只在家长操作后给", line_en: "Cup, please. / Here you go.", expected_response_en: "Cup, please.", audio_line: "02" },
          { phase: "observe", instruction_zh: "家长把空杯放到孩子面前的桌面，暂不递出；说一句中性情境句后等待 5–8 秒，不替孩子补答案（支持档 0／1／2 按需）", line_en: "The cup is here.", expected_response_en: null, audio_line: "05" },
          { phase: "finish", instruction_zh: "递出空杯，收好材料；无论刚才是否说出来都可正常结束", line_en: "Here you go.", expected_response_en: null, audio_line: "07" }
        ]
      }
    ]
  },
  {
    scene_id: "SC-C01-004",
    class_id: "C01",
    title_zh: "吃饭·餐前空杯看颜色",
    goal_kind: "existing",
    goal_id: "reply-color",
    record_enabled: true,
    target_version: "V1.5·规划",
    word_cards: [
      { word_en: "red", ipa: "/red/", hint_zh: "目标词；眼前必须是红杯才说 red" },
      { word_en: "blue", ipa: "/bluː/", hint_zh: "目标词；说 blue 时眼前必须是蓝杯" },
      { word_en: "yellow", ipa: "/ˈjeloʊ/", hint_zh: "目标词；三色不扩词" },
      { word_en: "cup", ipa: "/kʌp/", hint_zh: "情境词；指认输入，不评分" },
      { word_en: "table", ipa: "/ˈteɪbəl/", hint_zh: "情境词；餐前摆桌时顺带说 It's a table" }
    ],
    audio: {
      dir: "audio/SC-C01-004/",
      lines: [
        { id: "01", text_en: "Look! Red, blue, and yellow.", auto_play: true },
        { id: "02", text_en: "What color is this?", auto_play: true },
        { id: "03", text_en: "Red!", auto_play: false },
        { id: "04", text_en: "What color is this?", auto_play: false },
        { id: "05", text_en: "Good job! Let's put them away.", auto_play: true },
        { id: "06", text_en: "Look! Red, blue, and yellow.", auto_play: true },
        { id: "07", text_en: "What color is this?", auto_play: true },
        { id: "08", text_en: "Red!", auto_play: false },
        { id: "09", text_en: "What color is this?", auto_play: false },
        { id: "10", text_en: "Good job! Let's put them away.", auto_play: true },
        { id: "11", text_en: "Look! Three cups. Red, blue, and yellow.", auto_play: true },
        { id: "12", text_en: "My cup! My cup!", auto_play: true },
        { id: "13", text_en: "Which cup is yours?", auto_play: true },
        { id: "14", text_en: "The blue cup!", auto_play: true },
        { id: "15", text_en: "What color is this cup?", auto_play: true },
        { id: "16", text_en: "Yellow!", auto_play: true },
        { id: "17", text_en: "Yes! Yellow!", auto_play: true },
        { id: "18", text_en: "The table is ready. Sit down, please.", auto_play: true },
        { id: "19", text_en: "Thank you!", auto_play: true },
        { id: "20", text_en: "Good job! Let's put them away.", auto_play: true },
        { id: "21", text_en: "Red cup, blue cup, yellow cup,", auto_play: true },
        { id: "22", text_en: "Line them up and pick one up!", auto_play: true },
        { id: "23", text_en: "What color? What color? Tell me true —", auto_play: true },
        { id: "24", text_en: "Red, blue, yellow, me and you!", auto_play: true }
      ]
    },
    courses: [
      {
        course_id: "word_card",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "餐前把三只空杯（红/蓝/黄）摆上桌面，家长逐一点认；桌上有食物先收走，不边摆边吃", line_en: "Look! Red, blue, and yellow.", expected_response_en: null, audio_line: "01" },
          { phase: "practice", instruction_zh: "举起红色空杯，示范中性提问与红色答案（支持档 0／1 按需选）", line_en: "What color is this?", expected_response_en: "Red!", audio_line: "02" },
          { phase: "observe", instruction_zh: "举起本次目标空杯（示例＝蓝杯）；儿童侧只保留该目标杯，中性提问，等 3–5 秒", line_en: "What color is this?", expected_response_en: null, audio_line: "04" },
          { phase: "finish", instruction_zh: "一起把空杯收到桌边", line_en: "Good job! Let's put them away.", expected_response_en: null, audio_line: "05" }
        ]
      },
      {
        course_id: "dialogue",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "家长说明“吃饭前先摆杯子”，三只空杯摆桌；用餐情节由玩偶模拟（玩偶坐小椅子，不吃真食物）", line_en: "Look! Red, blue, and yellow.", expected_response_en: null, audio_line: "06" },
          { phase: "practice", instruction_zh: "玩偶举红杯自问自答一轮；答案示范只在家长操作后给", line_en: "What color is this?", expected_response_en: "Red!", audio_line: "07" },
          { phase: "observe", instruction_zh: "玩偶举起本次目标空杯向孩子提问；家长不替孩子补答案，先等再帮", line_en: "What color is this?", expected_response_en: null, audio_line: "09" },
          { phase: "finish", instruction_zh: "玩偶与孩子一起收杯子，餐前环节结束", line_en: "Good job! Let's put them away.", expected_response_en: null, audio_line: "10" }
        ]
      }
    ]
  },
  {
    scene_id: "SC-C01-005",
    class_id: "C01",
    title_zh: "吃饭·餐前请求杯子",
    goal_kind: "new_goal",
    goal_id: "req-cup",
    record_enabled: false,
    target_version: "V1.5·规划",
    word_cards: [
      { word_en: "cup", ipa: "/kʌp/", hint_zh: "本场景核心物；指着说 a cup 即可" },
      { word_en: "bowl", ipa: "/boʊl/", hint_zh: "餐桌情境词；指认输入，不评分" },
      { word_en: "spoon", ipa: "/spuːn/", hint_zh: "餐桌情境词；真勺子要拿走尖锐款，用圆头儿童勺" },
      { word_en: "eat", ipa: "/iːt/", hint_zh: "动作词；只作情境输入，不评价孩子吃多少" },
      { word_en: "drink", ipa: "/drɪŋk/", hint_zh: "动作词；孩子真渴了立刻满足，不等英语" }
    ],
    audio: {
      dir: "audio/SC-C01-005/",
      lines: [
        { id: "01", text_en: "Look! A cup, a bowl, and a spoon.", auto_play: true },
        { id: "02", text_en: "Cup, please.", auto_play: true },
        { id: "03", text_en: "Here you go.", auto_play: true },
        { id: "04", text_en: "Cup, please.", auto_play: false },
        { id: "05", text_en: "The cup is here.", auto_play: false },
        { id: "06", text_en: "Cup, please.", auto_play: false },
        { id: "07", text_en: "Here you go.", auto_play: true },
        { id: "08", text_en: "Look! A cup, a bowl, and a spoon.", auto_play: true },
        { id: "09", text_en: "Dinner time! I'm ready!", auto_play: true },
        { id: "10", text_en: "The cup is here.", auto_play: true },
        { id: "11", text_en: "Cup, please!", auto_play: true },
        { id: "12", text_en: "Here you go!", auto_play: true },
        { id: "13", text_en: "Thank you!", auto_play: true },
        { id: "14", text_en: "The spoon goes here. The bowl goes here.", auto_play: true },
        { id: "15", text_en: "Yum, yum! I like my food!", auto_play: true },
        { id: "16", text_en: "Good job! Let's put them away.", auto_play: true },
        { id: "17", text_en: "Bye-bye! See you!", auto_play: true },
        { id: "18", text_en: "One cup, two cups, on the table,", auto_play: true },
        { id: "19", text_en: "Ask for one if you are able:", auto_play: true },
        { id: "20", text_en: "\"Cup, please!\" — that's how we ask,", auto_play: true },
        { id: "21", text_en: "Short and clear, a simple task!", auto_play: true }
      ]
    },
    courses: [
      {
        course_id: "word_card",
        supported: false,
        unsupported_note_zh: "场景总表 SC-C01-005 适配玩法＝对话；08 §7.2「不适合某课可只发布另一课并标明」，不为填矩阵强造第二门课。单词卡仅作对话课 prepare 段的实物/图卡指认输入，不产生独立 session、不产生 record。",
        steps: []
      },
      {
        course_id: "dialogue",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "餐前桌面摆空杯、空碗、勺子；用餐情节由玩偶模拟（玩偶坐小椅、面前是玩具餐，不摆真食物、不动真热源）", line_en: "Look! A cup, a bowl, and a spoon.", expected_response_en: null, audio_line: "01" },
          { phase: "practice", instruction_zh: "玩偶想要杯子，家长演示完整一轮“请求—递物—收下”；答案示范只在家长操作后给", line_en: "Cup, please. / Here you go.", expected_response_en: "Cup, please.", audio_line: "02" },
          { phase: "observe", instruction_zh: "家长把空杯放到孩子面前的桌面，暂不递出；玩偶先表达自己也想要，家长说一句中性情境句后等待 5–8 秒，不替孩子补答案", line_en: "The cup is here.", expected_response_en: null, audio_line: "05" },
          { phase: "finish", instruction_zh: "递出空杯、收好餐具；无论刚才是否说出来都正常结束，不补说、不催说", line_en: "Here you go.", expected_response_en: null, audio_line: "07" }
        ]
      }
    ]
  },
  {
    scene_id: "SC-C01-006",
    class_id: "C01",
    title_zh: "吃饭·餐后表达谢谢",
    goal_kind: "new_goal",
    goal_id: "reply-thanks",
    record_enabled: false,
    target_version: "V1.5·规划",
    word_cards: [
      { word_en: "bowl", ipa: "/boʊl/", hint_zh: "递物道具；无须吃东西，空碗即可" },
      { word_en: "plate", ipa: "/pleɪt/", hint_zh: "递物道具；指认输入，不评分" },
      { word_en: "spoon", ipa: "/spuːn/", hint_zh: "递物道具；用圆头款，避免尖锐餐具" },
      { word_en: "food", ipa: "/fuːd/", hint_zh: "情境词；只看图，不评价孩子吃多少" },
      { word_en: "eat", ipa: "/iːt/", hint_zh: "情境词；餐后场景输入，不作要求" }
    ],
    audio: {
      dir: "audio/SC-C01-006/",
      lines: [
        { id: "01", text_en: "Look! A bowl, a plate, and a card.", auto_play: true },
        { id: "02", text_en: "Here you go.", auto_play: true },
        { id: "03", text_en: "Thank you!", auto_play: true },
        { id: "04", text_en: "Thank you!", auto_play: false },
        { id: "05", text_en: "Here you go.", auto_play: false },
        { id: "06", text_en: "Thank you.", auto_play: false },
        { id: "07", text_en: "You're welcome!", auto_play: true },
        { id: "08", text_en: "Look! A bowl, a plate, and a spoon.", auto_play: true },
        { id: "09", text_en: "For me?", auto_play: true },
        { id: "10", text_en: "Here you go!", auto_play: true },
        { id: "11", text_en: "Thank you!", auto_play: true },
        { id: "12", text_en: "You're welcome!", auto_play: true },
        { id: "13", text_en: "And this card is for you.", auto_play: true },
        { id: "14", text_en: "Thank you, Teddy!", auto_play: true },
        { id: "15", text_en: "You're welcome!", auto_play: true },
        { id: "16", text_en: "All done. Let's put them away.", auto_play: true },
        { id: "17", text_en: "Bye-bye! See you!", auto_play: true },
        { id: "18", text_en: "Here you go! Thank you, thank you,", auto_play: true },
        { id: "19", text_en: "One for me and one for you.", auto_play: true },
        { id: "20", text_en: "Thank you, thank you, one, two, three —", auto_play: true },
        { id: "21", text_en: "Pass the bowl and share with me!", auto_play: true }
      ]
    },
    courses: [
      {
        course_id: "word_card",
        supported: false,
        unsupported_note_zh: "场景总表 SC-C01-006 适配玩法＝对话；08 §7.2「不适合某课可只发布另一课并标明」，不为填矩阵强造第二门课。单词卡仅作对话课 prepare 段的实物/图卡指认输入，不产生独立 session、不产生 record。",
        steps: []
      },
      {
        course_id: "dialogue",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "餐后桌面摆出安全空碗、卡片、小积木（无须吃东西）；孩子可以自己先选一件", line_en: "Look! A bowl, a plate, and a card.", expected_response_en: null, audio_line: "01" },
          { phase: "practice", instruction_zh: "家长给玩偶递物，玩偶示范完整一轮“递—接—谢”；答案示范只在家长操作后给", line_en: "Here you go. / Thank you!", expected_response_en: "Thank you!", audio_line: "02" },
          { phase: "observe", instruction_zh: "家长当面递出孩子选的那件物品，说完中性台词后等待 5–8 秒，不替孩子补答案", line_en: "Here you go.", expected_response_en: null, audio_line: "05" },
          { phase: "finish", instruction_zh: "收好材料；无论刚才是否说出来都正常结束，不补说、不催说", line_en: "You're welcome!", expected_response_en: null, audio_line: "07" }
        ]
      }
    ]
  },
  {
    scene_id: "SC-C01-007",
    class_id: "C01",
    title_zh: "睡觉·睡前玩偶短问候",
    goal_kind: "existing",
    goal_id: "reply-hello",
    record_enabled: true,
    target_version: "V1.5·规划",
    word_cards: [
      { word_en: "hello", ipa: "/həˈloʊ/", hint_zh: "白天用 Hello，睡前也可以说；跟孩子挥手示范" },
      { word_en: "hi", ipa: "/haɪ/", hint_zh: "Hi 是更短的版本；孩子回应 Hi 或 Hello 都对" },
      { word_en: "bear", ipa: "/ber/", hint_zh: "家里有 bear 玩偶就拿来；没有用其他动物玩偶替代" },
      { word_en: "bed", ipa: "/bed/", hint_zh: "只作情境图，不要求孩子说 bed；睡前场景的环境暗示" }
    ],
    audio: {
      dir: "audio/SC-C01-007/",
      lines: [
        { id: "A1", text_en: "Teddy Bear is here. Hello, Teddy!", auto_play: true },
        { id: "A2", text_en: "Hello! I'm Teddy. Hi, little friend!", auto_play: true },
        { id: "A3", text_en: "Hi, Teddy!", auto_play: true },
        { id: "A4", text_en: "Hello! Hello! Wave hello!", auto_play: true },
        { id: "A5", text_en: "Hi, Teddy! Hello!", auto_play: true },
        { id: "A6", text_en: "Good night, Teddy. Bye!", auto_play: true },
        { id: "A7", text_en: "Bye! See you!", auto_play: true },
        { id: "B1", text_en: "Hello, hello, hello,", auto_play: true },
        { id: "B2", text_en: "Say hello, say hi!", auto_play: true },
        { id: "B3", text_en: "Wave your hand, say hello,", auto_play: true },
        { id: "B4", text_en: "Hello, hello, hello!", auto_play: true },
        { id: "C1", text_en: "Look! It's Teddy Bear. Hello, Teddy!", auto_play: true },
        { id: "C2", text_en: "Hello!", auto_play: true },
        { id: "C3", text_en: "Hello! Or Hi!", auto_play: false },
        { id: "C4", text_en: "Hi!", auto_play: false },
        { id: "C5", text_en: "Good night, Teddy! Bye!", auto_play: true },
        { id: "D1", text_en: "Look! Teddy Bear is here. Hello, I'm Teddy!", auto_play: true },
        { id: "D2", text_en: "Hello!", auto_play: true },
        { id: "D3", text_en: "Hello!", auto_play: false },
        { id: "D4", text_en: "Hi!", auto_play: false },
        { id: "D5", text_en: "Bye! See you!", auto_play: true }
      ]
    },
    courses: [
      {
        course_id: "word_card",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "把玩偶放在坐垫上，拿出 hello/hi/bear/bed 四张卡，摆在孩子看得到的地方。用中文简单说明：“小熊要睡觉前，先跟你打个招呼。”", line_en: "Look! It's Teddy Bear. Hello, Teddy!", expected_response_en: null, audio_line: "C1" },
          { phase: "practice", instruction_zh: "家长扮玩偶，先自己示范一次问候；再让玩偶向孩子问好。示范时答案对孩子可见（这是练习段，允许提示）", line_en: "Hello!", expected_response_en: "Hello! 或 Hi!", audio_line: "C2" },
          { phase: "observe", instruction_zh: "玩偶面向孩子，自然问好。不替孩子补答案，不额外提示。观察卡隐藏“跟我说”的答案提示", line_en: "Hi!", expected_response_en: null, audio_line: "C4" },
          { phase: "finish", instruction_zh: "玩偶道晚安告别，可挥手结束。不要求孩子再开口", line_en: "Good night, Teddy! Bye!", expected_response_en: null, audio_line: "C5" }
        ]
      },
      {
        course_id: "dialogue",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "家长说明：玩偶睡觉前要来跟孩子说晚安前的小问候。家长可以扮玩偶，孩子当“被问候的人”。不要求孩子接受角色", line_en: "Look! Teddy Bear is here. Hello, I'm Teddy!", expected_response_en: null, audio_line: "D1" },
          { phase: "practice", instruction_zh: "家长用两只玩偶（或一玩偶一玩偶+自己）演示“来客说 Hello—主人回 Hello”的来回", line_en: "Hello!", expected_response_en: "Hello!", audio_line: "D2" },
          { phase: "observe", instruction_zh: "玩偶重新向孩子问候；家长不替孩子补答案；等孩子接回答回合", line_en: "Hi!", expected_response_en: null, audio_line: "D4" },
          { phase: "finish", instruction_zh: "结束来客小情节，玩偶去“睡觉”", line_en: "Bye! See you!", expected_response_en: null, audio_line: "D5" }
        ]
      }
    ]
  },
  {
    scene_id: "SC-C01-008",
    class_id: "C01",
    title_zh: "睡觉·睡前告别",
    goal_kind: "new_goal",
    goal_id: "reply-good-night",
    record_enabled: false,
    target_version: "V1.5·规划",
    word_cards: [
      { word_en: "good night", ipa: "/ɡʊd naɪt/", hint_zh: "告别语，睡前用；不是问候语，白天不用" },
      { word_en: "sleep", ipa: "/sliːp/", hint_zh: "动作词，可配合闭眼动作示范" },
      { word_en: "bed", ipa: "/bed/", hint_zh: "生活用品；孩子指认或说词均可" },
      { word_en: "pillow", ipa: "/ˈpɪloʊ/", hint_zh: "生活用品；可拿真枕头对照" },
      { word_en: "bear", ipa: "/ber/", hint_zh: "家里有 bear 玩偶就拿来；没有可用其他动物玩偶替代" }
    ],
    audio: {
      dir: "audio/SC-C01-008/",
      lines: [
        { id: "A1", text_en: "Teddy Bear is sleepy. Good night, Teddy!", auto_play: true },
        { id: "A2", text_en: "Good night! I'm sleepy.", auto_play: true },
        { id: "A3", text_en: "Good night, Teddy Bear!", auto_play: true },
        { id: "A4", text_en: "Good night! Good night! Sleep tight!", auto_play: true },
        { id: "A5", text_en: "Good night, little bear. Bye!", auto_play: true },
        { id: "A6", text_en: "Good night, sleep well!", auto_play: true },
        { id: "B1", text_en: "Good night, good night,", auto_play: true },
        { id: "B2", text_en: "Say good night tonight.", auto_play: true },
        { id: "B3", text_en: "Close your eyes, sleepy bear,", auto_play: true },
        { id: "B4", text_en: "Good night, good night, good night!", auto_play: true },
        { id: "C1", text_en: "Look! Teddy Bear is sleepy. Good night, Teddy!", auto_play: true },
        { id: "C2", text_en: "Good night!", auto_play: true },
        { id: "C3", text_en: "Good night!", auto_play: false },
        { id: "C4", text_en: "Good night!", auto_play: false },
        { id: "C5", text_en: "Good night, sleep well!", auto_play: true }
      ]
    },
    courses: [
      {
        course_id: "word_card",
        supported: false,
        unsupported_note_zh: "本场景 mode_fit=对话，词卡课未适配，不交付。理由：09 §3.1 mode_fit 枚举——本行适配玩法为「对话」；词卡课若强行交付，会把 Good night 告别语误做成读卡测验，违背「告别是社交语用回应、不是卡片命名」的场景语义。若未来词卡课适配，须单独审校并新增 course_unit，不得静默增课（09 §7.2）。",
        steps: []
      },
      {
        course_id: "dialogue",
        supported: true,
        steps: [
          { phase: "prepare", instruction_zh: "睡前（或更早时段），把玩偶放在床边/坐垫上，用中文说明：“小熊要睡觉了，跟你说晚安。”不要求孩子必须参与", line_en: "Look! Teddy Bear is sleepy. Good night, Teddy!", expected_response_en: null, audio_line: "C1" },
          { phase: "practice", instruction_zh: "家长用两只玩偶（或一玩偶+自己）演示“一个说 Good night—另一个回 Good night”。示范时答案对孩子可见（练习段允许提示）", line_en: "Good night!", expected_response_en: "Good night!", audio_line: "C2" },
          { phase: "observe", instruction_zh: "玩偶面向孩子，自然说晚安告别。不替孩子补答案，不额外提示。观察卡隐藏答案提示", line_en: "Good night!", expected_response_en: null, audio_line: "C4" },
          { phase: "finish", instruction_zh: "玩偶去“睡觉”，孩子也可准备入睡。不要求孩子再开口", line_en: "Good night, sleep well!", expected_response_en: null, audio_line: "C5" }
        ]
      }
    ]
  }
];

// C01a: 8 units done
