import {
  AppState,
  CourseLesson,
  CourseStage,
  CourseTrack,
  CourseUnit,
  LearnerProfile,
  LessonAsset,
  LessonReviewSeed,
  PracticeQuestion,
  ReviewItem,
  StudyPlanDay
} from "@/lib/types";

type BaseLesson = {
  lessonNumber: number;
  title: string;
  objective: string;
  vocabulary: string[];
  chunks: string[];
  dialogue: string[];
  intro: string;
  coachingNote: string;
  practice: Array<{
    prompt: string;
    answer: string;
    hint: string;
    acceptableAnswers?: string[];
  }>;
  reviewSeeds: Array<{
    front: string;
    back: string;
    hint: string;
    tags: string[];
  }>;
};

type BaseUnit = {
  id: string;
  unitNumber: number;
  stage: CourseStage;
  title: string;
  summary: string;
  lessons: BaseLesson[];
};

const baseUnits: BaseUnit[] = [
  {
    id: "unit-self-intro",
    unitNumber: 1,
    stage: "foundation",
    title: "Self-Introduction",
    summary: "Build a stable base for introducing yourself and asking simple follow-up questions.",
    lessons: [
      {
        lessonNumber: 1,
        title: "Say who you are",
        objective: "Introduce yourself, your role, and where you are from in one short exchange.",
        vocabulary: ["name", "from", "work", "team", "live"],
        chunks: ["My name is...", "I'm from...", "I work as..."],
        dialogue: [
          "A: Hi, I'm Maya. Nice to meet you.",
          "B: Nice to meet you too. Where are you from?",
          "A: I'm from Taipei, and I work as a designer."
        ],
        intro: "今天先把最常用的自我介紹三句講穩，不求多，只求能自然說出口。",
        coachingNote: "先記完整語塊，再替換自己的名字、城市和工作。",
        practice: [
          {
            prompt: "翻成英文：我叫 Kevin。",
            answer: "My name is Kevin.",
            acceptableAnswers: ["I'm Kevin."],
            hint: "自我介紹最常見的開頭"
          },
          {
            prompt: "翻成英文：我來自台北。",
            answer: "I'm from Taipei.",
            hint: "from + 城市"
          }
        ],
        reviewSeeds: [
          { front: "我叫 Kevin。", back: "My name is Kevin.", hint: "My name is...", tags: ["intro", "identity"] },
          { front: "我來自台北。", back: "I'm from Taipei.", hint: "from + 地點", tags: ["intro", "location"] },
          { front: "我是一名設計師。", back: "I work as a designer.", hint: "work as + 職業", tags: ["intro", "job"] }
        ]
      },
      {
        lessonNumber: 2,
        title: "Answer follow-up questions",
        objective: "Handle simple questions about your work, team, and where you live.",
        vocabulary: ["office", "project", "colleague", "busy", "remote"],
        chunks: ["I work with...", "Our team focuses on...", "I usually work remotely."],
        dialogue: [
          "A: What does your team work on?",
          "B: Our team focuses on customer support tools.",
          "A: Do you work in the office every day?",
          "B: No, I usually work remotely."
        ],
        intro: "這一課把自我介紹延伸成簡單對話，重點是能接住別人的追問。",
        coachingNote: "回答時先講主句，再補細節，不要一開始就塞太多資訊。",
        practice: [
          {
            prompt: "翻成英文：我們團隊專注在客服工具。",
            answer: "Our team focuses on customer support tools.",
            hint: "focus on + 名詞"
          },
          {
            prompt: "翻成英文：我通常遠端工作。",
            answer: "I usually work remotely.",
            hint: "usually + 動詞"
          }
        ],
        reviewSeeds: [
          {
            front: "我們團隊專注在客服工具。",
            back: "Our team focuses on customer support tools.",
            hint: "focuses on",
            tags: ["intro", "team"]
          },
          {
            front: "我通常遠端工作。",
            back: "I usually work remotely.",
            hint: "work remotely",
            tags: ["intro", "workstyle"]
          },
          {
            front: "我和產品經理一起工作。",
            back: "I work with product managers.",
            hint: "work with",
            tags: ["intro", "team"]
          }
        ]
      }
    ]
  },
  {
    id: "unit-airport",
    unitNumber: 2,
    stage: "mobility",
    title: "Airport Arrival",
    summary: "Handle immigration, basic assistance, and moving through the airport confidently.",
    lessons: [
      {
        lessonNumber: 1,
        title: "Pass through immigration",
        objective: "Answer the basic questions asked at immigration and arrival counters.",
        vocabulary: ["passport", "visit", "stay", "purpose", "vacation"],
        chunks: ["I'm here for business.", "I'll stay for three days.", "This is my first visit."],
        dialogue: [
          "Officer: What's the purpose of your visit?",
          "Learner: I'm here for business.",
          "Officer: How long will you stay?",
          "Learner: I'll stay for three days."
        ],
        intro: "今天的目標是把入境時最常見的兩個問句答穩。",
        coachingNote: "先把目的和停留天數講清楚，其他資訊再補充。",
        practice: [
          {
            prompt: "翻成英文：我是來出差的。",
            answer: "I'm here for business.",
            hint: "here for + 目的"
          },
          {
            prompt: "翻成英文：我會待三天。",
            answer: "I'll stay for three days.",
            acceptableAnswers: ["I will stay for three days."],
            hint: "stay for + 時間"
          }
        ],
        reviewSeeds: [
          { front: "我是來出差的。", back: "I'm here for business.", hint: "here for", tags: ["airport", "arrival"] },
          { front: "我會待三天。", back: "I'll stay for three days.", hint: "stay for", tags: ["airport", "arrival"] },
          { front: "這是我第一次來。", back: "This is my first visit.", hint: "first visit", tags: ["airport", "arrival"] }
        ]
      },
      {
        lessonNumber: 2,
        title: "Ask for help and directions",
        objective: "Ask airport staff for directions and basic help after arrival.",
        vocabulary: ["gate", "baggage claim", "customs", "exit", "transfer"],
        chunks: ["Where should I go next?", "Could you help me?", "Is this the right line?"],
        dialogue: [
          "Learner: Excuse me, where should I go next?",
          "Staff: Go straight to baggage claim.",
          "Learner: Thanks. Is this the right line for customs?",
          "Staff: Yes, it is."
        ],
        intro: "這課重點是用最短的句子把問題問清楚，不要卡在單字。",
        coachingNote: "遇到不確定時，先問方向，再確認是不是正確隊伍。",
        practice: [
          {
            prompt: "翻成英文：我接下來該去哪裡？",
            answer: "Where should I go next?",
            hint: "Where should I..."
          },
          {
            prompt: "翻成英文：這是正確的隊伍嗎？",
            answer: "Is this the right line?",
            hint: "right line"
          }
        ],
        reviewSeeds: [
          {
            front: "我接下來該去哪裡？",
            back: "Where should I go next?",
            hint: "Where should I...",
            tags: ["airport", "direction"]
          },
          { front: "你可以幫我嗎？", back: "Could you help me?", hint: "Could you...", tags: ["airport", "help"] },
          { front: "這是正確的隊伍嗎？", back: "Is this the right line?", hint: "right line", tags: ["airport", "direction"] }
        ]
      }
    ]
  },
  {
    id: "unit-hotel",
    unitNumber: 3,
    stage: "mobility",
    title: "Hotel Stay",
    summary: "Check in, ask for amenities, and solve small problems at the front desk.",
    lessons: [
      {
        lessonNumber: 1,
        title: "Check in smoothly",
        objective: "Complete hotel check-in and ask about breakfast or Wi-Fi.",
        vocabulary: ["reservation", "check in", "included", "breakfast", "password"],
        chunks: ["I have a reservation.", "Is breakfast included?", "Could I have the Wi-Fi password?"],
        dialogue: [
          "Guest: Hi, I have a reservation under Lin.",
          "Clerk: Great. May I see your passport?",
          "Guest: Sure. Is breakfast included?",
          "Clerk: Yes, from 7 to 10."
        ],
        intro: "飯店入住重點是資訊交換：訂房、早餐、Wi-Fi 三件事先講穩。",
        coachingNote: "先報訂房資訊，再問附加服務，順序會更自然。",
        practice: [
          {
            prompt: "翻成英文：我有訂房。",
            answer: "I have a reservation.",
            hint: "reservation"
          },
          {
            prompt: "翻成英文：早餐有包含嗎？",
            answer: "Is breakfast included?",
            hint: "included"
          }
        ],
        reviewSeeds: [
          { front: "我有訂房。", back: "I have a reservation.", hint: "reservation", tags: ["hotel", "check-in"] },
          { front: "早餐有包含嗎？", back: "Is breakfast included?", hint: "included", tags: ["hotel", "amenity"] },
          {
            front: "可以給我 Wi-Fi 密碼嗎？",
            back: "Could I have the Wi-Fi password?",
            hint: "Could I have...",
            tags: ["hotel", "amenity"]
          }
        ]
      },
      {
        lessonNumber: 2,
        title: "Handle room requests",
        objective: "Make simple requests and report small room issues politely.",
        vocabulary: ["towel", "key card", "air conditioner", "quiet", "extra"],
        chunks: ["Could I get an extra towel?", "The key card isn't working.", "Could you check the air conditioner?"],
        dialogue: [
          "Guest: Hi, could I get an extra towel?",
          "Clerk: Of course.",
          "Guest: Also, the key card isn't working.",
          "Clerk: I'll reset it for you."
        ],
        intro: "這課先練最常見的請求和問題回報，重點是禮貌而直接。",
        coachingNote: "請求用 Could I...，問題回報先說狀況，再請對方處理。",
        practice: [
          {
            prompt: "翻成英文：我可以多拿一條毛巾嗎？",
            answer: "Could I get an extra towel?",
            hint: "extra towel"
          },
          {
            prompt: "翻成英文：房卡不能用。",
            answer: "The key card isn't working.",
            hint: "isn't working"
          }
        ],
        reviewSeeds: [
          { front: "我可以多拿一條毛巾嗎？", back: "Could I get an extra towel?", hint: "extra towel", tags: ["hotel", "request"] },
          { front: "房卡不能用。", back: "The key card isn't working.", hint: "isn't working", tags: ["hotel", "problem"] },
          { front: "你可以檢查一下冷氣嗎？", back: "Could you check the air conditioner?", hint: "check the air conditioner", tags: ["hotel", "problem"] }
        ]
      }
    ]
  },
  {
    id: "unit-food",
    unitNumber: 4,
    stage: "daily",
    title: "Cafe and Restaurant",
    summary: "Order food, make simple requests, and pay without stress.",
    lessons: [
      {
        lessonNumber: 1,
        title: "Order confidently",
        objective: "Ask for recommendations and place a simple order.",
        vocabulary: ["menu", "recommend", "special", "drink", "popular"],
        chunks: ["What do you recommend?", "I'd like this one.", "Can I get it without ice?"],
        dialogue: [
          "Server: Are you ready to order?",
          "Learner: What do you recommend?",
          "Server: Our chicken rice is popular.",
          "Learner: Great. I'd like this one."
        ],
        intro: "餐廳裡先掌握三種功能句：問推薦、下單、調整需求。",
        coachingNote: "先問推薦，再直接下單，整段對話會更順。",
        practice: [
          {
            prompt: "翻成英文：你推薦什麼？",
            answer: "What do you recommend?",
            hint: "recommend"
          },
          {
            prompt: "翻成英文：我想要這個。",
            answer: "I'd like this one.",
            acceptableAnswers: ["I would like this one."],
            hint: "I'd like..."
          }
        ],
        reviewSeeds: [
          { front: "你推薦什麼？", back: "What do you recommend?", hint: "recommend", tags: ["food", "order"] },
          { front: "我想要這個。", back: "I'd like this one.", hint: "I'd like...", tags: ["food", "order"] },
          { front: "可以不要冰嗎？", back: "Can I get it without ice?", hint: "without ice", tags: ["food", "request"] }
        ]
      },
      {
        lessonNumber: 2,
        title: "Make requests and pay",
        objective: "Ask for changes, the bill, and payment options.",
        vocabulary: ["bill", "card", "cash", "spicy", "separate"],
        chunks: ["Could we get the bill?", "Can I pay by card?", "Can you make it less spicy?"],
        dialogue: [
          "Learner: Excuse me, could we get the bill?",
          "Server: Sure. Will you pay by cash or card?",
          "Learner: By card, please."
        ],
        intro: "這課處理點餐後半段：調整口味、結帳、付款方式。",
        coachingNote: "結帳時先拿 bill，再接付款方式，句子會更自然。",
        practice: [
          {
            prompt: "翻成英文：可以幫我們拿帳單嗎？",
            answer: "Could we get the bill?",
            hint: "get the bill"
          },
          {
            prompt: "翻成英文：我可以刷卡嗎？",
            answer: "Can I pay by card?",
            hint: "pay by card"
          }
        ],
        reviewSeeds: [
          { front: "可以幫我們拿帳單嗎？", back: "Could we get the bill?", hint: "bill", tags: ["food", "payment"] },
          { front: "我可以刷卡嗎？", back: "Can I pay by card?", hint: "pay by card", tags: ["food", "payment"] },
          { front: "可以不要那麼辣嗎？", back: "Can you make it less spicy?", hint: "less spicy", tags: ["food", "request"] }
        ]
      }
    ]
  },
  {
    id: "unit-navigation",
    unitNumber: 5,
    stage: "mobility",
    title: "City Navigation",
    summary: "Ask for directions, check routes, and manage transport steps in the city.",
    lessons: [
      {
        lessonNumber: 1,
        title: "Ask for directions",
        objective: "Ask how to get somewhere and confirm the route.",
        vocabulary: ["station", "block", "straight", "corner", "across"],
        chunks: ["How do I get to...?", "Go straight for two blocks.", "Is it near here?"],
        dialogue: [
          "Learner: Excuse me, how do I get to City Hall Station?",
          "Local: Go straight for two blocks and turn left.",
          "Learner: Is it near here?",
          "Local: Yes, it's about a five-minute walk."
        ],
        intro: "問路時先說目的地，再確認距離，避免問題太散。",
        coachingNote: "目的地句型和距離句型分開記，現場比較好替換。",
        practice: [
          {
            prompt: "翻成英文：我要怎麼去市政府站？",
            answer: "How do I get to City Hall Station?",
            hint: "How do I get to...?"
          },
          {
            prompt: "翻成英文：離這裡近嗎？",
            answer: "Is it near here?",
            hint: "near here"
          }
        ],
        reviewSeeds: [
          { front: "我要怎麼去市政府站？", back: "How do I get to City Hall Station?", hint: "How do I get to...?", tags: ["navigation", "direction"] },
          { front: "直走兩個街口。", back: "Go straight for two blocks.", hint: "two blocks", tags: ["navigation", "direction"] },
          { front: "離這裡近嗎？", back: "Is it near here?", hint: "near here", tags: ["navigation", "distance"] }
        ]
      },
      {
        lessonNumber: 2,
        title: "Use tickets and transport",
        objective: "Ask about tickets, platforms, and transfer steps on public transport.",
        vocabulary: ["ticket", "platform", "line", "transfer", "tap"],
        chunks: ["Which platform should I take?", "Do I need to transfer?", "Can I tap with my card?"],
        dialogue: [
          "Learner: Which platform should I take for the blue line?",
          "Staff: Platform 2.",
          "Learner: Do I need to transfer?",
          "Staff: Yes, at Central Station."
        ],
        intro: "交通場景最重要的是 platform、transfer、tap 三個詞先聽熟。",
        coachingNote: "遇到交通問題先問路線和月台，再問是否轉乘。",
        practice: [
          {
            prompt: "翻成英文：我要搭哪個月台？",
            answer: "Which platform should I take?",
            hint: "Which platform..."
          },
          {
            prompt: "翻成英文：我需要轉車嗎？",
            answer: "Do I need to transfer?",
            hint: "need to transfer"
          }
        ],
        reviewSeeds: [
          { front: "我要搭哪個月台？", back: "Which platform should I take?", hint: "platform", tags: ["navigation", "transport"] },
          { front: "我需要轉車嗎？", back: "Do I need to transfer?", hint: "transfer", tags: ["navigation", "transport"] },
          { front: "我可以直接刷卡嗎？", back: "Can I tap with my card?", hint: "tap with my card", tags: ["navigation", "transport"] }
        ]
      }
    ]
  },
  {
    id: "unit-shopping",
    unitNumber: 6,
    stage: "daily",
    title: "Shopping and Errands",
    summary: "Ask about size, color, price, and returns in everyday shopping situations.",
    lessons: [
      {
        lessonNumber: 1,
        title: "Ask about products",
        objective: "Ask about size, color, and whether an item is available.",
        vocabulary: ["size", "color", "available", "fit", "try on"],
        chunks: ["Do you have this in medium?", "Can I try this on?", "Does it come in black?"],
        dialogue: [
          "Learner: Do you have this in medium?",
          "Staff: Let me check.",
          "Learner: Thanks. Also, does it come in black?",
          "Staff: Yes, it does."
        ],
        intro: "逛街最常用的不是長句，而是 size、color、available 這幾個高頻問句。",
        coachingNote: "先問尺寸，再問顏色和試穿，順序自然也好記。",
        practice: [
          {
            prompt: "翻成英文：這件有 M 號嗎？",
            answer: "Do you have this in medium?",
            hint: "in medium"
          },
          {
            prompt: "翻成英文：我可以試穿嗎？",
            answer: "Can I try this on?",
            hint: "try this on"
          }
        ],
        reviewSeeds: [
          { front: "這件有 M 號嗎？", back: "Do you have this in medium?", hint: "in medium", tags: ["shopping", "size"] },
          { front: "我可以試穿嗎？", back: "Can I try this on?", hint: "try this on", tags: ["shopping", "fit"] },
          { front: "這件有黑色嗎？", back: "Does it come in black?", hint: "come in black", tags: ["shopping", "color"] }
        ]
      },
      {
        lessonNumber: 2,
        title: "Pay and return items",
        objective: "Ask about payment, receipts, and returns at checkout.",
        vocabulary: ["receipt", "return", "exchange", "discount", "refund"],
        chunks: ["Can I return this later?", "Could I get the receipt?", "Is there a discount today?"],
        dialogue: [
          "Learner: Could I get the receipt?",
          "Staff: Sure.",
          "Learner: If it doesn't fit, can I return it later?",
          "Staff: Yes, within seven days."
        ],
        intro: "結帳時先拿 receipt，再問 return policy，句子最實用。",
        coachingNote: "退換貨問句可以整塊記，之後只改商品名稱或時間。",
        practice: [
          {
            prompt: "翻成英文：可以給我收據嗎？",
            answer: "Could I get the receipt?",
            hint: "receipt"
          },
          {
            prompt: "翻成英文：之後我可以退貨嗎？",
            answer: "Can I return this later?",
            hint: "return this later"
          }
        ],
        reviewSeeds: [
          { front: "可以給我收據嗎？", back: "Could I get the receipt?", hint: "receipt", tags: ["shopping", "checkout"] },
          { front: "之後我可以退貨嗎？", back: "Can I return this later?", hint: "return later", tags: ["shopping", "return"] },
          { front: "今天有折扣嗎？", back: "Is there a discount today?", hint: "discount", tags: ["shopping", "checkout"] }
        ]
      }
    ]
  },
  {
    id: "unit-work",
    unitNumber: 7,
    stage: "work",
    title: "Workplace Communication",
    summary: "Introduce yourself at work, join simple meetings, and report status clearly.",
    lessons: [
      {
        lessonNumber: 1,
        title: "Introduce yourself at work",
        objective: "Introduce your role, team, and current responsibilities at work.",
        vocabulary: ["role", "responsible", "support", "project", "launch"],
        chunks: ["I'm responsible for...", "I work on...", "Our team is preparing for..."],
        dialogue: [
          "Manager: Could you introduce yourself?",
          "Learner: Sure. I'm responsible for customer onboarding.",
          "Manager: What is your team working on now?",
          "Learner: Our team is preparing for a product launch."
        ],
        intro: "工作場景裡，自我介紹要更聚焦角色、任務和專案。",
        coachingNote: "先講 role，再講 responsibility，最後補上 project context。",
        practice: [
          {
            prompt: "翻成英文：我負責客戶導入。",
            answer: "I'm responsible for customer onboarding.",
            hint: "responsible for"
          },
          {
            prompt: "翻成英文：我們團隊正在準備產品上線。",
            answer: "Our team is preparing for a product launch.",
            hint: "preparing for"
          }
        ],
        reviewSeeds: [
          { front: "我負責客戶導入。", back: "I'm responsible for customer onboarding.", hint: "responsible for", tags: ["work", "intro"] },
          { front: "我目前在做內部工具。", back: "I work on internal tools right now.", hint: "work on", tags: ["work", "intro"] },
          { front: "我們團隊正在準備產品上線。", back: "Our team is preparing for a product launch.", hint: "product launch", tags: ["work", "project"] }
        ]
      },
      {
        lessonNumber: 2,
        title: "Join a simple meeting",
        objective: "Share updates, ask clarifying questions, and confirm next steps in a meeting.",
        vocabulary: ["update", "deadline", "issue", "clarify", "next step"],
        chunks: ["Here's a quick update.", "Could you clarify that point?", "What are the next steps?"],
        dialogue: [
          "Learner: Here's a quick update on the support dashboard.",
          "Colleague: Great. Any blockers?",
          "Learner: One issue is the reporting delay.",
          "Colleague: Understood. Let's review the next steps."
        ],
        intro: "會議裡先把 update、issue、next step 三種句型講穩，開口壓力會小很多。",
        coachingNote: "更新先說進度，再說問題，最後問 next steps。",
        practice: [
          {
            prompt: "翻成英文：我先快速更新一下。",
            answer: "Here's a quick update.",
            hint: "quick update"
          },
          {
            prompt: "翻成英文：你可以再說明一下那一點嗎？",
            answer: "Could you clarify that point?",
            hint: "clarify that point"
          }
        ],
        reviewSeeds: [
          { front: "我先快速更新一下。", back: "Here's a quick update.", hint: "quick update", tags: ["work", "meeting"] },
          { front: "你可以再說明一下那一點嗎？", back: "Could you clarify that point?", hint: "clarify", tags: ["work", "meeting"] },
          { front: "接下來的步驟是什麼？", back: "What are the next steps?", hint: "next steps", tags: ["work", "meeting"] }
        ]
      }
    ]
  },
  {
    id: "unit-scheduling",
    unitNumber: 8,
    stage: "work",
    title: "Scheduling and Follow-up",
    summary: "Make plans, schedule meetings, and confirm follow-up clearly.",
    lessons: [
      {
        lessonNumber: 1,
        title: "Make plans and schedule",
        objective: "Suggest times, confirm availability, and set a simple schedule.",
        vocabulary: ["available", "schedule", "morning", "afternoon", "calendar"],
        chunks: ["Are you available tomorrow?", "How about Thursday morning?", "I'll put it on the calendar."],
        dialogue: [
          "Learner: Are you available tomorrow afternoon?",
          "Colleague: I'm busy then.",
          "Learner: How about Thursday morning?",
          "Colleague: That works for me."
        ],
        intro: "安排時間的關鍵不是很多單字，而是能快速提出一個可行時段。",
        coachingNote: "先問 availability，再提出具體時段，最後確認。",
        practice: [
          {
            prompt: "翻成英文：你明天下午有空嗎？",
            answer: "Are you available tomorrow afternoon?",
            hint: "available tomorrow afternoon"
          },
          {
            prompt: "翻成英文：星期四早上怎麼樣？",
            answer: "How about Thursday morning?",
            hint: "How about..."
          }
        ],
        reviewSeeds: [
          { front: "你明天下午有空嗎？", back: "Are you available tomorrow afternoon?", hint: "available", tags: ["schedule", "planning"] },
          { front: "星期四早上怎麼樣？", back: "How about Thursday morning?", hint: "How about...", tags: ["schedule", "planning"] },
          { front: "我會把它放進行事曆。", back: "I'll put it on the calendar.", hint: "put it on the calendar", tags: ["schedule", "planning"] }
        ]
      },
      {
        lessonNumber: 2,
        title: "Confirm and follow up",
        objective: "Confirm decisions, send follow-up messages, and restate next actions.",
        vocabulary: ["confirm", "follow up", "share", "summary", "action item"],
        chunks: ["Just to confirm...", "I'll follow up by email.", "I'll share a short summary."],
        dialogue: [
          "Learner: Just to confirm, we'll meet on Thursday at ten.",
          "Colleague: Yes.",
          "Learner: Great. I'll follow up by email and share a short summary.",
          "Colleague: Perfect."
        ],
        intro: "最後一課把安排完成後的確認與 follow-up 講清楚。",
        coachingNote: "確認句和 follow-up 句成對記，之後任何安排都能直接套用。",
        practice: [
          {
            prompt: "翻成英文：確認一下，我們星期四十點見。",
            answer: "Just to confirm, we'll meet on Thursday at ten.",
            hint: "Just to confirm..."
          },
          {
            prompt: "翻成英文：我會再寄 email 跟進。",
            answer: "I'll follow up by email.",
            hint: "follow up by email"
          }
        ],
        reviewSeeds: [
          { front: "確認一下，我們星期四十點見。", back: "Just to confirm, we'll meet on Thursday at ten.", hint: "Just to confirm", tags: ["schedule", "follow-up"] },
          { front: "我會再寄 email 跟進。", back: "I'll follow up by email.", hint: "follow up", tags: ["schedule", "follow-up"] },
          { front: "我會分享一份簡短摘要。", back: "I'll share a short summary.", hint: "short summary", tags: ["schedule", "follow-up"] }
        ]
      }
    ]
  },
  {
    id: "unit-social",
    unitNumber: 9,
    stage: "daily",
    title: "Social Small Talk",
    summary: "Handle casual conversations, invitations, and light follow-up in everyday social situations.",
    lessons: [
      {
        lessonNumber: 1,
        title: "Start a casual conversation",
        objective: "Open a light conversation, ask simple follow-up questions, and keep it going naturally.",
        vocabulary: ["weekend", "busy", "fun", "usually", "favorite"],
        chunks: ["How's your week going?", "What do you usually do on weekends?", "That sounds fun."],
        dialogue: [
          "Learner: Hi, how's your week going?",
          "Friend: Pretty busy, but good.",
          "Learner: What do you usually do on weekends?",
          "Friend: I usually go hiking."
        ],
        intro: "這個單元開始從任務導向轉向社交互動，重點是自然接話而不是一次說很多。",
        coachingNote: "先用一個簡單開場，再丟出 follow-up question，對話就能繼續。",
        practice: [
          {
            prompt: "翻成英文：你這週過得怎麼樣？",
            answer: "How's your week going?",
            acceptableAnswers: ["How is your week going?"],
            hint: "How's your..."
          },
          {
            prompt: "翻成英文：你週末通常都做什麼？",
            answer: "What do you usually do on weekends?",
            hint: "usually do on weekends"
          }
        ],
        reviewSeeds: [
          { front: "你這週過得怎麼樣？", back: "How's your week going?", hint: "How's your...", tags: ["social", "small-talk"] },
          { front: "你週末通常都做什麼？", back: "What do you usually do on weekends?", hint: "usually do on weekends", tags: ["social", "small-talk"] },
          { front: "聽起來很有趣。", back: "That sounds fun.", hint: "sounds fun", tags: ["social", "response"] }
        ]
      },
      {
        lessonNumber: 2,
        title: "Make a simple plan",
        objective: "Invite someone, confirm a simple plan, and respond casually.",
        vocabulary: ["grab", "join", "free", "after work", "plan"],
        chunks: ["Do you want to grab coffee?", "Are you free after work?", "That works for me."],
        dialogue: [
          "Learner: Are you free after work tomorrow?",
          "Friend: I think so. Why?",
          "Learner: Do you want to grab coffee?",
          "Friend: Sure. That works for me."
        ],
        intro: "社交對話的下一步是提出簡單邀請，不需要複雜，只要直接自然。",
        coachingNote: "邀請句先簡短，對方回應後再補時間和安排。",
        practice: [
          {
            prompt: "翻成英文：你明天下班後有空嗎？",
            answer: "Are you free after work tomorrow?",
            hint: "free after work"
          },
          {
            prompt: "翻成英文：你想一起喝咖啡嗎？",
            answer: "Do you want to grab coffee?",
            hint: "grab coffee"
          }
        ],
        reviewSeeds: [
          { front: "你明天下班後有空嗎？", back: "Are you free after work tomorrow?", hint: "after work", tags: ["social", "plan"] },
          { front: "你想一起喝咖啡嗎？", back: "Do you want to grab coffee?", hint: "grab coffee", tags: ["social", "invite"] },
          { front: "這樣對我可以。", back: "That works for me.", hint: "works for me", tags: ["social", "response"] }
        ]
      }
    ]
  },
  {
    id: "unit-problems",
    unitNumber: 10,
    stage: "daily",
    title: "Problems and Fixes",
    summary: "Explain a problem clearly, ask for help, and confirm a solution in common situations.",
    lessons: [
      {
        lessonNumber: 1,
        title: "Explain what went wrong",
        objective: "Describe a simple problem and explain what is not working.",
        vocabulary: ["broken", "late", "wrong", "order", "screen"],
        chunks: ["Something's wrong with...", "It isn't working properly.", "I think there's a mistake."],
        dialogue: [
          "Learner: Hi, something's wrong with my order.",
          "Staff: What seems to be the problem?",
          "Learner: I think there's a mistake. It isn't working properly.",
          "Staff: Let me take a look."
        ],
        intro: "遇到問題時最重要的是把狀況講清楚，而不是一開始就急著找解法。",
        coachingNote: "先描述問題，再補一個簡短結果，對方會比較容易理解。",
        practice: [
          {
            prompt: "翻成英文：我的訂單出了點問題。",
            answer: "Something's wrong with my order.",
            acceptableAnswers: ["Something is wrong with my order."],
            hint: "Something's wrong with..."
          },
          {
            prompt: "翻成英文：它沒有正常運作。",
            answer: "It isn't working properly.",
            acceptableAnswers: ["It is not working properly."],
            hint: "working properly"
          }
        ],
        reviewSeeds: [
          { front: "我的訂單出了點問題。", back: "Something's wrong with my order.", hint: "Something's wrong", tags: ["problem", "explain"] },
          { front: "它沒有正常運作。", back: "It isn't working properly.", hint: "working properly", tags: ["problem", "explain"] },
          { front: "我覺得這裡有個錯誤。", back: "I think there's a mistake.", hint: "there's a mistake", tags: ["problem", "explain"] }
        ]
      },
      {
        lessonNumber: 2,
        title: "Ask for a fix",
        objective: "Ask what can be done, request a replacement, and confirm the solution.",
        vocabulary: ["replace", "check", "fix", "right away", "another"],
        chunks: ["Could you check this for me?", "Can I get another one?", "That solves it."],
        dialogue: [
          "Learner: Could you check this for me?",
          "Staff: Of course.",
          "Learner: If possible, can I get another one?",
          "Staff: Yes, right away."
        ],
        intro: "當問題已經說清楚後，下一步就是用短句提出你想要的處理方式。",
        coachingNote: "先請對方檢查，再提出 replacement 或 fix request，會更自然。",
        practice: [
          {
            prompt: "翻成英文：你可以幫我檢查一下嗎？",
            answer: "Could you check this for me?",
            hint: "check this for me"
          },
          {
            prompt: "翻成英文：我可以換一個新的嗎？",
            answer: "Can I get another one?",
            hint: "another one"
          }
        ],
        reviewSeeds: [
          { front: "你可以幫我檢查一下嗎？", back: "Could you check this for me?", hint: "check this", tags: ["problem", "fix"] },
          { front: "我可以換一個新的嗎？", back: "Can I get another one?", hint: "another one", tags: ["problem", "fix"] },
          { front: "這樣就解決了。", back: "That solves it.", hint: "solves it", tags: ["problem", "result"] }
        ]
      }
    ]
  }
];

