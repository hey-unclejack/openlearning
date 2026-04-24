import { decryptCredential } from "@/lib/ai/credentials";
import { getAiUsageSummary, readState, saveGeneratedLearningPlan } from "@/lib/store";
import {
  AIProviderMode,
  AIUsageLog,
  GeneratedLearningPlan,
  GeneratedPlanDay,
  LearningFocus,
  LearningSource,
  LearningSourceType,
  LearningType,
  ProficiencyLevel,
  SubjectArea,
} from "@/lib/types";

type GenerateLearningPlanInput = {
  sessionId: string;
  sourceType: LearningSourceType;
  subject?: SubjectArea;
  title: string;
  rawText: string;
  sourceUrl?: string;
  userOwnsRights: boolean;
  childMode?: boolean;
  providerMode?: AIProviderMode;
  dayCount?: number;
  planStatus?: GeneratedLearningPlan["status"];
};

type ProviderResult = {
  days: GeneratedPlanDay[];
  promptTokens: number;
  completionTokens: number;
  model: string;
  warnings: string[];
  usedProviderMode: AIProviderMode;
};

const LEARNING_TYPES: LearningType[] = ["sentence-translation", "vocabulary", "listening", "speaking", "writing", "grammar"];
const MAX_SOURCE_CHARS = Number(process.env.AI_MAX_SOURCE_CHARS ?? 12000);
const BLOCKED_SOURCE_PATTERNS = [
  /how\s+to\s+make\s+(a\s+)?bomb/i,
  /suicide\s+instructions/i,
  /child\s+sexual/i,
  /credit\s+card\s+dump/i,
  /steal\s+passwords?/i,
];

type QualityResult = {
  valid: boolean;
  warnings: string[];
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function stripHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function extractHtmlTitle(value: string) {
  const match = value.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizeText(decodeHtmlEntities(match[1])) : undefined;
}

async function fetchUrlText(sourceUrl?: string) {
  if (!sourceUrl) {
    return { error: "請提供網址，或直接貼上正文內容。" };
  }

  let url: URL;

  try {
    url = new URL(sourceUrl);
  } catch {
    return { error: "來源網址格式不正確。" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { error: "目前只支援 http 或 https 網址。" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "OpenLearningBot/0.1 (+https://openlearning.local)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { error: "無法讀取這個網址，請改貼正文內容。" };
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return { error: "這個網址不是可讀取的 HTML 或文字內容，請改貼正文內容。" };
    }

    const body = await response.text();
    const title = contentType.includes("text/html") ? extractHtmlTitle(body) : undefined;
    const text = contentType.includes("text/html") ? stripHtml(body) : body;

    return {
      rawText: normalizeText(text),
      fetchedTitle: title,
    };
  } catch {
    return { error: "讀取網址逾時或失敗，請改貼正文內容。" };
  } finally {
    clearTimeout(timeout);
  }
}

function splitSentences(value: string) {
  const sentences = normalizeText(value)
    .split(/(?<=[.!?。！？])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length > 0) {
    return sentences;
  }

  return normalizeText(value).split(/[，,；;]/).map((item) => item.trim()).filter(Boolean);
}

function levelInstruction(level: ProficiencyLevel) {
  return {
    A1: "Use short, concrete sentences, high-frequency words, and Traditional Chinese prompts.",
    A2: "Use practical everyday sentences with simple connectors and clear Traditional Chinese prompts.",
    B1: "Use scenario-based sentences with natural chunks and short explanations.",
    B2: "Use more natural phrasing, nuance, and workplace-ready expressions.",
  }[level];
}

function focusLabel(focus: LearningFocus) {
  return {
    travel: "travel and situational conversation",
    daily: "everyday speaking and listening",
    work: "workplace communication",
    exam: "structured exam and foundation practice",
  }[focus];
}

function subjectLabel(subject: SubjectArea) {
  return {
    language: "English language learning",
    math: "math learning",
    chinese: "Mandarin literacy learning",
  }[subject];
}

function subjectPromptGuidance(subject: SubjectArea) {
  return {
    language: "For language lessons, practice prompts should be in Traditional Chinese and target answers should be natural English.",
    math: "For math lessons, use Traditional Chinese explanations, include step-by-step reasoning, short checks, and review seeds for formulas or concepts. Answers may be numbers, formulas, or concise Chinese explanations.",
    chinese: "For Mandarin literacy lessons, use Traditional Chinese, focus on comprehension, vocabulary, main idea, sentence rewriting, and reading strategy.",
  }[subject];
}

function estimateCostUsd(promptTokens: number, completionTokens: number) {
  return Number(((promptTokens * 0.00000015) + (completionTokens * 0.0000006)).toFixed(6));
}

function buildPrompt(params: {
  source: LearningSource;
  level: ProficiencyLevel;
  focus: LearningFocus;
  dailyMinutes: number;
  dayCount: number;
}) {
  return [
    "You are building a structured learning plan for OpenLearning.",
    `Subject: ${subjectLabel(params.source.subject)}.`,
    `Learner level: ${params.level}. ${levelInstruction(params.level)}`,
    `Focus: ${focusLabel(params.focus)}. Daily time: ${params.dailyMinutes} minutes.`,
    `Create exactly ${params.dayCount} short lessons.`,
    "Each lesson must include: title, objective, vocabulary, chunks, dialogue, coachingNote, practice, reviewSeeds.",
    subjectPromptGuidance(params.source.subject),
    "Return JSON only with a top-level days array.",
    `Source title: ${params.source.title}`,
    `Source text: ${params.source.rawText.slice(0, 4000)}`,
  ].join("\n");
}

function coerceStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 6);
}

