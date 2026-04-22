import { AppLocale } from "@/lib/i18n";
import { ReviewGrade, ReviewItem } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function scoreToLabel(grade: ReviewGrade, locale: AppLocale = "zh-TW") {
  const labels =
    locale === "zh-TW"
      ? {
          again: "重來",
          hard: "吃力",
          good: "剛好",
          easy: "很穩"
        }
      : {
          again: "Again",
          hard: "Hard",
          good: "Good",
          easy: "Easy"
        };

  return labels[grade];
}

export function updateReviewItem(
  item: ReviewItem,
  grade: ReviewGrade,
  reviewedAt = new Date(),
) {
  let easeFactor = item.easeFactor;
  let intervalDays = item.intervalDays;
  let repetitionCount = item.repetitionCount;
  let lapseCount = item.lapseCount;

  if (grade === "again") {
    repetitionCount = 0;
    lapseCount += 1;
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    repetitionCount += 1;

    if (repetitionCount === 1) {
      intervalDays = grade === "hard" ? 1 : 2;
    } else if (repetitionCount === 2) {
      intervalDays = grade === "hard" ? 2 : grade === "easy" ? 6 : 4;
    } else {
      const multiplier =
        grade === "hard" ? 1.2 : grade === "easy" ? easeFactor + 0.2 : easeFactor;
      intervalDays = Math.max(1, Math.round(intervalDays * multiplier));
    }

    easeFactor = Math.max(
      1.3,
      grade === "easy" ? easeFactor + 0.15 : grade === "hard" ? easeFactor - 0.1 : easeFactor,
    );
  }

  return {
    ...item,
    easeFactor,
    intervalDays,
    repetitionCount,
    lapseCount,
    lastReviewedAt: reviewedAt.toISOString(),
    dueDate: addDays(reviewedAt, intervalDays).toISOString()
  };
}