function buildLessonAsset(
  unit: BaseUnit,
  lesson: BaseLesson,
  profile: LearnerProfile,
  lessonId: string,
): LessonAsset {
  const paceLead =
    profile.dailyMinutes <= 10
      ? "今天先抓最核心的兩到三句，短時間也要把輸出做穩。"
      : profile.dailyMinutes >= 30
        ? "今天可以多做一輪完整輸出，把句型和變化都一起練起來。"
        : "今天維持短而穩的節奏，把關鍵句先說順。";

  const focusLead =
    profile.focus === "work"
      ? "把句子想像成你在工作情境裡真的會開口說的版本。"
      : profile.focus === "daily"
        ? "優先練到能在日常互動裡自然脫口而出。"
        : profile.focus === "travel"
          ? "把它放進旅行情境裡想，先求能順利應對。"
          : "先用系統化的方式記住高頻句型，再慢慢擴展。";

  const levelHint =
    profile.level === "A1"
      ? "先模仿整句，不要急著自己改寫。"
      : profile.level === "A2"
        ? "先把整句說順，再替換少量資訊。"
        : profile.level === "B1"
          ? "先完整表達，再微調語氣和自然度。"
          : "優先追求自然、流暢和回應速度。";

  const practice = lesson.practice.map((question, index) => ({
    id: `${lessonId}-practice-${index + 1}`,
    prompt: question.prompt,
    answer: question.answer,
    acceptableAnswers: question.acceptableAnswers,
    hint: `${question.hint} ${levelHint}`.trim()
  }));

  const reviewSeeds: LessonReviewSeed[] = lesson.reviewSeeds.map((seed, index) => ({
    id: `${lessonId}-review-${index + 1}`,
    front: seed.front,
    back: seed.back,
    hint: seed.hint,
    tags: [...seed.tags, unit.id, profile.focus]
  }));

  return {
    id: lessonId,
    unitId: unit.id,
    intro: `${paceLead} ${lesson.intro}`,
    coachingNote: `${focusLead} ${lesson.coachingNote}`,
    practice,
    reviewSeeds
  };
}

