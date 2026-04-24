import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { LearningType } from "@/lib/types";

type BucketSummary = {
  must?: string;
  should?: string;
  can?: string;
};

export function ReviewPlanningCard({
  locale,
  title,
  body,
  weakTypes = [],
  weakLabel,
  bucketSummary,
  className = "muted-box today-lesson-fit",
}: {
  locale: AppLocale;
  title: string;
  body?: string;
  weakTypes?: LearningType[];
  weakLabel?: string;
  bucketSummary?: BucketSummary;
  className?: string;
}) {
  const copy = getLocaleCopy(locale);

  return (
    <div className={className}>
      <div className="eyebrow">{title}</div>
      {body ? <p className="subtle">{body}</p> : null}
      {bucketSummary?.must ? <p className="subtle">{bucketSummary.must}</p> : null}
      {bucketSummary?.should ? <p className="subtle">{bucketSummary.should}</p> : null}
      {bucketSummary?.can ? <p className="subtle">{bucketSummary.can}</p> : null}
      {weakTypes.length > 0 ? (
        <div className="today-focus-list">
          {weakLabel ? <div className="eyebrow">{weakLabel}</div> : null}
          <div className="today-focus-pills">
            {weakTypes.map((type) => (
              <span key={type} className="pill lesson-meta-pill-secondary">
                {copy.todayPage.learningTypeLabel(type)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
