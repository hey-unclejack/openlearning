"use client";

import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, startTransition, useMemo, useState } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { ToastNotice } from "@/components/ui/toast-notice";
import {
  LearningDomain,
  LearningFocus,
  LearningPurpose,
  NativeLanguage,
  ProficiencyLevel,
  TargetLanguage
} from "@/lib/types";

type OnboardingPrimaryDomain = "language" | "school-subject" | "exam-cert" | "self-study";
type SchoolSubjectChoice = "math" | "mandarin-literacy" | "science" | "social-studies" | "custom";

type ChoiceOption<T extends string> = {
  value: T;
  label?: string;
  title?: string;
  description?: string;
};

type OnboardingStep = {
  id: string;
  label: string;
  title: string;
  body: string;
  field: ReactNode;
};

function ChoiceCards<T extends string>({
  name,
  options,
  value,
  onChange
}: {
  name: string;
  options: Array<ChoiceOption<T>>;
  value?: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="choice-grid" role="radiogroup" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`choice-card${value === option.value ? " active" : ""}`}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.title ? (
            <span className="choice-card-copy">
              <span className="choice-card-title">{option.title}</span>
              {option.description ? <span className="choice-card-description">{option.description}</span> : null}
            </span>
          ) : (
            option.label
          )}
        </button>
      ))}
      <input name={name} type="hidden" value={value ?? ""} />
    </div>
  );
}

function primaryDomainFromDefault(domain?: LearningDomain): OnboardingPrimaryDomain {
  if (domain === "exam-cert" || domain === "self-study" || domain === "school-subject") {
    return domain;
  }

  if (domain === "math" || domain === "mandarin-literacy") {
    return "school-subject";
  }

  if (domain === "general") {
    return "self-study";
  }

  return "language";
}