export function buildCourseTrack(profile: LearnerProfile): CourseTrack {
  let dayNumber = 1;

  const units: CourseUnit[] = baseUnits.map((unit) => ({
    id: unit.id,
    unitNumber: unit.unitNumber,
    stage: unit.stage,
    title: unit.title,
    summary: unit.summary,
    lessons: unit.lessons.map((lesson) => {
      const lessonId = `${unit.id}-lesson-${lesson.lessonNumber}`;
      const courseLesson: CourseLesson = {
        id: lessonId,
        unitId: unit.id,
        lessonNumber: lesson.lessonNumber,
        dayNumber: dayNumber++,
        title: lesson.title,
        objective: lesson.objective,
        vocabulary: lesson.vocabulary,
        chunks: lesson.chunks,
        dialogue: lesson.dialogue,
        asset: buildLessonAsset(unit, lesson, profile, lessonId)
      };

      return courseLesson;
    })
  }));

  return {
    id: "english-core-track",
    title: "English Core Track",
    language: "english",
    units
  };
}

export function buildStudyPlan(track: CourseTrack): StudyPlanDay[] {
  return track.units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({
      id: lesson.id,
      lessonId: lesson.id,
      unitId: unit.id,
      unitTitle: unit.title,
      unitNumber: unit.unitNumber,
      dayNumber: lesson.dayNumber,
      title: lesson.title,
      objective: lesson.objective,
      vocabulary: lesson.vocabulary,
      chunks: lesson.chunks,
      dialogue: lesson.dialogue
    })),
  );
}