function parseProviderJson(value: string, source: LearningSource, dayCount: number): GeneratedPlanDay[] | null {
  const jsonStart = value.indexOf("{");
  const jsonEnd = value.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    return null;
  }

  try {
    const parsed = JSON.parse(value.slice(jsonStart, jsonEnd + 1)) as { days?: Array<Record<string, unknown>> };
    const days = Array.isArray(parsed.days) ? parsed.days.slice(0, dayCount) : [];

    if (days.length === 0) {
      return null;
    }

    return days.map((day, index) => {
      const lessonId = makeId(`generated-lesson-${index + 1}`);
      const vocabulary = coerceStringArray(day.vocabulary, ["context", "practice", "review"]);
      const chunks = coerceStringArray(day.chunks, ["I can use this in context.", "Let me try that again."]);
      const dialogue = coerceStringArray(day.dialogue, [
        "Coach: Let's practice one useful sentence.",
        "Learner: I can say it clearly.",
      ]);
      const reviewSeeds = Array.isArray(day.reviewSeeds)
        ? day.reviewSeeds.slice(0, 4).map((seed, seedIndex) => {
            const record = seed as Record<string, unknown>;
            return {
              id: `${lessonId}-review-${seedIndex + 1}`,
              front: String(record.front ?? `複習重點 ${seedIndex + 1}`),
              back: String(record.back ?? chunks[seedIndex % chunks.length] ?? chunks[0]),
              hint: String(record.hint ?? "抓核心語塊"),
              tags: [source.subject, source.type],
            };
          })
        : [];

      return {
        id: `${source.id}-day-${index + 1}`,
        lessonId,
        dayNumber: index + 1,
        title: String(day.title ?? `AI Lesson ${index + 1}`),
        objective: String(day.objective ?? "Practice the most useful ideas from your source content."),
        vocabulary,
        chunks,
        dialogue,
        asset: {
          id: lessonId,
          unitId: `generated-${source.id}`,
          intro: String(day.intro ?? "先把內容拆成今天可以真正記住的一小段。"),
          coachingNote: String(day.coachingNote ?? "先回想，再看答案，最後把句子放進自己的情境。"),
          personalizationNote: "AI 依照你的程度、每日時間與導入內容生成這一課。",
          practice: Array.isArray(day.practice)
            ? day.practice.slice(0, 5).map((question, questionIndex) => {
                const record = question as Record<string, unknown>;
                return {
                  id: `${lessonId}-practice-${questionIndex + 1}`,
                  learningType: LEARNING_TYPES[questionIndex % LEARNING_TYPES.length],
                  prompt: String(record.prompt ?? `翻成英文：${reviewSeeds[questionIndex]?.front ?? "我想練習這個內容。"}`),
                  answer: String(record.answer ?? reviewSeeds[questionIndex]?.back ?? chunks[0]),
                  hint: String(record.hint ?? "先找主詞和核心動詞。"),
                };
              })
            : [],
          reviewSeeds,
        },
      };
    });
  } catch {
    return null;
  }
}

