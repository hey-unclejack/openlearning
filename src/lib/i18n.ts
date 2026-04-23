export const LOCALE_COOKIE = "openlearning_locale";
export const USER_LOCALE_METADATA_KEY = "app_locale";

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
  const profileLabels = {
    targetLanguage: {
      english: isZh ? "英文" : "English"
    },
    nativeLanguage: {
      "zh-TW": isZh ? "中文" : "Chinese"
    },
    levelTitle: {
      A1: isZh ? "初學者" : "Beginner",
      A2: isZh ? "基礎階段" : "Elementary",
      B1: isZh ? "日常應對" : "Conversational",
      B2: isZh ? "進階使用" : "Independent"
    },
    level: {
      A1: isZh ? "A1 初學者：我剛開始接觸英文" : "A1 Beginner: I'm just getting started with English",
      A2: isZh ? "A2 基礎階段：我知道一些單字和句子" : "A2 Elementary: I know some words and simple sentences",
      B1: isZh ? "B1 日常應對：我能做基本對話" : "B1 Conversational: I can handle basic daily conversations",
      B2: isZh ? "B2 進階使用：我想提升自然度和表達力" : "B2 Independent: I want to sound more natural and expressive"
    },
    focus: {
      travel: isZh ? "旅遊與情境會話" : "Travel and situational conversation",
      daily: isZh ? "日常口說與聽懂" : "Everyday speaking and listening",
      work: isZh ? "工作溝通與表達" : "Work communication and expression",
      exam: isZh ? "基礎建立與系統練習" : "Foundation building and structured practice"
    }
  } as const;

  return {
    htmlLang: isZh ? "zh-Hant" : "en",
    profileLabels,
    appShell: {
      nav: {
        dashboard: isZh ? "儀表板" : "Dashboard",
        today: isZh ? "今日學習" : "Today",
        review: isZh ? "複習" : "Review",
        progress: isZh ? "進度" : "Progress",
        profile: isZh ? "個人檔案" : "Profile"
      },
      tagline: isZh ? "以記憶優先的語言教練" : "SRS-first language coach",
      learningLoop: isZh ? "學習循環" : "Learning Loop",
      signOut: isZh ? "登出" : "Sign out",
      myLearning: isZh ? "我的學習" : "My learning"
    },
    profilePage: {
      eyebrow: isZh ? "個人檔案" : "Profile",
      title: isZh ? "管理你的個人檔案與學習偏好。" : "Manage your profile and learning preferences.",
      body: isZh ? "這裡整理你的個人資訊與學習成就。" : "This area brings together your profile details and learning achievements.",
      infoEyebrow: isZh ? "個人資訊" : "Personal info",
      infoTitle: isZh ? "管理個人資訊" : "Manage personal info",
      loginAccount: isZh ? "登入帳號" : "Login account",
      displayName: isZh ? "用戶名稱" : "Display name",
      avatar: isZh ? "用戶頭像" : "Avatar",
      uploadAvatar: isZh ? "上傳圖片" : "Upload image",
      uploadHint: isZh ? "選擇一張圖片作為你的頭像" : "Choose an image for your avatar",
      editName: isZh ? "編輯名稱" : "Edit name",
      editAvatar: isZh ? "編輯頭像" : "Edit avatar",
      saveName: isZh ? "儲存名稱" : "Save name",
      savingName: isZh ? "儲存中..." : "Saving...",
      userId: isZh ? "用戶 UID" : "User UID",
      email: isZh ? "用戶 email" : "Email",
      noName: isZh ? "尚未設定名稱" : "No name set",
      saveSuccess: isZh ? "個人檔案已更新。" : "Profile updated.",
      saveError: isZh ? "更新失敗，請稍後再試。" : "Update failed. Please try again later.",
      achievementEyebrow: isZh ? "成就" : "Achievements",
      achievementTitle: isZh ? "你的學習里程碑" : "Your learning milestones",
      badgeFirstSession: isZh ? "初次複習" : "First Session",
      badgeWarmStreak: isZh ? "暖身連續" : "Warm Streak",
      badgeWeeklyRhythm: isZh ? "一週節奏" : "Weekly Rhythm",
      badgeReviewBuilder: isZh ? "複習累積者" : "Review Builder",
      badgeLessonStarter: isZh ? "課程啟動" : "Lesson Starter",
      badgeLessonMomentum: isZh ? "課程推進" : "Lesson Momentum",
      badgeUnlocked: isZh ? "已解鎖" : "Unlocked",
      badgeLocked: isZh ? "尚未解鎖" : "Locked",
      badgeProgress: isZh ? (current: number, target: number) => `${current} / ${target}` : (current: number, target: number) => `${current} / ${target}`,
      navOverview: isZh ? "個人資訊" : "Profile",
      navGoals: isZh ? "學習目標" : "Learning goals",
      navSettings: isZh ? "設定" : "Settings",
      railEyebrow: isZh ? "個人檔案" : "Profile",
      railBody: isZh ? "管理帳號資料、學習目標與個人設定。" : "Manage account details, learning goals, and settings.",
      railNavEyebrow: isZh ? "個人頁面" : "Profile pages"
    },
    settingsPage: {
      eyebrow: isZh ? "設定" : "Settings",
      title: isZh ? "管理系統顯示設定。" : "Manage system display preferences.",
      language: isZh ? "顯示語言" : "Display language",
      languageEyebrow: isZh ? "設定顯示語言" : "Set display language",
      save: isZh ? "儲存設定" : "Save settings",
      saving: isZh ? "儲存中..." : "Saving...",
      saveSuccess: isZh ? "設定已更新。" : "Settings updated."
    },
    topbar: {
      streakLabel: isZh ? "本週節奏" : "This week",
      streakTitle: isZh
        ? (days: number) => (days >= 7 ? `已連續學習 ${days} 天` : `連續學習 ${days} 天，繼續保持`)
        : (days: number) => (days >= 7 ? `${days} days in a row` : `${days} day streak and still moving`),
      streakBody: isZh
        ? (days: number) =>
            days >= 5
              ? "這週已經很穩了，今天再完成一小段，連續感就不會斷。"
              : "先把今天的小任務完成，讓這週的節奏繼續接上。"
        : (days: number) =>
            days >= 5
              ? "This week already has momentum. Finish one small session today and keep it alive."
              : "Finish one small session today and keep this week connected."
    },
    common: {
      language: isZh ? "語言" : "Language",
      zhTw: isZh ? "繁中" : "繁中",
      en: "EN"
    },
    marketing: {
      login: isZh ? "登入" : "Log in",
      signup: isZh ? "註冊" : "Sign up",
      authEntry: isZh ? "開始使用" : "Get started",
      eyebrow: isZh ? "語言記憶引擎" : "Language Retention Engine",
      title: isZh ? "少學一點，記住更多。" : "Learn less. Remember more.",
      description: isZh
        ? "OpenLearning 結合間隔重複、主動回想與短場景課程，形成每日學習循環，清楚告訴學習者先複習什麼、下一步學什麼，以及哪些地方還不穩。"
        : "OpenLearning combines spaced repetition, active recall, and short scene-based lessons into a daily loop that tells the learner exactly what to review, what to learn next, and where they are still weak.",
      loginCta: isZh ? "立即登入" : "Log in now",
      signupCta: isZh ? "免費註冊" : "Create account",
      memberCta: isZh ? "前往我的學習" : "Go to my learning",
      stepsEyebrow: isZh ? "每日學習三步驟" : "Daily learning in three steps",
      stepsTitle: isZh ? "每日學習三步驟" : "Three steps for daily learning",
      steps: [
        {
          step: isZh ? "01" : "01",
          title: isZh ? "先複習快忘記的內容" : "Review what is fading first",
          body: isZh ? "先完成到期複習，讓記憶回到穩定狀態。" : "Clear due reviews first so memory becomes stable again."
        },
        {
          step: isZh ? "02" : "02",
          title: isZh ? "再學今天最重要的一小段" : "Then learn one small piece that matters today",
          body: isZh ? "每天只推進一小段，但那一段就是今天要真正學會的內容。" : "Advance a little each day, but make that little part the one you truly learn today."
        },
        {
          step: isZh ? "03" : "03",
          title: isZh ? "做完立即修正，交給系統安排下一輪" : "Correct it right away and let the system schedule the next round",
          body: isZh ? "系統會依照你的表現安排下一次複習，不用自己記。" : "The system schedules the next review from your performance, so you do not have to."
        }
      ],
      memberPrimaryLabel: isZh ? "開始今日學習" : "Start today's learning",
      memberPrimaryHref: "/study/today",
      memberSecondaryLabel: isZh ? "查看進度" : "View progress",
      memberSecondaryHref: "/progress",
      secondaryGuestLabel: isZh ? "建立帳號開始" : "Create account"
    },
    auth: {
      eyebrow: isZh ? "開始你的學習循環" : "Start your learning loop",
      redirecting: isZh ? "導向 Google..." : "Redirecting to Google...",
      signIn: isZh ? "使用 Google 登入" : "Continue with Google",
      signUp: isZh ? "使用 Google 註冊" : "Sign up with Google",
      loginTitle: isZh ? "回到今天的學習節奏" : "Back to today's learning rhythm",
      loginTitleLines: isZh ? ["回到今天的學習節奏"] : ["Back to today's learning rhythm"],
      loginBody: "",
      signupTitle: isZh ? "開始安排學習" : "Start your learning plan",
      signupTitleLines: isZh ? ["開始安排學習"] : ["Start your learning plan"],
      signupBody: "",
      noAccount: isZh ? "還沒有帳號？" : "Need an account?",
      hasAccount: isZh ? "已經有帳號？" : "Already have an account?",
      goSignup: isZh ? "前往註冊" : "Go to sign up",
      goLogin: isZh ? "前往登入" : "Go to log in",
      modalTitle: isZh ? "開始使用 OpenLearning" : "Start with OpenLearning",
      modalBody: isZh
        ? "用最短的登入流程，接上你的複習、課程與進度。"
        : "Use a short sign-in flow to connect your reviews, lessons, and progress.",
      loginTab: isZh ? "登入" : "Log in",
      signupTab: isZh ? "註冊" : "Sign up",
      loginTabCaption: isZh ? "接續進度" : "Resume progress",
      signupTabCaption: isZh ? "開始建立" : "Get started",
      hasAccountPrompt: isZh ? "已有帳號？直接登入即可接續學習。" : "Already have an account? Log in directly to continue learning.",
      loginBenefits: isZh
        ? [
            {
              title: "接續今日複習",
              body: "直接回到今天該先完成的到期內容，不用重新找進度。"
            },
            {
              title: "銜接目前課程",
              body: "延續上次學到的位置，今天該學哪一段會直接排好。"
            },
            {
              title: "保留學習節奏",
              body: "你的記憶狀態和複習安排會一起延續，不會從頭開始。"
            }
          ]
        : [
            {
              title: "Resume today's reviews",
              body: "Return to the due items that should be finished first without hunting for your place."
            },
            {
              title: "Pick up your lesson",
              body: "Continue from the last segment you studied with today's next step already lined up."
            },
            {
              title: "Keep your rhythm",
              body: "Your review timing and memory state stay in sync instead of restarting from zero."
            }
          ],
      signupBenefits: isZh
        ? [
            {
              title: "建立今日節奏",
              body: "註冊後會先幫你排出今天該複習什麼、接著學什麼。"
            },
            {
              title: "從小步開始",
              body: "先用短內容建立穩定習慣，不需要一次塞進太多任務。"
            },
            {
              title: "讓系統接手安排",
              body: "之後的複習時間與內容順序會依你的表現持續調整。"
            }
          ]
        : [
            {
              title: "Set today's flow",
              body: "Start with a clear order for what to review first and what to learn next."
            },
            {
              title: "Begin with small steps",
              body: "Build a steady habit through short sessions instead of loading too much at once."
            },
            {
              title: "Let the system pace it",
              body: "Future reviews and lesson order keep adjusting around how you actually perform."
            }
          ],
      close: isZh ? "關閉" : "Close",
      unavailable: isZh ? "登入目前暫時無法使用，請稍後再試。" : "Sign-in is temporarily unavailable. Please try again shortly."
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
      lessonPill: isZh ? "今日短課" : "Daily lesson",
      dayLabel: isZh ? (dayNumber: number) => `第 ${dayNumber} 天` : (dayNumber: number) => `Day ${dayNumber}`,
      unitLabel: isZh
        ? (unitNumber: number, unitTitle: string) => `單元 ${unitNumber} · ${unitTitle}`
        : (unitNumber: number, unitTitle: string) => `Unit ${unitNumber} · ${unitTitle}`,
      beforeBegin: isZh ? "開始前提示" : "Before you begin",
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
      currentFocus: isZh ? "目前所在位置" : "Current position",
      currentPill: isZh ? "正在推進" : "In progress",
      dayLabel: isZh ? (dayNumber: number) => `第 ${dayNumber} 天` : (dayNumber: number) => `Day ${dayNumber}`,
      unitLabel: isZh
        ? (unitNumber: number, unitTitle: string) => `單元 ${unitNumber} · ${unitTitle}`
        : (unitNumber: number, unitTitle: string) => `Unit ${unitNumber} · ${unitTitle}`,
      stageLabel: isZh
        ? (stage: "foundation" | "mobility" | "daily" | "work") =>
            ({
              foundation: "基礎起步",
              mobility: "移動情境",
              daily: "日常互動",
              work: "工作溝通"
            })[stage]
        : (stage: "foundation" | "mobility" | "daily" | "work") =>
            ({
              foundation: "Foundation",
              mobility: "Mobility",
              daily: "Daily",
              work: "Work"
            })[stage],
      nextSession: isZh ? "下一次進課前" : "Before the next session",
      planMap: isZh ? "學習地圖" : "Plan map",
      unitProgress: isZh
        ? (done: number, total: number) => `已完成 ${done} / ${total}`
        : (done: number, total: number) => `${done} / ${total} done`,
      statusDone: isZh ? "已完成" : "Done",
      statusCurrent: isZh ? "目前" : "Current",
      statusUpcoming: isZh ? "接下來" : "Upcoming",
      day: isZh ? "第" : "Day",
      daySuffix: isZh ? "天" : "",
      weaknessTrend: isZh ? "弱點趨勢" : "Weakness trend",
      memoryWatch: isZh ? "目前需要多看一眼的內容" : "What still needs attention",
      interval: isZh ? "間隔" : "interval",
      dayUnit: isZh ? "天" : "day(s)",
      lapses: isZh ? "失誤次數" : "lapses"
    },
    todayPage: {
      eyebrow: isZh ? "今天" : "Today",
      title: isZh ? "一輪複習，一堂課，今天完成。" : "One review block. One lesson. Done.",
      step1: isZh ? "步驟 1" : "Step 1",
      reviewPill: isZh ? "先複習" : "Review first",
      clearReviews: isZh ? "清空到期複習" : "Clear due reviews",
      dueMessage: isZh
        ? (count: number) => `今天有 ${count} 張卡片到期。先做這批，才能讓記憶曲線回穩。`
        : (count: number) => `${count} cards are due today. Clear them first to stabilize the memory curve.`,
      startReview: isZh ? "開始複習" : "Start review",
      step2: isZh ? "步驟 2" : "Step 2",
      lessonPill: isZh ? "再上新課" : "Then learn",
      dayLabel: isZh ? (dayNumber: number) => `第 ${dayNumber} 天` : (dayNumber: number) => `Day ${dayNumber}`,
      unitLabel: isZh
        ? (unitNumber: number, unitTitle: string) => `單元 ${unitNumber} · ${unitTitle}`
        : (unitNumber: number, unitTitle: string) => `Unit ${unitNumber} · ${unitTitle}`,
      beforeBegin: isZh ? "進課前提示" : "Before you begin",
      noLesson: isZh ? "今天的課程" : "Today's lesson",
      openLesson: isZh ? "打開課程" : "Open lesson"
    },
    reviewPage: {
      eyebrow: isZh ? "SRS 複習" : "SRS Review",
      title: isZh ? "在快忘記的邊緣完成複習。" : "Review at the edge of forgetting.",
      body: isZh
        ? "這裡的體驗刻意保持簡單。先回想，再翻答案，再用四級評分更新間隔。"
        : "This experience is intentionally simple. Recall first, reveal the answer, then update the interval with a four-point score.",
      back: isZh ? "返回今日學習" : "Back to today",
      queueLabel: isZh ? "今日到期" : "Due today",
      queueCount: isZh ? (count: number) => `目前還有 ${count} 張卡片` : (count: number) => `${count} cards in the queue`,
      flowLabel: isZh ? "複習節奏" : "Review flow",
      flowRecall: isZh ? "先在腦中回想，再決定要不要翻答案。" : "Recall it first before deciding to reveal the answer.",
      flowGrade: isZh ? "看到答案後，用四級評分更新記憶間隔。" : "After revealing the answer, use the four grades to update spacing.",
      flowReturn: isZh ? "清空今天的 due 後，再回到今日課程。" : "Clear today's due items, then return to the lesson.",
      reviewDone: isZh ? "複習完成" : "Review Done",
      reviewDoneTitle: isZh ? "今天到期的卡片已完成" : "All due cards for today are done",
      reviewDoneBody: isZh
        ? "接下來去完成今日新課程，讓系統明天開始替你安排下一輪複習。"
        : "Continue with today's lesson so the system can schedule the next review cycle.",
      donePill: isZh ? "可回到課程" : "Ready for lesson",
      dueCard: isZh ? "到期卡片" : "Due Card",
      currentCard: isZh ? "目前卡片" : "Current card",
      hint: isZh ? "先在腦中回想，再翻答案。提示：" : "Recall it first, then reveal the answer. Hint: ",
      showAnswer: isZh ? "顯示答案" : "Show answer",
      answerLabel: isZh ? "答案" : "Answer",
      gradingLabel: isZh ? "選擇這次回想的狀態" : "Choose how this recall felt",
      submitError: isZh ? "送出失敗，請重試。" : "Submission failed. Please try again.",
      updated: isZh ? "已更新：" : "Updated: ",
      remaining: isZh ? (count: number) => `剩餘 ${count} 張到期卡片` : (count: number) => `${count} due cards remaining`,
      progressLabel: isZh ? (done: number, total: number) => `已完成 ${done} / ${total}` : (done: number, total: number) => `${done} / ${total} completed`
    },
    onboarding: {
      eyebrow: isZh ? "學習目標" : "Learning Goal",
      title: isZh ? "先把學習目標定清楚。" : "Set your learning goal first.",
      body: isZh
        ? "先一步一步設定目標語言、目前程度、學習重點和每日節奏，系統才知道該怎麼安排接下來的學習。"
        : "Set your target language, current level, focus, and daily rhythm step by step so the system can build the right learning flow.",
      profile: isZh ? "學習目標設定" : "Learning goal setup",
      currentDefaults: isZh ? "目前學習目標" : "Current learning goal",
      step: isZh ? "步驟" : "Step",
      targetLanguage: isZh ? "目標語言" : "Target language",
      level: isZh ? "目前程度" : "Current level",
      focus: isZh ? "學習目標" : "Learning focus",
      dailyMinutes: isZh ? "每日學習分鐘數" : "Daily minutes",
      minutesValue: isZh ? (minutes: number) => `${minutes} 分鐘` : (minutes: number) => `${minutes} minutes`,
      nativeLanguage: isZh ? "母語" : "Native language",
      stepIdentityTitle: isZh ? "先設定你的語言背景" : "Set your language setup first",
      stepIdentityBody: isZh
        ? "先告訴系統你的母語和想學的語言，後續的內容與介面才會用對的方式呈現。"
        : "Start with your native language and learning language so the system can present the right content and interface.",
      stepLevelTitle: isZh ? "再確認你目前的程度" : "Set your current level",
      stepLevelBody: isZh ? "不用太精準，選最接近現在狀態的程度即可。" : "It does not need to be exact. Pick the level closest to where you are now.",
      levelOptionA1Title: isZh ? "初學起步" : "Just getting started",
      levelOptionA1Description: isZh ? "我剛開始接觸英文，主要需要最基礎的單字和句型。" : "I'm new to English and need the most basic words and sentence patterns.",
      levelOptionA2Title: isZh ? "基礎建立" : "Building the basics",
      levelOptionA2Description: isZh ? "我知道一些常見單字和句子，但還不夠穩定。" : "I know some common words and simple sentences, but they are not stable yet.",
      levelOptionB1Title: isZh ? "日常應對" : "Handling daily situations",
      levelOptionB1Description: isZh ? "我可以做基本對話，想提升回應速度和表達完整度。" : "I can handle basic conversations and want to respond faster and more fully.",
      levelOptionB2Title: isZh ? "進一步表達" : "Expressing more naturally",
      levelOptionB2Description: isZh ? "我已能日常使用英文，想提升自然度、細節和表達力。" : "I already use English in daily situations and want to sound more natural and expressive.",
      stepFocusTitle: isZh ? "設定你想優先完成的目標" : "Define what you want to improve first",
      stepFocusBody: isZh ? "把現在最重要的學習目的講清楚，計劃才會更有方向。" : "Be specific about the goal that matters now so the plan has direction.",
      stepRhythmTitle: isZh ? "最後設定每天的學習節奏" : "Set your daily learning rhythm",
      stepRhythmBody: isZh ? "先從能穩定做到的節奏開始，比一次設定太重更有效。" : "Start with a rhythm you can sustain. Consistency matters more than intensity.",
      optionTenMinutes: isZh ? "10 分鐘" : "10 minutes",
      optionFifteenMinutes: isZh ? "15 分鐘" : "15 minutes",
      optionTwentyMinutes: isZh ? "20 分鐘" : "20 minutes",
      optionThirtyMinutes: isZh ? "30 分鐘" : "30 minutes",
      back: isZh ? "上一步" : "Back",
      next: isZh ? "下一步" : "Next",
      finish: isZh ? "完成設定" : "Finish setup",
      resetGoal: isZh ? "重新設定學習目標" : "Reset learning goal",
      saveError: isZh ? "設定失敗，請稍後再試。" : "Setup failed. Please try again later.",
      creating: isZh ? "建立中..." : "Creating...",
      createPlan: isZh ? "建立學習計畫" : "Create learning plan",
      completeEyebrow: isZh ? "設定完成" : "Setup complete",
      completeTitle: isZh ? "你的學習目標已經設定好了。" : "Your learning goal is set.",
      completeBody: isZh
        ? "接下來系統會依照這份目標安排每日複習與新內容。之後如果想調整方向，再重新設定即可。"
        : "The system will now use this goal to shape your daily reviews and new content. You can update it later anytime."
    },
    lesson: {
      lessonPrefix: isZh ? "課程" : "Lesson",
      unitLabel: isZh
        ? (unitNumber: number, unitTitle: string) => `單元 ${unitNumber} · ${unitTitle}`
        : (unitNumber: number, unitTitle: string) => `Unit ${unitNumber} · ${unitTitle}`,
      dayLabel: isZh ? (dayNumber: number) => `第 ${dayNumber} 天` : (dayNumber: number) => `Day ${dayNumber}`,
      lessonFocus: isZh ? "今日短課" : "Daily lesson",
      todayObjective: isZh ? "今天要學會的重點" : "What to land today",
      lessonIntro: isZh ? "進課前提示" : "Before you begin",
      studyFlow: isZh ? "本課節奏" : "Lesson flow",
      flowAbsorb: isZh ? "先吸收今天這堂課的核心語塊和句型。" : "Absorb the core chunks and phrases for this lesson first.",
      flowRecall: isZh ? "接著用對話和練習主動回想，不只是閱讀。" : "Then use dialogue and practice to actively recall, not just read.",
      flowComplete: isZh ? "完成後把重點交給系統，安排進後續複習。" : "Finish the lesson and let the system schedule its key items into review.",
      vocabulary: isZh ? "單字" : "Vocabulary",
      chunks: isZh ? "語塊" : "Chunks",
      dialogue: isZh ? "對話" : "Dialogue",
      coachNote: isZh ? "教練提示" : "Coach note",
      practice: isZh ? "練習" : "Practice",
      practiceQuestionLabel: isZh ? (id: string) => `題目 ${id.replace(/^q/i, "")}` : (id: string) => `Prompt ${id.replace(/^q/i, "")}`,
      promptHint: isZh ? "提示：" : "Hint: ",
      checkAnswer: isZh ? "檢查答案" : "Check answer",
      nextStep: isZh ? "下一步" : "Next step",
      completeBody: isZh
        ? "這堂課完成後，系統會把重點內容轉成後續複習卡片，並排入下一輪節奏。"
        : "Finish this lesson and the system will turn its key content into review cards for the next cycle.",
      reviewOnlyBody: isZh
        ? "這堂課不是今天的主線課程。回到今日學習，繼續目前的進度。"
        : "This lesson is not today's active lesson. Return to Today to continue the current sequence.",
      completeLesson: isZh ? "完成這堂課" : "Complete lesson",
      completingLesson: isZh ? "完成中..." : "Completing...",
      completeError: isZh ? "課程更新失敗，請稍後再試。" : "Failed to update lesson progress. Please try again.",
      backToToday: isZh ? "返回今日學習" : "Back to today"
    }
  };
}