export function buildLessonMap(track: CourseTrack): Record<string, LessonAsset> {
  return Object.fromEntries(
    track.units.flatMap((unit) => unit.lessons.map((lesson) => [lesson.id, lesson.asset])),
  );
}

export function buildReviewItemsForLesson(lesson: CourseLesson, now = new Date()): ReviewItem[] {
  return lesson.asset.reviewSeeds.map((seed) => ({
    id: seed.id,
    front: seed.front,
    back: seed.back,
    hint: seed.hint,
    tags: seed.tags,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitionCount: 0,
    lapseCount: 0,
    dueDate: now.toISOString()
  }));
}

export function buildCourseState(params: {
  onboarded: boolean;
  streak: number;
  profile: LearnerProfile;
  currentDay: number;
  reviewItems: ReviewItem[];
  reviewLogs: AppState["reviewLogs"];
}): AppState {
  const courseTrack = buildCourseTrack(params.profile);
  const plan = buildStudyPlan(courseTrack);
  const lessons = buildLessonMap(courseTrack);

  return {
    onboarded: params.onboarded,
    streak: params.streak,
    profile: params.profile,
    currentDay: Math.min(Math.max(params.currentDay, 1), plan.length),
    courseTrack,
    plan,
    lessons,
    reviewItems: params.reviewItems,
    reviewLogs: params.reviewLogs
  };
}