export function validateGeneratedDays(days: GeneratedPlanDay[], source: LearningSource, expectedDayCount: number): QualityResult {
  const warnings: string[] = [];
  const ids = new Set<string>();

  if (days.length !== expectedDayCount) {
    warnings.push(`Expected ${expectedDayCount} generated days but received ${days.length}.`);
  }

  days.forEach((day, index) => {
    if (!day.title.trim() || !day.objective.trim()) {
      warnings.push(`Day ${index + 1} is missing a title or objective.`);
    }

    if (day.dayNumber !== index + 1) {
      warnings.push(`Day ${index + 1} has an unexpected day number.`);
    }

    [day.id, day.lessonId].forEach((id) => {
      if (ids.has(id)) {
        warnings.push(`Duplicate generated id found: ${id}.`);
      }
      ids.add(id);
    });

    if (day.asset.id !== day.lessonId) {
      warnings.push(`Day ${index + 1} asset id should match lesson id.`);
    }

    if (day.asset.practice.length < 2) {
      warnings.push(`Day ${index + 1} needs at least two practice questions.`);
    }

    if (day.asset.reviewSeeds.length < 3) {
      warnings.push(`Day ${index + 1} needs at least three review seeds.`);
    }

    day.asset.practice.forEach((question, questionIndex) => {
      if (!question.prompt.trim() || !question.answer.trim() || !question.hint.trim()) {
        warnings.push(`Day ${index + 1} practice ${questionIndex + 1} is incomplete.`);
      }
    });

    day.asset.reviewSeeds.forEach((seed, seedIndex) => {
      if (!seed.front.trim() || !seed.back.trim() || !seed.hint.trim()) {
        warnings.push(`Day ${index + 1} review seed ${seedIndex + 1} is incomplete.`);
      }
    });
  });

  if (source.subject === "math") {
    const text = days.flatMap((day) => [
      day.title,
      day.objective,
      day.asset.intro,
      ...day.asset.practice.map((question) => `${question.prompt} ${question.answer}`),
      ...day.asset.reviewSeeds.map((seed) => `${seed.front} ${seed.back}`),
    ]).join(" ");

    if (/翻成英文|English sentence|speak English/i.test(text)) {
      warnings.push("Math generated content appears to contain language-translation instructions.");
    }
  }

  if (source.subject === "chinese") {
    const text = days.flatMap((day) => [
      day.title,
      day.objective,
      day.asset.intro,
      ...day.asset.practice.map((question) => `${question.prompt} ${question.answer}`),
    ]).join(" ");

    if (/翻成英文|English sentence|speak English/i.test(text)) {
      warnings.push("Mandarin generated content appears to contain language-translation instructions.");
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

function extractKeywords(value: string, fallbackTopic: string) {
  const keywords = normalizeText(value)
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 5);

  return (keywords.length ? keywords : [fallbackTopic, "practice", "review"]).slice(0, 5);
}

function buildSubjectLessonParts(params: {
  subject: SubjectArea;
  lessonId: string;
  fallbackTopic: string;
  sourceLine: string;
  focus: LearningFocus;
  dailyMinutes: number;
}) {
  const { subject, lessonId, fallbackTopic, sourceLine } = params;

  if (subject === "math") {
    const vocabulary = ["已知條件", "列式", "計算", "檢查", fallbackTopic].slice(0, 5);
    const chunks = [
      "先圈出題目給的數字與條件。",
      "再把條件寫成一個算式。",
      "最後檢查答案是否符合題意。",
    ];
    const dialogue = [
      "Coach: 這題先看已知條件是什麼？",
      `Learner: 題目重點是 ${sourceLine.slice(0, 72)}。`,
      "Coach: 好，先列式，再計算，不要直接猜答案。",
    ];
    const reviewSeeds = [
      {
        id: `${lessonId}-review-1`,
        front: "解題第一步要做什麼？",
        back: "先找已知條件和題目要求。",
        hint: "先讀題，不先算",
        tags: [subject, "math", "ai-generated"],
      },
      {
        id: `${lessonId}-review-2`,
        front: "列式後為什麼要檢查？",
        back: "確認答案符合題意和單位。",
        hint: "檢查題意",
        tags: [subject, "math", "ai-generated"],
      },
      {
        id: `${lessonId}-review-3`,
        front: "遇到應用題卡住時怎麼辦？",
        back: "把題目拆成已知、要求、算式三部分。",
        hint: "三部分",
        tags: [subject, "math", "ai-generated"],
      },
    ];

    return {
      vocabulary,
      chunks,
      dialogue,
      intro: "這一課把數學內容拆成短解題流程，先建立讀題、列式、檢查的穩定節奏。",
      coachingNote: `以 ${params.dailyMinutes} 分鐘練習：先說出解題步驟，再完成一題短練習。`,
      practice: [
        {
          id: `${lessonId}-practice-1`,
          learningType: "grammar" as const,
          prompt: `把題目拆成已知條件與要求：${sourceLine.slice(0, 90)}`,
          answer: "先找已知條件，再找題目要求。",
          hint: "先拆題，再列式。",
        },
        {
          id: `${lessonId}-practice-2`,
          learningType: "writing" as const,
          prompt: "用一句話寫出你的解題策略。",
          answer: "我會先列出已知條件，再寫算式並檢查答案。",
          hint: "已知條件 -> 算式 -> 檢查",
        },
      ],
      reviewSeeds,
    };
  }

  if (subject === "chinese") {
    const vocabulary = ["主旨", "關鍵詞", "段落", "句意", fallbackTopic].slice(0, 5);
    const chunks = [
      "先找出這段文字最重要的人、事、物。",
      "再圈出重複出現或最能代表意思的關鍵詞。",
      "最後用一句話說出主旨。",
    ];
    const dialogue = [
      "Coach: 這段文字主要在說什麼？",
      `Learner: 我看到的重點是 ${sourceLine.slice(0, 72)}。`,
      "Coach: 好，接著用一句完整的話整理主旨。",
    ];
    const reviewSeeds = [
      {
        id: `${lessonId}-review-1`,
        front: "找主旨時第一步是什麼？",
        back: "先找最重要的人、事、物。",
        hint: "人事物",
        tags: [subject, "reading", "ai-generated"],
      },
      {
        id: `${lessonId}-review-2`,
        front: "關鍵詞有什麼作用？",
        back: "幫助判斷段落最重要的意思。",
        hint: "段落重點",
        tags: [subject, "reading", "ai-generated"],
      },
      {
        id: `${lessonId}-review-3`,
        front: "整理主旨要注意什麼？",
        back: "用一句完整的話，不只抄原文。",
        hint: "完整句",
        tags: [subject, "summary", "ai-generated"],
      },
    ];

    return {
      vocabulary,
      chunks,
      dialogue,
      intro: "這一課把國文閱讀拆成找關鍵詞、抓段落意思、整理主旨三步。",
      coachingNote: `以 ${params.dailyMinutes} 分鐘練習：先圈關鍵詞，再用自己的話說出主旨。`,
      practice: [
        {
          id: `${lessonId}-practice-1`,
          learningType: "vocabulary" as const,
          prompt: `找出這段文字的關鍵詞：${sourceLine.slice(0, 90)}`,
          answer: extractKeywords(sourceLine, fallbackTopic)[0] ?? fallbackTopic,
          hint: "找重複或最能代表意思的詞。",
        },
        {
          id: `${lessonId}-practice-2`,
          learningType: "writing" as const,
          prompt: "用一句完整的話寫出這段文字的主旨。",
          answer: sourceLine.slice(0, 72),
          hint: "不要只抄一個詞，要寫成一句話。",
        },
      ],
      reviewSeeds,
    };
  }

  const vocabulary = extractKeywords(sourceLine, fallbackTopic);
  const chunks = [
    `I want to talk about ${fallbackTopic}.`,
    `The key point is ${sourceLine.slice(0, 72)}.`,
    params.focus === "work" ? "Let me explain the main idea clearly." : "Can you help me practice this?",
  ];
  const dialogue = [
    "Coach: What do you want to practice today?",
    `Learner: I want to practice ${fallbackTopic}.`,
    `Coach: Good. Start with this point: ${sourceLine.slice(0, 96)}`,
  ];
  const reviewSeeds = [
    {
      id: `${lessonId}-review-1`,
      front: `我想談談 ${fallbackTopic}。`,
      back: `I want to talk about ${fallbackTopic}.`,
      hint: "I want to talk about...",
      tags: [subject, "language", "ai-generated"],
    },
    {
      id: `${lessonId}-review-2`,
      front: "重點是什麼？",
      back: `The key point is ${sourceLine.slice(0, 72)}.`,
      hint: "The key point is...",
      tags: [subject, "language", "ai-generated"],
    },
    {
      id: `${lessonId}-review-3`,
      front: "你可以幫我練習這個嗎？",
      back: "Can you help me practice this?",
      hint: "Can you help me...",
      tags: [subject, "language", "ai-generated"],
    },
  ];

  return {
    vocabulary,
    chunks,
    dialogue,
    intro: "這一課由你導入的內容拆成短任務，先學會最容易用上的句子。",
    coachingNote: `以 ${params.dailyMinutes} 分鐘節奏練習：先回想，再輸出，最後交給系統安排複習。`,
    practice: [
      {
        id: `${lessonId}-practice-1`,
        learningType: "sentence-translation" as const,
        prompt: `翻成英文：我想談談 ${fallbackTopic}。`,
        answer: `I want to talk about ${fallbackTopic}.`,
        hint: "I want to talk about...",
      },
      {
        id: `${lessonId}-practice-2`,
        learningType: "writing" as const,
        prompt: `用英文寫一句話說明這個重點：${sourceLine.slice(0, 80)}`,
        answer: `The key point is ${sourceLine.slice(0, 72)}.`,
        hint: "The key point is...",
      },
    ],
    reviewSeeds,
  };
}

function buildRuleBasedDays(source: LearningSource, params: {
  level: ProficiencyLevel;
  focus: LearningFocus;
  dailyMinutes: number;
  dayCount: number;
}) {
  const sentences = splitSentences(source.rawText);
  const fallbackTopic = source.title || "your topic";
  const baseSentences = sentences.length > 0 ? sentences : [fallbackTopic, "I want to practice this step by step."];

  return Array.from({ length: params.dayCount }, (_, index): GeneratedPlanDay => {
    const lessonId = makeId(`generated-lesson-${index + 1}`);
    const sourceLine = baseSentences[index % baseSentences.length] ?? fallbackTopic;
    const lessonParts = buildSubjectLessonParts({
      subject: source.subject,
      lessonId,
      fallbackTopic,
      sourceLine,
      focus: params.focus,
      dailyMinutes: params.dailyMinutes,
    });

    return {
      id: `${source.id}-day-${index + 1}`,
      lessonId,
      dayNumber: index + 1,
      title: `${fallbackTopic} - Day ${index + 1}`,
      objective: `${params.level} ${subjectLabel(source.subject)} practice plan using your source content.`,
      vocabulary: lessonParts.vocabulary,
      chunks: lessonParts.chunks,
      dialogue: lessonParts.dialogue,
      asset: {
        id: lessonId,
        unitId: `generated-${source.id}`,
        intro: lessonParts.intro,
        coachingNote: lessonParts.coachingNote,
        personalizationNote: "AI 依照你的程度、目標與內容產生這一課。",
        practice: lessonParts.practice,
        reviewSeeds: lessonParts.reviewSeeds,
      },
    };
  });
}

async function callOpenAIProvider(params: {
  apiKey: string;
  model: string;
  source: LearningSource;
  level: ProficiencyLevel;
  focus: LearningFocus;
  dailyMinutes: number;
  dayCount: number;
  providerMode: AIProviderMode;
}): Promise<ProviderResult | null> {
  const prompt = buildPrompt(params);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      input: prompt,
      max_output_tokens: 2400,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json() as {
    output_text?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const text = payload.output_text ??
    payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text).filter(Boolean).join("\n") ??
    "";
  const days = parseProviderJson(text, params.source, params.dayCount);

  if (!days) {
    return null;
  }

  return {
    days,
    promptTokens: payload.usage?.input_tokens ?? Math.ceil(prompt.length / 4),
    completionTokens: payload.usage?.output_tokens ?? Math.ceil(text.length / 4),
    model: params.model,
    warnings: [],
    usedProviderMode: params.providerMode,
  };
}

async function callOpenRouterProvider(params: {
  apiKey: string;
  model: string;
  source: LearningSource;
  level: ProficiencyLevel;
  focus: LearningFocus;
  dailyMinutes: number;
  dayCount: number;
  providerMode: AIProviderMode;
}): Promise<ProviderResult | null> {
  const prompt = buildPrompt(params);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
      "X-Title": "OpenLearning",
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2400,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text = payload.choices?.map((choice) => choice.message?.content).filter(Boolean).join("\n") ?? "";
  const days = parseProviderJson(text, params.source, params.dayCount);

  if (!days) {
    return null;
  }

  return {
    days,
    promptTokens: payload.usage?.prompt_tokens ?? Math.ceil(prompt.length / 4),
    completionTokens: payload.usage?.completion_tokens ?? Math.ceil(text.length / 4),
    model: params.model,
    warnings: [],
    usedProviderMode: params.providerMode,
  };
}

async function resolveGoogleAccessToken(credential: string) {
  if (!process.env.GOOGLE_AI_OAUTH_CLIENT_ID || !process.env.GOOGLE_AI_OAUTH_CLIENT_SECRET) {
    return credential;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_AI_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_AI_OAUTH_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: credential,
    }),
  });

  if (!response.ok) {
    return credential;
  }

  const payload = await response.json() as { access_token?: string };
  return payload.access_token ?? credential;
}

