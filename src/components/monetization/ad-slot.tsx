import { AppLocale } from "@/lib/i18n";

export function AdSlot({
  locale,
  childMode = false
}: {
  locale: AppLocale;
  childMode?: boolean;
}) {
  const isZh = locale === "zh-TW";

  return (
    <aside className="ad-slot" aria-label={isZh ? "贊助內容" : "Sponsored content"}>
      <div className="eyebrow">{isZh ? "免費版贊助" : "Free tier sponsor"}</div>
      <p className="subtle">
        {childMode
          ? isZh
            ? "兒童/家長模式只顯示非個人化學習贊助內容。"
            : "Parent/child mode only shows non-personalized learning sponsorship."
          : isZh
            ? "免費版可在非學習流程頁面顯示聯播網廣告，學習頁保持專注。"
            : "The free tier can show network ads outside active learning sessions while study pages stay focused."}
      </p>
    </aside>
  );
}