function flowCopy(locale: AppLocale) {
  const isZh = locale === "zh-TW";

  return {
    progressLabel: isZh ? "設定進度" : "Setup progress",
    domainLabel: isZh ? "類別" : "Type",
    languageLabel: isZh ? "語言" : "Language",
    educationLabel: isZh ? "學歷" : "Education",
    subjectLabel: isZh ? "科目" : "Subject",
    examLabel: isZh ? "考試" : "Exam",
    topicLabel: isZh ? "主題" : "Topic",
    levelLabel: isZh ? "程度" : "Level",
    purposeLabel: isZh ? "目的" : "Purpose",
    targetLabel: isZh ? "目標" : "Target",
    rhythmLabel: isZh ? "節奏" : "Rhythm",
    languageTitle: isZh ? "學一門語言" : "Learn a language",
    languageBody: isZh ? "目標語、母語、程度和情境會影響練習題型。" : "Target language, native language, level, and context shape the practice mix.",
    schoolTitle: isZh ? "學校科目" : "School subject",
    schoolBody: isZh ? "數學、國語、自然、社會等學校科目會走概念、例題和複習卡。" : "Math, Mandarin, science, social studies, and other school subjects use concepts, examples, and review cards.",
    examTitle: isZh ? "準備考試 / 證照" : "Prepare for an exam or certification",
    examBody: isZh ? "以考點、題型、錯誤分析和倒數時間安排學習。" : "Use exam points, question types, error analysis, and timing to plan study.",
    selfTitle: isZh ? "其他自學內容" : "Other self-study",
    selfBody: isZh ? "文章、工作知識、書籍、課程或專案都可以轉成短課。" : "Articles, work knowledge, books, courses, or projects can become short lessons.",
    chooseDomainTitle: isZh ? "先選學習目標類型" : "Choose the learning goal type",
    chooseDomainBody: isZh ? "不同類型會有不同設定流程，不會都套用語言學習欄位。" : "Each type has its own setup flow instead of reusing language-learning fields.",
    languageSetupTitle: isZh ? "設定語言背景" : "Set language context",
    schoolEducationTitle: isZh ? "選擇學歷 / 學制階段" : "Choose education level",
    schoolEducationBody: isZh ? "先確認所在學制，再選科目；同一科目在不同階段會用不同深度安排。" : "Choose the education stage before the subject; the same subject uses different depth at each stage.",
    schoolSubjectTitle: isZh ? "選擇學校科目" : "Choose the school subject",
    schoolSubjectBody: isZh ? "數學和國語現在都歸在學校科目底下，也可以輸入其他科目。" : "Math and Mandarin now live under school subjects, and you can enter another subject.",
    examDetailTitle: isZh ? "設定考試或證照" : "Set the exam or certification",
    examDetailBody: isZh ? "填入考試、證照或檢定名稱，後續會用考點和題型來安排。" : "Enter the exam, certification, or test name so the plan can focus on points and question types.",
    selfTopicTitle: isZh ? "設定自學主題" : "Set the self-study topic",
    selfTopicBody: isZh ? "輸入你正在學的內容，例如一本書、一門課、工作知識或專案。" : "Enter what you are studying, such as a book, course, work topic, or project.",
    schoolLevelTitle: isZh ? "設定年級與掌握度" : "Set grade and mastery",
    schoolLevelBody: isZh ? "學校科目不使用 CEFR，這裡改問年級與目前掌握情況。" : "School subjects do not use CEFR; this asks for grade and current mastery.",
    examLevelTitle: isZh ? "設定備考狀態" : "Set prep status",
    examLevelBody: isZh ? "用備考熟悉度判斷要先補基礎、刷題，還是做弱點整理。" : "Prep status decides whether to build basics, drill questions, or target weak areas.",
    selfLevelTitle: isZh ? "設定熟悉程度" : "Set familiarity",
    selfLevelBody: isZh ? "自學內容用熟悉度來控制摘要、回想和應用練習深度。" : "Self-study uses familiarity to tune summaries, recall, and application depth.",
    languagePurposeTitle: isZh ? "設定語言使用情境" : "Set the language use case",
    schoolPurposeTitle: isZh ? "設定學校科目的目標" : "Set the school subject goal",
    examTargetTitle: isZh ? "設定考試目標" : "Set the exam target",
    selfOutcomeTitle: isZh ? "設定自學成果" : "Set the self-study outcome",
    rhythmTitle: isZh ? "設定每日節奏" : "Set the daily rhythm",
    rhythmBody: isZh ? "先選能穩定完成的時間，後續再增加。" : "Start with a rhythm you can complete consistently, then increase later.",
    customSubject: isZh ? "其他科目或章節" : "Other subject or chapter",
    customSubjectPlaceholder: isZh ? "例如：生物、歷史、幾何、作文" : "e.g. biology, history, geometry, essay writing",
    gradeBand: isZh ? "年級 / 課程階段" : "Grade / course stage",
    gradeBandPlaceholder: isZh ? "例如：小六、國二、高一、微積分上" : "e.g. Grade 6, junior high, Algebra I, Calculus",
    elementary: isZh ? "國小" : "Elementary school",
    elementaryBody: isZh ? "基礎概念、字詞、計算、閱讀理解。" : "Foundational concepts, vocabulary, calculation, and comprehension.",
    juniorHigh: isZh ? "國中" : "Junior high",
    juniorHighBody: isZh ? "段考進度、會考基礎、題型整理。" : "Class progress, entrance exam basics, and question patterns.",
    seniorHigh: isZh ? "高中" : "Senior high",
    seniorHighBody: isZh ? "學測、分科、進階概念和跨章節整合。" : "Advanced concepts, exams, and cross-unit integration.",
    college: isZh ? "大學 / 專科" : "College / vocational",
    collegeBody: isZh ? "專業科目、報告、考試和課程章節。" : "Specialized subjects, reports, exams, and course units.",
    adultSchool: isZh ? "其他課程" : "Other coursework",
    adultSchoolBody: isZh ? "補習、線上課、進修或自訂學制。" : "Cram school, online courses, continuing education, or custom stages.",
    examName: isZh ? "考試 / 證照名稱" : "Exam / certification name",
    examNamePlaceholder: isZh ? "例如：多益、JLPT N3、會計師、學測英文" : "e.g. TOEIC, JLPT N3, CPA, SAT Math",
    targetScore: isZh ? "目標分數或門檻" : "Target score or threshold",
    targetScorePlaceholder: isZh ? "例如：750 分、N3 合格、60 天內通過" : "e.g. 750, pass N3, pass within 60 days",
    examDate: isZh ? "考試日期" : "Exam date",
    outcome: isZh ? "想完成的成果" : "Desired outcome",
    outcomePlaceholder: isZh ? "例如：能講解給別人、完成作品、讀完並記住重點" : "e.g. explain it, finish a project, remember the key points",
    selfTopicPlaceholder: isZh ? "例如：產品管理、投資入門、一本書、公司內訓" : "e.g. product management, investing basics, a book, internal training",
    math: isZh ? "數學" : "Math",
    mathBody: isZh ? "概念、公式、例題、應用題和錯誤分析。" : "Concepts, formulas, examples, word problems, and error analysis.",
    mandarin: isZh ? "國語 / 國文" : "Mandarin / Chinese literacy",
    mandarinBody: isZh ? "閱讀理解、主旨、字詞、改寫和作文。" : "Comprehension, main idea, vocabulary, rewriting, and writing.",
    science: isZh ? "自然 / 科學" : "Science",
    scienceBody: isZh ? "概念、因果、實驗、圖表和應用。" : "Concepts, cause and effect, experiments, charts, and application.",
    social: isZh ? "社會 / 歷史地理" : "Social studies",
    socialBody: isZh ? "事件、脈絡、比較、地圖和重點回想。" : "Events, context, comparison, maps, and recall.",
    levelA1: isZh ? "剛開始" : "Starting out",
    levelA2: isZh ? "有一點基礎" : "Some basics",
    levelB1: isZh ? "能做題但不穩" : "Can work through it",
    levelB2: isZh ? "想衝高分或熟練" : "Push for mastery",
    languageTravel: isZh ? "旅行或生活情境" : "Travel or everyday situations",
    languageDaily: isZh ? "日常聽說讀寫" : "Daily listening, speaking, reading, writing",
    languageWork: isZh ? "工作或專業使用" : "Work or professional use",
    languageExam: isZh ? "語言考試" : "Language exam",
    schoolGrade: isZh ? "跟上學校進度" : "Keep up with class",
    schoolScore: isZh ? "提高成績" : "Improve grades",
    schoolProblem: isZh ? "加強解題" : "Improve problem solving",
    schoolReading: isZh ? "加強閱讀寫作" : "Improve reading and writing",
    examPrep: isZh ? "準備考試" : "Exam prep",
    certification: isZh ? "準備證照" : "Certification prep",
    selfKnowledge: isZh ? "理解並記住知識" : "Understand and remember",
    selfProject: isZh ? "完成作品或專案" : "Finish a project",
    selfContent: isZh ? "掌握一份內容" : "Master a source",
  };
}

