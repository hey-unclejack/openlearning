import { AppState, LearnerProfile, Lesson, ReviewItem, StudyPlanDay } from "@/lib/types";

const defaultProfile: LearnerProfile = {
  targetLanguage: "English",
  nativeLanguage: "Traditional Chinese",
  level: "A2",
  dailyMinutes: 15,
  focus: "travel conversation"
};

const plan: StudyPlanDay[] = [
  {
    id: "day-1",
    dayNumber: 1,
    title: "Smooth Arrival",
    objective: "能完成自我介紹與機場櫃台的基本對話。",
    vocabulary: ["passport", "arrival", "boarding pass", "purpose", "vacation"],
    chunks: ["I'm here for vacation.", "Could you help me?", "Where should I go next?"],
    dialogue: [
      "Officer: What's the purpose of your visit?",
      "Learner: I'm here for vacation.",
      "Officer: How long will you stay?",
      "Learner: I'll stay for five days."
    ]
  },
  {
    id: "day-2",
    dayNumber: 2,
    title: "Check-In Confidence",
    objective: "能在飯店完成入住、詢問早餐與 Wi-Fi。",
    vocabulary: ["reservation", "check in", "available", "breakfast", "password"],
    chunks: ["I have a reservation.", "Is breakfast included?", "Could I have the Wi-Fi password?"],
    dialogue: [
      "Guest: Hi, I have a reservation under Lin.",
      "Clerk: Great. May I see your passport?",
      "Guest: Sure. Is breakfast included?",
      "Clerk: Yes, from 7 to 10."
    ]
  },
  {
    id: "day-3",
    dayNumber: 3,
    title: "Ordering Without Stress",
    objective: "能在餐廳點餐、調整需求與結帳。",
    vocabulary: ["menu", "recommend", "vegetarian", "bill", "spicy"],
    chunks: ["What do you recommend?", "I'd like this one.", "Could we get the bill?"],
    dialogue: [
      "Server: Are you ready to order?",
      "Learner: What do you recommend?",
      "Server: Our noodles are popular.",
      "Learner: Great. I'd like this one."
    ]
  }
];

const lessons: Record<string, Lesson> = {
  "lesson-day-1": {
    id: "lesson-day-1",
    dayId: "day-1",
    intro: "把注意力放在完整語塊，而不是單字本身。今天只要能自然說出 3 句關鍵句就夠了。",
    coachingNote: "先完成複習，再進入新內容。答題時先回想，再看答案。",
    practice: [
      {
        id: "q1",
        prompt: "把這句翻成英文：我是來度假的。",
        answer: "I'm here for vacation.",
        acceptableAnswers: ["I am here for vacation."],
        hint: "使用 here for + 目的"
      },
      {
        id: "q2",
        prompt: "機場櫃台問你接下來要去哪裡。請用英文回應：你可以幫我嗎？",
        answer: "Could you help me?",
        acceptableAnswers: ["Can you help me?"],
        hint: "更自然且有禮貌的問法"
      },
      {
        id: "q3",
        prompt: "補全句子：Where should I ____ next?",
        answer: "go",
        hint: "和 이동/前往 相關的動詞"
      }
    ]
  },
  "lesson-day-2": {
    id: "lesson-day-2",
    dayId: "day-2",
    intro: "飯店場景重點是資訊交換：有沒有訂房、早餐時間、Wi-Fi。每個問題都要短而清楚。",
    coachingNote: "先理解情境，再背句型。句型要直接拿來說。",
    practice: [
      {
        id: "q1",
        prompt: "翻成英文：我有訂房。",
        answer: "I have a reservation.",
        hint: "reservation"
      }
    ]
  },
  "lesson-day-3": {
    id: "lesson-day-3",
    dayId: "day-3",
    intro: "今天重點是餐廳裡最常用的三種功能句：詢問推薦、下單、買單。",
    coachingNote: "把問句整塊記住，之後只替換菜名。",
    practice: [
      {
        id: "q1",
        prompt: "翻成英文：你推薦什麼？",
        answer: "What do you recommend?",
        hint: "recommend"
      }
    ]
  }
};

const makeReviewItem = (
  id: string,
  front: string,
  back: string,
  hint: string,
  tags: string[],
): ReviewItem => ({
  id,
  front,
  back,
  hint,
  tags,
  easeFactor: 2.5,
  intervalDays: 0,
  repetitionCount: 0,
  lapseCount: 0,
  dueDate: new Date().toISOString()
});

const reviewItems: ReviewItem[] = [
  makeReviewItem("ri-1", "我是來度假的。", "I'm here for vacation.", "here for + 名詞", ["day-1", "travel"]),
  makeReviewItem("ri-2", "你可以幫我嗎？", "Could you help me?", "Could you ...?", ["day-1", "survival"]),
  makeReviewItem("ri-3", "我接下來該去哪裡？", "Where should I go next?", "疑問詞 + should I", ["day-1", "navigation"]),
  makeReviewItem("ri-4", "我有訂房。", "I have a reservation.", "reservation", ["day-2", "hotel"]),
  makeReviewItem("ri-5", "早餐有包含嗎？", "Is breakfast included?", "included", ["day-2", "hotel"])
];

export function createInitialState(): AppState {
  return {
    onboarded: false,
    streak: 4,
    profile: defaultProfile,
    currentDay: 1,
    plan,
    lessons,
    reviewItems,
    reviewLogs: []
  };
}
