export const LOCALE_COOKIE = "openlearning_locale";

export type AppLocale = "zh-TW" | "en";

export function resolveLocale(value?: string | null): AppLocale {
  if (!value) {
    return "en";
  }

  const normalized = value.toLowerCase();

  if (normalized.startsWith("zh")) {
    return "zh-TW";
  }

  return "en";
}

export function getLocaleCopy(locale: AppLocale) {
  const isZh = locale === "zh-TW";

  return {
    htmlLang: isZh ? "zh-Hant" : "en",
    appShell: {
      nav: {
        dashboard: isZh ? "儀表板" : "Dashboard",
        today: isZh ? "今日學習" : "Today",
        review: isZh ? "複習" : "Review",
        progress: isZh ? "進度" : "Progress",
        profile: isZh ? "個人設定" : "Profile"
      },
      tagline: isZh ? "以記憶優先的語言教練" : "SRS-first language coach",
      learningLoop: isZh ? "學習循環" : "Learning Loop",
      signOut: isZh ? "登出" : "Sign out"
    },
    marketing: {
      login: isZh ? "登入" : "Log in",
      signup: isZh ? "註冊" : "Sign up",
      dashboard: isZh ? "儀表板" : "Dashboard",
      todayNav: isZh ? "今日學習" : "Today",
      setup: isZh ? "設定" : "Setup",
      eyebrow: isZh ? "語言記憶引擎" : "Language Retention Engine",
      title: isZh ? "少學一點，記住更多。" : "Learn less. Remember more.",
      description: isZh
        ? "OpenLearning 結合間隔重複、主動回想與短場景課程，形成每日學習循環，清楚告訴學習者先複習什麼、下一步學什麼，以及哪些地方還不穩。"
        : "OpenLearning combines spaced repetition, active recall, and short scene-based lessons into a daily loop that tells the learner exactly what to review, what to learn next, and where they are still weak.",
      loginCta: isZh ? "立即登入" : "Log in now",
      signupCta: isZh ? "免費註冊" : "Create account",
      previewCta: isZh ? "先看學習區" : "Preview the app",
      features: [
        {
          title: isZh ? "SRS 優先隊列" : "SRS-first queue",
          body: isZh ? "先處理到期複習，再安排新內容。" : "Due reviews come first. New lessons wait until memory is serviced."
        },
        {
          title: isZh ? "場景式課程" : "Scene-based lessons",
          body: isZh ? "以旅遊、飯店與餐廳情境學會可直接使用的語塊。" : "Travel, hotel, and restaurant scenarios are taught as usable chunks."
        },
        {
          title: isZh ? "快速回饋" : "Fast feedback",
          body: isZh ? "不只顯示答案，也會指出修正方向。" : "The app checks output and explains the correction instead of only showing answers."
        }
      ],
      todaySection: isZh ? "今天" : "Today",
      cardsDue: isZh ? "張卡片目前到期" : "cards due right now",
      retention: isZh ? "記憶維持率" : "retention score",
      currentStreak: isZh ? "目前連續天數" : "Current streak",
      mastered: isZh ? "已掌握" : "Mastered",
      focus: isZh ? "學習重點" : "Focus"
    },
    auth: {
      eyebrow: "Supabase Auth",
      accessPolicyTitle: isZh ? "存取政策" : "Access policy",
      accessPolicyBody: isZh
        ? "目前只接受 Google 帳號登入，不提供 email/password。"
        : "This product currently supports Google sign-in only. Email/password is not available.",
      redirecting: isZh ? "導向 Google..." : "Redirecting to Google...",
      signIn: isZh ? "使用 Google 登入" : "Continue with Google",
      signUp: isZh ? "使用 Google 註冊" : "Sign up with Google",
      loginTitle: isZh ? "登入你的學習帳號" : "Log in to your learning account",
      loginBody: isZh
        ? "你可以先從首頁瀏覽功能；進入學習區、進度頁或設定頁時，系統會引導你先登入。"
        : "You can explore the homepage first. When you enter study, progress, or setup areas, the app will ask you to log in.",
      signupTitle: isZh ? "註冊並開始學習" : "Create your account and start learning",
      signupBody: isZh
        ? "使用 Google 快速建立帳號。完成後會直接帶你回剛剛想前往的頁面。"
        : "Create your account with Google and return directly to the page you originally wanted.",
      noAccount: isZh ? "還沒有帳號？" : "Need an account?",
      hasAccount: isZh ? "已經有帳號？" : "Already have an account?",
      goSignup: isZh ? "前往註冊" : "Go to sign up",
      goLogin: isZh ? "前往登入" : "Go to log in"
    },
    dashboard: {
      eyebrow: isZh ? "儀表板" : "Dashboard",
      title: isZh ? "今天靠記憶節奏，不靠意志力。" : "Today runs on memory, not motivation.",
      startToday: isZh ? "開始今天任務" : "Start today",
      dueNow: isZh ? "目前到期" : "Due now",
      dueBody: isZh ? "優先完成這批到期卡片，再進新內容。" : "Finish due cards first before adding new material.",
      retentionScore: isZh ? "記憶維持率" : "Retention score",
      retentionBody: isZh ? "根據複習間隔、答題穩定度與 lapse 估算。" : "Estimated from spacing, answer stability, and lapses.",
      currentStreak: isZh ? "目前連續天數" : "Current streak",
      streakUnit: isZh ? "天" : "days",
      streakBody: isZh ? "短任務、高頻率，比一次塞很多更重要。" : "Short, frequent sessions matter more than cramming.",
      currentLesson: isZh ? "目前課程" : "Current lesson",
      openLesson: isZh ? "打開課程" : "Open lesson",
      weakSpots: isZh ? "弱點區" : "Weak spots",
      lapses: isZh ? "失誤次數" : "lapses",
      recentReview: isZh ? "最近複習紀錄" : "Recent review activity",
      noLogs: isZh ? "還沒有複習紀錄，先完成今天的複習。" : "No review logs yet. Finish today's review first.",
      nextDue: isZh ? "下次到期" : "next due"
    },
    progress: {
      eyebrow: isZh ? "進度" : "Progress",
      title: isZh ? "追蹤記憶，不只追蹤活躍度。" : "Track memory, not just activity.",
      completedDays: isZh ? "完成天數" : "Completed days",
      masteredItems: isZh ? "已掌握項目" : "Mastered items",
      reviewAttempts: isZh ? "複習次數" : "Review attempts",
      planMap: isZh ? "學習地圖" : "Plan map",
      day: isZh ? "第" : "Day",
      daySuffix: isZh ? "天" : "",
      weaknessTrend: isZh ? "弱點趨勢" : "Weakness trend",
      interval: isZh ? "間隔" : "interval",
      dayUnit: isZh ? "天" : "day(s)",
      lapses: isZh ? "失誤次數" : "lapses"
    },
    todayPage: {
      eyebrow: isZh ? "今天" : "Today",
      title: isZh ? "一輪複習，一堂課，今天完成。" : "One review block. One lesson. Done.",
      step1: isZh ? "步驟 1" : "Step 1",
      clearReviews: isZh ? "清空到期複習" : "Clear due reviews",
      dueMessage: isZh
        ? (count: number) => `今天有 ${count} 張卡片到期。先做這批，才能讓記憶曲線回穩。`
        : (count: number) => `${count} cards are due today. Clear them first to stabilize the memory curve.`,
      startReview: isZh ? "開始複習" : "Start review",
      step2: isZh ? "步驟 2" : "Step 2",
      openLesson: isZh ? "打開課程" : "Open lesson"
    },
    reviewPage: {
      eyebrow: isZh ? "SRS 複習" : "SRS Review",
      title: isZh ? "在快忘記的邊緣完成複習。" : "Review at the edge of forgetting.",
      body: isZh
        ? "這裡的體驗刻意保持簡單。先回想，再翻答案，再用四級評分更新間隔。"
        : "This experience is intentionally simple. Recall first, reveal the answer, then update the interval with a four-point score.",
      back: isZh ? "返回今日學習" : "Back to today",
      reviewDone: isZh ? "複習完成" : "Review Done",
      reviewDoneTitle: isZh ? "今天到期的卡片已完成" : "All due cards for today are done",
      reviewDoneBody: isZh
        ? "接下來去完成今日新課程，讓系統明天開始替你安排下一輪複習。"
        : "Continue with today's lesson so the system can schedule the next review cycle.",
      dueCard: isZh ? "到期卡片" : "Due Card",
      hint: isZh ? "先在腦中回想，再翻答案。提示：" : "Recall it first, then reveal the answer. Hint: ",
      showAnswer: isZh ? "顯示答案" : "Show answer",
      submitError: isZh ? "送出失敗，請重試。" : "Submission failed. Please try again.",
      updated: isZh ? "已更新：" : "Updated: ",
      remaining: isZh ? (count: number) => `剩餘 ${count} 張到期卡片` : (count: number) => `${count} due cards remaining`
    },
    onboarding: {
      eyebrow: isZh ? "學習者設定" : "Learner Setup",
      title: isZh ? "先定節奏，再擴內容。" : "Set the rhythm before you scale content.",
      body: isZh
        ? "先把語言、程度、學習目標和每日時間定清楚，之後 lesson 與 SRS queue 才能一致。"
        : "Define language, level, learning goal, and daily time first so lessons and the SRS queue stay aligned.",
      profile: isZh ? "個人設定" : "Profile",
      currentDefaults: isZh ? "目前預設值" : "Current defaults",
      targetLanguage: isZh ? "目標語言" : "Target language",
      level: isZh ? "目前程度" : "Current level",
      focus: isZh ? "學習目標" : "Learning focus",
      dailyMinutes: isZh ? "每日學習分鐘數" : "Daily minutes",
      nativeLanguage: isZh ? "母語" : "Native language",
      saveError: isZh ? "設定失敗，請稍後再試。" : "Setup failed. Please try again later.",
      creating: isZh ? "建立中..." : "Creating...",
      createPlan: isZh ? "建立學習計畫" : "Create learning plan"
    },
    lesson: {
      lessonPrefix: isZh ? "課程" : "Lesson",
      vocabulary: isZh ? "單字" : "Vocabulary",
      chunks: isZh ? "語塊" : "Chunks",
      dialogue: isZh ? "對話" : "Dialogue",
      coachNote: isZh ? "教練提示" : "Coach note",
      practice: isZh ? "練習" : "Practice",
      promptHint: isZh ? "提示：" : "Hint: ",
      checkAnswer: isZh ? "檢查答案" : "Check answer"
    }
  };
}