function levelOptions(text: ReturnType<typeof flowCopy>): Array<ChoiceOption<ProficiencyLevel>> {
  return [
    { value: "A1", title: text.levelA1, description: "" },
    { value: "A2", title: text.levelA2, description: "" },
    { value: "B1", title: text.levelB1, description: "" },
    { value: "B2", title: text.levelB2, description: "" }
  ];
}

function subjectForDomain(domain: OnboardingPrimaryDomain, subject: string) {
  if (domain === "school-subject" && subject === "math") {
    return { apiDomain: "school-subject" as LearningDomain, subject: "math" };
  }

  if (domain === "school-subject" && subject === "mandarin-literacy") {
    return { apiDomain: "school-subject" as LearningDomain, subject: "mandarin-literacy" };
  }

  if (domain === "self-study") {
    return { apiDomain: "self-study" as LearningDomain, subject };
  }

  return { apiDomain: domain as LearningDomain, subject };
}

function focusFromPurpose(purpose?: LearningPurpose): LearningFocus {
  if (purpose === "travel" || purpose === "daily" || purpose === "work" || purpose === "exam") {
    return purpose;
  }

  if (purpose === "exam-prep" || purpose === "certification" || purpose === "score-improvement") {
    return "exam";
  }

  if (purpose === "project") {
    return "work";
  }

  return "daily";
}

function normalizeDefaultDomain(defaults?: { domain?: LearningDomain }) {
  return primaryDomainFromDefault(defaults?.domain);
}

