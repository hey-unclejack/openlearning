import { AppLocale } from "@/lib/i18n";
import { LearningSourceType } from "@/lib/types";

type AiBusinessSnapshotData = {
  generatedPlanCount: number;
  completedPlanCount: number;
  activePlanCount: number;
  completedLessonCount: number;
  totalGeneratedLessonCount: number;
  completionRate: number;
  avgCostPerPlan: number;
  officialUsageCount: number;
  byokUsageCount: number;
  byokConfigured: boolean;
  childModeSourceCount: number;
  dailyOfficialLimit: number;
  officialToday: number;
  officialRemaining: number;
  todayCostEstimateUsd: number;
  totalCostEstimateUsd: number;
  sourceTypeCounts: Record<LearningSourceType, number>;
  topSourceType?: LearningSourceType;
  shouldPromoteByok: boolean;
  shouldTightenFreeQuota: boolean;
};

function labelSource(type?: LearningSourceType) {
  return type ? type.toUpperCase() : "None";
}

export function AiBusinessSnapshot({
  locale,
  snapshot
}: {
  locale: AppLocale;
  snapshot: AiBusinessSnapshotData;
}) {
  const isZh = locale === "zh-TW";
  const sourceEntries = Object.entries(snapshot.sourceTypeCounts).filter(([, count]) => count > 0);

  return (
    <section className="review-card stack ai-business-snapshot">
      <div>
        <div className="eyebrow">{isZh ? "AI 營運快照" : "AI operations snapshot"}</div>
        <h2 className="section-title">{isZh ? "成本、導入與完成率" : "Cost, intake, and completion"}</h2>
      </div>

      <div className="ai-snapshot-grid">
        <div className="metric-card">
          <div className="metric-label subtle">{isZh ? "生成計劃" : "Generated plans"}</div>
          <div className="metric-value">{snapshot.generatedPlanCount}</div>
          <p className="subtle">{snapshot.activePlanCount} active · {snapshot.completedPlanCount} completed</p>
        </div>
        <div className="metric-card">
          <div className="metric-label subtle">{isZh ? "AI 課完成率" : "AI lesson completion"}</div>
          <div className="metric-value">{Math.round(snapshot.completionRate * 100)}%</div>
          <p className="subtle">{snapshot.completedLessonCount} / {snapshot.totalGeneratedLessonCount} lessons</p>
        </div>
        <div className="metric-card">
          <div className="metric-label subtle">{isZh ? "今日官方額度" : "Official quota today"}</div>
          <div className="metric-value">{snapshot.officialRemaining}</div>
          <p className="subtle">{snapshot.officialToday} / {snapshot.dailyOfficialLimit} used</p>
        </div>
        <div className="metric-card">
          <div className="metric-label subtle">{isZh ? "平均成本" : "Avg cost"}</div>
          <div className="metric-value">${snapshot.avgCostPerPlan.toFixed(4)}</div>
          <p className="subtle">${snapshot.todayCostEstimateUsd.toFixed(4)} today</p>
        </div>
      </div>

      <div className="ai-snapshot-grid secondary">
        <div className="muted-box">
          <div className="eyebrow">{isZh ? "來源組合" : "Source mix"}</div>
          <p className="subtle">
            {sourceEntries.length === 0
              ? isZh ? "尚無導入內容。" : "No imported sources yet."
              : sourceEntries.map(([type, count]) => `${type}: ${count}`).join(" · ")}
          </p>
          <p className="subtle">{isZh ? "目前最多：" : "Top source:"} {labelSource(snapshot.topSourceType)}</p>
        </div>
        <div className="muted-box">
          <div className="eyebrow">BYOK</div>
          <p className="subtle">
            {snapshot.byokConfigured
              ? isZh ? "已連接自帶 API key。" : "User API key is configured."
              : isZh ? "尚未連接自帶 API key。" : "No user API key configured."}
          </p>
          <p className="subtle">Official: {snapshot.officialUsageCount} · BYOK: {snapshot.byokUsageCount}</p>
        </div>
        <div className="muted-box">
          <div className="eyebrow">{isZh ? "風險提示" : "Operating signals"}</div>
          <p className="subtle">
            {snapshot.shouldPromoteByok
              ? isZh ? "官方額度壓力偏高，應提示 BYOK 或加值。" : "Official quota pressure is high; promote BYOK or paid add-ons."
              : snapshot.shouldTightenFreeQuota
                ? isZh ? "平均成本偏高且 BYOK 未啟用，應收緊免費額度。" : "Average cost is high without BYOK adoption; tighten free quota."
                : isZh ? "目前成本與額度狀態正常。" : "Quota and cost signals are currently normal."}
          </p>
          <p className="subtle">{isZh ? "兒童/家長來源：" : "Parent/child sources:"} {snapshot.childModeSourceCount}</p>
        </div>
      </div>
    </section>
  );
}