async function callGeminiProvider(params: {
  credential: string;
  model: string;
  source: LearningSource;
  level: ProficiencyLevel;
  focus: LearningFocus;
  dailyMinutes: number;
  dayCount: number;
  providerMode: AIProviderMode;
}): Promise<ProviderResult | null> {
  const prompt = buildPrompt(params);
  const accessToken = await resolveGoogleAccessToken(params.credential);
  const modelName = params.model.startsWith("models/") ? params.model : `models/${params.model}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 2400,
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  const text = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n") ?? "";
  const days = parseProviderJson(text, params.source, params.dayCount);

  if (!days) {
    return null;
  }

  return {
    days,
    promptTokens: payload.usageMetadata?.promptTokenCount ?? Math.ceil(prompt.length / 4),
    completionTokens: payload.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4),
    model: params.model,
    warnings: [],
    usedProviderMode: params.providerMode,
  };
}

async function generateWithProvider(params: {
  sessionId: string;
  source: LearningSource;
  level: ProficiencyLevel;
  focus: LearningFocus;
  dailyMinutes: number;
  dayCount: number;
  providerMode: AIProviderMode;
}): Promise<ProviderResult> {
  const officialKey = process.env.OPENAI_API_KEY;
  const state = await readState(params.sessionId);
  const connection = params.providerMode === "byok" || params.providerMode === "oauth"
    ? state.aiProviderConnections.find((item) => item.mode === params.providerMode && item.status === "configured")
    : undefined;
  const customCredential = params.providerMode === "byok" || params.providerMode === "oauth" ? decryptCredential(connection?.encryptedCredential) : null;
  const apiKey = params.providerMode === "byok" || params.providerMode === "oauth" ? customCredential : officialKey;
  const provider = params.providerMode === "byok" || params.providerMode === "oauth" ? connection?.provider ?? "openai" : "openai";
  const model = params.providerMode === "byok" || params.providerMode === "oauth"
    ? connection?.model ?? (provider === "openrouter" ? "openai/gpt-4o-mini" : provider === "google" ? "gemini-2.5-flash" : "gpt-4.1-mini")
    : process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (apiKey) {
    const providerResult = provider === "google"
      ? await callGeminiProvider({
          credential: apiKey,
          model,
          source: params.source,
          level: params.level,
          focus: params.focus,
          dailyMinutes: params.dailyMinutes,
          dayCount: params.dayCount,
          providerMode: params.providerMode,
        })
      : provider === "openrouter"
        ? await callOpenRouterProvider({
          apiKey,
          model,
          source: params.source,
          level: params.level,
          focus: params.focus,
          dailyMinutes: params.dailyMinutes,
          dayCount: params.dayCount,
          providerMode: params.providerMode,
        })
        : await callOpenAIProvider({
          apiKey,
          model,
          source: params.source,
          level: params.level,
          focus: params.focus,
          dailyMinutes: params.dailyMinutes,
          dayCount: params.dayCount,
          providerMode: params.providerMode,
        });

    if (providerResult) {
      const quality = validateGeneratedDays(providerResult.days, params.source, params.dayCount);

      if (quality.valid) {
        return providerResult;
      }

      const fallbackDays = buildRuleBasedDays(params.source, params);
      return {
        days: fallbackDays,
        promptTokens: providerResult.promptTokens,
        completionTokens: providerResult.completionTokens + fallbackDays.length * 450,
        model: "fallback-after-quality-gate",
        warnings: [
          "AI provider content failed quality checks, so OpenLearning used the deterministic fallback generator.",
          ...quality.warnings,
        ],
        usedProviderMode: params.providerMode,
      };
    }
  }

  const days = buildRuleBasedDays(params.source, params);
  const sourceTokens = Math.ceil(params.source.rawText.length / 4);
  const quality = validateGeneratedDays(days, params.source, params.dayCount);

  return {
    days,
    promptTokens: sourceTokens + 650,
    completionTokens: days.length * 450,
    model: apiKey ? "fallback-after-provider-error" : "rule-based-fallback",
    warnings: [
      apiKey
        ? "AI provider failed or returned invalid content, so OpenLearning used the deterministic fallback generator."
        : "No AI provider key is configured, so OpenLearning used the deterministic fallback generator.",
      ...quality.warnings,
    ],
    usedProviderMode: apiKey ? params.providerMode : "official",
  };
}

function inspectSourceQuality(rawText: string) {
  const warnings: string[] = [];
  const normalized = normalizeText(rawText);
  const words = normalized.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map((word) => word.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "")));

  if (BLOCKED_SOURCE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { error: "這份內容可能不適合產生學習材料，請改用一般學習、教材或情境內容。" };
  }

  if (normalized.length > MAX_SOURCE_CHARS) {
    warnings.push(`Source was trimmed to ${MAX_SOURCE_CHARS} characters to control AI cost.`);
  }

  if (words.length >= 40 && uniqueWords.size / words.length < 0.18) {
    warnings.push("Source content looks repetitive; generated lessons may be less specific.");
  }

  return {
    rawText: normalized.slice(0, MAX_SOURCE_CHARS),
    warnings,
  };
}

async function validateInput(input: GenerateLearningPlanInput) {
  let rawText = normalizeText(input.rawText);
  const warnings: string[] = [];
  const metadata: Record<string, string | number | boolean> = {
    intakeVersion: "2026-04-mvp",
  };
  let fetchedTitle: string | undefined;

  if (!input.userOwnsRights) {
    return { error: "請先確認你有權使用或上傳這份學習內容。" };
  }

  if (input.sourceType === "url" && rawText.length < 20) {
    const fetched = await fetchUrlText(input.sourceUrl);

    if ("error" in fetched) {
      return { error: fetched.error };
    }

    rawText = fetched.rawText;
    fetchedTitle = fetched.fetchedTitle;
    metadata.urlFetched = true;
  }

  if (input.sourceType === "topic" && rawText.length < 3) {
    return { error: "請輸入想學的主題。" };
  }

  if (input.sourceType !== "topic" && rawText.length < 20) {
    return { error: "請提供至少 20 個字的內容，或改用主題輸入。" };
  }

  if ((input.sourceType === "pdf" || input.sourceType === "image") && rawText.length < 20) {
    return { error: "PDF/圖片 OCR 目前需要先貼上抽取後的文字內容。" };
  }

  if ((input.sourceType === "url" || input.sourceType === "youtube") && rawText.length < 20) {
    return { error: "網址/YouTube 目前需要提供正文或逐字稿，避免版權與轉錄成本問題。" };
  }

  const quality = inspectSourceQuality(rawText);

  if ("error" in quality) {
    return { error: quality.error };
  }

  warnings.push(...quality.warnings);
  metadata.originalLength = rawText.length;
  metadata.storedLength = quality.rawText.length;

  return { rawText: quality.rawText, warnings, metadata, fetchedTitle };
}

export async function generateLearningPlan(input: GenerateLearningPlanInput) {
  const validation = await validateInput(input);

  if ("error" in validation) {
    return { ok: false as const, error: validation.error };
  }

  const state = await readState(input.sessionId);
  const profile = state.profile;
  const dayCount = Math.min(Math.max(input.dayCount ?? 3, 3), 7);
  const providerMode = input.providerMode ?? "official";
  const usageSummary = await getAiUsageSummary(input.sessionId);

  if (providerMode === "official" && usageSummary.officialRemaining <= 0) {
    return {
      ok: false as const,
      error: "今天的官方 AI 免費額度已用完。你可以明天再試，或到設定頁連接自己的 API key 使用 BYOK。",
    };
  }

  if (providerMode === "byok" || providerMode === "oauth") {
    const connection = state.aiProviderConnections.find((item) => item.mode === providerMode && item.status === "configured");
    const apiKey = decryptCredential(connection?.encryptedCredential);

    if (!apiKey) {
      return {
        ok: false as const,
        error: providerMode === "oauth"
          ? "請先到設定頁完成 OAuth 授權，再使用 OAuth 服務生成。"
          : "請先到設定頁連接自己的 AI 服務 API key，再使用 BYOK 生成。",
      };
    }
  }

  const source: LearningSource = {
    id: makeId("source"),
    type: input.sourceType,
    subject: input.subject ?? "language",
    title: input.title.trim() || validation.fetchedTitle || "My learning topic",
    rawText: validation.rawText,
    sourceUrl: input.sourceUrl?.trim() || undefined,
    userOwnsRights: input.userOwnsRights,
    childMode: input.childMode ?? false,
    metadata: validation.metadata,
    createdAt: new Date().toISOString(),
  };
  const provider = await generateWithProvider({
    sessionId: input.sessionId,
    source,
    level: profile?.level ?? "A2",
    focus: profile?.focus ?? "daily",
    dailyMinutes: profile?.dailyMinutes ?? 15,
    dayCount,
    providerMode,
  });
  const plan: GeneratedLearningPlan = {
    id: makeId("plan"),
    sourceId: source.id,
    subject: source.subject,
    providerMode: provider.usedProviderMode,
    model: provider.model,
    level: profile?.level ?? "A2",
    focus: profile?.focus ?? "daily",
    dailyMinutes: profile?.dailyMinutes ?? 15,
    status: input.planStatus ?? "active",
    days: provider.days,
    qualityWarnings: [
      ...validation.warnings,
      ...provider.warnings,
      ...(source.childMode ? ["Child mode: use non-personalized ads only and keep parent-controlled billing/API settings."] : []),
    ],
    costEstimateUsd: estimateCostUsd(provider.promptTokens, provider.completionTokens),
    createdAt: new Date().toISOString(),
  };
  const usageLog: AIUsageLog = {
    id: makeId("usage"),
    provider: provider.model.startsWith("rule-based")
      ? "openlearning"
      : provider.model.startsWith("gemini")
        ? "google"
        : provider.model.includes("/")
          ? "openrouter"
          : "openai",
    providerMode: provider.usedProviderMode,
    model: provider.model,
    sourceId: source.id,
    generatedPlanId: plan.id,
    promptTokens: provider.promptTokens,
    completionTokens: provider.completionTokens,
    costEstimateUsd: plan.costEstimateUsd,
    officialQuota: provider.usedProviderMode === "official",
    createdAt: new Date().toISOString(),
  };

  await saveGeneratedLearningPlan(input.sessionId, { source, plan, usageLog });

  return { ok: true as const, source, plan, usageLog };
}