function schoolSubjectChoiceFromDefault(subject?: string): SchoolSubjectChoice | undefined {
  if (
    subject === "math" ||
    subject === "mandarin-literacy" ||
    subject === "science" ||
    subject === "social-studies"
  ) {
    return subject;
  }

  return subject ? "custom" : undefined;
}

export function OnboardingForm({
  locale,
  nextPath = "/dashboard",
  defaults,
  returnPath
}: {
  locale: AppLocale;
  nextPath?: string;
  returnPath?: string;
  defaults?: {
    targetLanguage?: TargetLanguage;
    level?: ProficiencyLevel;
    focus?: LearningFocus;
    dailyMinutes?: number;
    nativeLanguage?: NativeLanguage;
    domain?: LearningDomain;
    subject?: string;
  };
}) {
  const router = useRouter();
  const copy = getLocaleCopy(locale);
  const text = flowCopy(locale);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState<OnboardingPrimaryDomain>(() => normalizeDefaultDomain(defaults));
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage | undefined>(defaults?.targetLanguage);
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage | undefined>(defaults?.nativeLanguage);
  const [subject, setSubject] = useState(defaults?.subject ?? "");
  const [schoolSubjectChoice, setSchoolSubjectChoice] = useState<SchoolSubjectChoice | undefined>(() =>
    schoolSubjectChoiceFromDefault(defaults?.subject)
  );
  const [customSubject, setCustomSubject] = useState(() => {
    const choice = schoolSubjectChoiceFromDefault(defaults?.subject);
    return choice === "custom" ? defaults?.subject ?? "" : "";
  });
  const [gradeBand, setGradeBand] = useState("");
  const [level, setLevel] = useState<ProficiencyLevel | undefined>(defaults?.level);
  const [purpose, setPurpose] = useState<LearningPurpose | undefined>(defaults?.focus);
  const [examDate, setExamDate] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [outcome, setOutcome] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState<string | undefined>(
    defaults?.dailyMinutes ? String(defaults.dailyMinutes) : undefined
  );

  const targetLanguageOptions: Array<ChoiceOption<TargetLanguage>> = [
    { value: "english", label: copy.profileLabels.targetLanguage.english },
    { value: "japanese", label: copy.profileLabels.targetLanguage.japanese },
    { value: "korean", label: copy.profileLabels.targetLanguage.korean }
  ];
  const nativeLanguageOptions: Array<ChoiceOption<NativeLanguage>> = [
    { value: "zh-TW", label: copy.profileLabels.nativeLanguage["zh-TW"] }
  ];
  const minuteOptions: Array<ChoiceOption<string>> = [
    { value: "10", label: copy.onboarding.optionTenMinutes },
    { value: "15", label: copy.onboarding.optionFifteenMinutes },
    { value: "20", label: copy.onboarding.optionTwentyMinutes },
    { value: "30", label: copy.onboarding.optionThirtyMinutes }
  ];

  const steps = useMemo<OnboardingStep[]>(() => {
    const chooseDomain: OnboardingStep = {
      id: "domain",
      label: text.domainLabel,
      title: text.chooseDomainTitle,
      body: text.chooseDomainBody,
      field: (
        <div className="field">
          <label htmlFor="domain">{copy.onboarding.learningDomain}</label>
          <ChoiceCards
            name="domain"
            onChange={(nextDomain) => {
              setDomain(nextDomain);
              setSubject("");
              setSchoolSubjectChoice(undefined);
              setCustomSubject("");
              setGradeBand("");
              setPurpose(undefined);
              setExamDate("");
              setTargetScore("");
              setOutcome("");
              setLevel(undefined);
              setStep(1);
            }}
            options={[
              { value: "language", title: text.languageTitle, description: text.languageBody },
              { value: "school-subject", title: text.schoolTitle, description: text.schoolBody },
              { value: "exam-cert", title: text.examTitle, description: text.examBody },
              { value: "self-study", title: text.selfTitle, description: text.selfBody }
            ]}
            value={domain}
          />
        </div>
      )
    };
    const rhythm: OnboardingStep = {
      id: "rhythm",
      label: text.rhythmLabel,
      title: text.rhythmTitle,
      body: text.rhythmBody,
      field: (
        <div className="field">
          <label htmlFor="dailyMinutes">{copy.onboarding.dailyMinutes}</label>
          <ChoiceCards name="dailyMinutes" onChange={setDailyMinutes} options={minuteOptions} value={dailyMinutes} />
        </div>
      )
    };

    if (domain === "language") {
      return [
        chooseDomain,
        {
          id: "language",
          label: text.languageLabel,
          title: text.languageSetupTitle,
          body: copy.onboarding.stepIdentityBody,
          field: (
            <div className="stack">
              <div className="field">
                <label htmlFor="nativeLanguage">{copy.onboarding.nativeLanguage}</label>
                <ChoiceCards name="nativeLanguage" onChange={setNativeLanguage} options={nativeLanguageOptions} value={nativeLanguage} />
              </div>
              <div className="field">
                <label htmlFor="targetLanguage">{copy.onboarding.targetLanguage}</label>
                <ChoiceCards name="targetLanguage" onChange={setTargetLanguage} options={targetLanguageOptions} value={targetLanguage} />
              </div>
            </div>
          )
        },
        {
          id: "level",
          label: text.levelLabel,
          title: copy.onboarding.stepLevelTitle,
          body: copy.onboarding.stepLevelBody,
          field: (
            <div className="field">
              <label htmlFor="level">{copy.onboarding.level}</label>
              <ChoiceCards name="level" onChange={setLevel} options={levelOptions(text)} value={level} />
            </div>
          )
        },
        {
          id: "purpose",
          label: text.purposeLabel,
          title: text.languagePurposeTitle,
          body: copy.onboarding.stepFocusBody,
          field: (
            <div className="field">
              <label htmlFor="purpose">{copy.onboarding.focus}</label>
              <ChoiceCards
                name="purpose"
                onChange={setPurpose}
                options={[
                  { value: "travel", title: text.languageTravel },
                  { value: "daily", title: text.languageDaily },
                  { value: "work", title: text.languageWork },
                  { value: "exam", title: text.languageExam }
                ]}
                value={purpose}
              />
            </div>
          )
        },
        rhythm
      ];
    }

    if (domain === "school-subject") {
      return [
        chooseDomain,
        {
          id: "education",
          label: text.educationLabel,
          title: text.schoolEducationTitle,
          body: text.schoolEducationBody,
          field: (
            <div className="field">
              <label htmlFor="gradeBand">{text.gradeBand}</label>
              <ChoiceCards
                name="gradeBand"
                onChange={setGradeBand}
                options={[
                  { value: "elementary", title: text.elementary, description: text.elementaryBody },
                  { value: "junior-high", title: text.juniorHigh, description: text.juniorHighBody },
                  { value: "senior-high", title: text.seniorHigh, description: text.seniorHighBody },
                  { value: "college", title: text.college, description: text.collegeBody },
                  { value: "other-coursework", title: text.adultSchool, description: text.adultSchoolBody }
                ]}
                value={gradeBand}
              />
            </div>
          )
        },
        {
          id: "subject",
          label: text.subjectLabel,
          title: text.schoolSubjectTitle,
          body: text.schoolSubjectBody,
          field: (
            <div className="stack">
              <div className="field">
                <label htmlFor="schoolSubject">{copy.onboarding.subject}</label>
                <ChoiceCards
                  name="schoolSubject"
                  onChange={(nextSubject) => {
                    setSchoolSubjectChoice(nextSubject);
                    setSubject(nextSubject === "custom" ? customSubject : nextSubject);
                  }}
                  options={[
                    { value: "math", title: text.math, description: text.mathBody },
                    { value: "mandarin-literacy", title: text.mandarin, description: text.mandarinBody },
                    { value: "science", title: text.science, description: text.scienceBody },
                    { value: "social-studies", title: text.social, description: text.socialBody },
                    { value: "custom", title: text.customSubject, description: text.customSubjectPlaceholder }
                  ]}
                  value={schoolSubjectChoice}
                />
              </div>
              {schoolSubjectChoice === "custom" ? (
                <label className="field">
                  {text.customSubject}
                  <input
                    onChange={(event) => {
                      setCustomSubject(event.target.value);
                      setSubject(event.target.value);
                    }}
                    placeholder={text.customSubjectPlaceholder}
                    value={customSubject}
                  />
                </label>
              ) : null}
            </div>
          )
        },
        {
          id: "level",
          label: text.levelLabel,
          title: text.schoolLevelTitle,
          body: text.schoolLevelBody,
          field: (
            <div className="field">
              <label htmlFor="level">{copy.onboarding.level}</label>
              <ChoiceCards name="level" onChange={setLevel} options={levelOptions(text)} value={level} />
            </div>
          )
        },
        {
          id: "purpose",
          label: text.purposeLabel,
          title: text.schoolPurposeTitle,
          body: text.schoolBody,
          field: (
            <div className="field">
              <label htmlFor="purpose">{copy.onboarding.focus}</label>
              <ChoiceCards
                name="purpose"
                onChange={setPurpose}
                options={[
                  { value: "school-grade", title: text.schoolGrade },
                  { value: "score-improvement", title: text.schoolScore },
                  { value: "problem-solving", title: text.schoolProblem },
                  { value: "reading-writing", title: text.schoolReading }
                ]}
                value={purpose}
              />
            </div>
          )
        },
        rhythm
      ];
    }

    if (domain === "exam-cert") {
      return [
        chooseDomain,
        {
          id: "exam",
          label: text.examLabel,
          title: text.examDetailTitle,
          body: text.examDetailBody,
          field: (
            <label className="field">
              {text.examName}
              <input onChange={(event) => setSubject(event.target.value)} placeholder={text.examNamePlaceholder} value={subject} />
            </label>
          )
        },
        {
          id: "level",
          label: text.levelLabel,
          title: text.examLevelTitle,
          body: text.examLevelBody,
          field: (
            <div className="field">
              <label htmlFor="level">{copy.onboarding.level}</label>
              <ChoiceCards name="level" onChange={setLevel} options={levelOptions(text)} value={level} />
            </div>
          )
        },
        {
          id: "target",
          label: text.targetLabel,
          title: text.examTargetTitle,
          body: text.examBody,
          field: (
            <div className="stack">
              <div className="field">
                <label htmlFor="purpose">{copy.onboarding.focus}</label>
                <ChoiceCards
                  name="purpose"
                  onChange={setPurpose}
                  options={[
                    { value: "exam-prep", title: text.examPrep },
                    { value: "certification", title: text.certification }
                  ]}
                  value={purpose}
                />
              </div>
              <label className="field">
                {text.targetScore}
                <input onChange={(event) => setTargetScore(event.target.value)} placeholder={text.targetScorePlaceholder} value={targetScore} />
              </label>
              <label className="field">
                {text.examDate}
                <input onChange={(event) => setExamDate(event.target.value)} type="date" value={examDate} />
              </label>
            </div>
          )
        },
        rhythm
      ];
    }

    return [
      chooseDomain,
      {
        id: "topic",
        label: text.topicLabel,
        title: text.selfTopicTitle,
        body: text.selfTopicBody,
        field: (
          <label className="field">
            {copy.onboarding.subject}
            <input onChange={(event) => setSubject(event.target.value)} placeholder={text.selfTopicPlaceholder} value={subject} />
          </label>
        )
      },
      {
        id: "level",
        label: text.levelLabel,
        title: text.selfLevelTitle,
        body: text.selfLevelBody,
        field: (
          <div className="field">
            <label htmlFor="level">{copy.onboarding.level}</label>
            <ChoiceCards name="level" onChange={setLevel} options={levelOptions(text)} value={level} />
          </div>
        )
      },
      {
        id: "outcome",
        label: text.targetLabel,
        title: text.selfOutcomeTitle,
        body: text.selfBody,
        field: (
          <div className="stack">
            <div className="field">
              <label htmlFor="purpose">{copy.onboarding.focus}</label>
              <ChoiceCards
                name="purpose"
                onChange={setPurpose}
                options={[
                  { value: "knowledge", title: text.selfKnowledge },
                  { value: "project", title: text.selfProject },
                  { value: "content-mastery", title: text.selfContent }
                ]}
                value={purpose}
              />
            </div>
            <label className="field">
              {text.outcome}
              <input onChange={(event) => setOutcome(event.target.value)} placeholder={text.outcomePlaceholder} value={outcome} />
            </label>
          </div>
        )
      },
      rhythm
    ];
  }, [
    copy,
    dailyMinutes,
    domain,
    examDate,
    gradeBand,
    level,
    nativeLanguage,
    outcome,
    purpose,
    customSubject,
    schoolSubjectChoice,
    subject,
    targetLanguage,
    targetScore,
    text
  ]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isStepComplete(step)) {
      return;
    }

    if (step < steps.length) {
      setStep((current) => current + 1);
      return;
    }

    const normalized = subjectForDomain(domain, subject);
    const selectedPurpose = purpose ?? (domain === "language" ? "daily" : domain === "exam-cert" ? "exam-prep" : "knowledge");

    setPending(true);
    setError(null);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        targetLanguage: targetLanguage ?? "english",
        domain: normalized.apiDomain,
        subject: normalized.subject,
        purpose: selectedPurpose,
        gradeBand,
        examDate,
        targetScore,
        outcome,
        level: level!,
        focus: focusFromPurpose(selectedPurpose),
        dailyMinutes: dailyMinutes!,
        nativeLanguage: nativeLanguage ?? "zh-TW"
      })
    });

    if (!response.ok) {
      setPending(false);
      setError(copy.onboarding.saveError);
      return;
    }

    startTransition(() => {
      const destination = returnPath?.startsWith("/") ? returnPath : nextPath.startsWith("/") ? nextPath : "/dashboard";
      const refreshUrl = destination.startsWith("/profile") || destination.startsWith("/onboarding")
        ? `${destination}${destination.includes("?") ? "&" : "?"}updated=${Date.now()}`
        : destination;
      router.replace(refreshUrl);
      router.refresh();
    });
  }

  function isStepComplete(currentStep: number) {
    const current = steps[currentStep - 1];

    if (!current) {
      return false;
    }

    if (current.id === "domain") {
      return Boolean(domain);
    }

    if (current.id === "language") {
      return Boolean(nativeLanguage && targetLanguage);
    }

    if (current.id === "education") {
      return Boolean(gradeBand);
    }

    if (current.id === "subject" || current.id === "exam" || current.id === "topic") {
      return Boolean(subject.trim());
    }

    if (current.id === "level") {
      return Boolean(level);
    }

    if (current.id === "purpose") {
      return Boolean(purpose);
    }

    if (current.id === "target") {
      return Boolean(purpose && (targetScore.trim() || examDate.trim()));
    }

    if (current.id === "outcome") {
      return Boolean(purpose && outcome.trim());
    }

    return Boolean(dailyMinutes);
  }

  const safeStep = Math.min(step, steps.length);
  const stepMeta = steps[safeStep - 1];
  const canContinue = isStepComplete(safeStep);
  const progressPercent = Math.round((safeStep / steps.length) * 100);

  return (
    <form className="stack onboarding-wizard" onSubmit={onSubmit}>
      <ToastNotice message={error} tone="error" />
      <div className="onboarding-progress" aria-label={text.progressLabel}>
        <div className="onboarding-progress-head">
          <span>{copy.onboarding.step} {safeStep}/{steps.length}</span>
          <strong>{progressPercent}%</strong>
        </div>
        <div className="onboarding-progress-track" aria-hidden="true">
          <div className="onboarding-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <ol className="onboarding-progress-steps">
          {steps.map((item, index) => (
            <li
              key={item.id}
              className={`onboarding-progress-step${index + 1 === safeStep ? " current" : ""}${index + 1 < safeStep ? " done" : ""}`}
            >
              <span>{index + 1}</span>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ol>
      </div>
      <div className="stack">
        <h3 className="section-title">{stepMeta.title}</h3>
        <p className="subtle">{stepMeta.body}</p>
      </div>
      {stepMeta.field}
      <div className="button-row">
        {safeStep > 1 ? (
          <button className="button-secondary" disabled={pending} onClick={() => setStep((current) => current - 1)} type="button">
            {copy.onboarding.back}
          </button>
        ) : null}
        <button className="button" disabled={pending || !canContinue} type="submit">
          {pending ? copy.onboarding.creating : safeStep === steps.length ? copy.onboarding.finish : copy.onboarding.next}
        </button>
      </div>
    </form>
  );
}
