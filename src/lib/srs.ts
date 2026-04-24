import {
  Card,
  Grade,
  Rating,
  State,
  createEmptyCard,
  fsrs,
} from "ts-fsrs";
import { AppLocale } from "@/lib/i18n";
import { FsrsCardState, ReviewGrade, ReviewItem } from "@/lib/types";

export const DEFAULT_DESIRED_RETENTION = 0.9;

const stateToFsrs: Record<FsrsCardState, State> = {
  New: State.New,
  Learning: State.Learning,
  Review: State.Review,
  Relearning: State.Relearning,
};

const stateFromFsrs: Record<State, FsrsCardState> = {
  [State.New]: "New",
  [State.Learning]: "Learning",
  [State.Review]: "Review",
  [State.Relearning]: "Relearning",
};

export function reviewGradeToFsrsRating(grade: ReviewGrade): Grade {
  const ratings: Record<ReviewGrade, Grade> = {
    again: Rating.Again,
    hard: Rating.Hard,
    good: Rating.Good,
    easy: Rating.Easy,
  };

  return ratings[grade];
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

function normalizeDesiredRetention(value?: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_DESIRED_RETENTION;
  }

  return Math.min(0.97, Math.max(0.75, value ?? DEFAULT_DESIRED_RETENTION));
}

export function makeFsrsScheduler(desiredRetention = DEFAULT_DESIRED_RETENTION) {
  return fsrs({
    request_retention: normalizeDesiredRetention(desiredRetention),
    enable_fuzz: false,
    enable_short_term: false,
  });
}

export function reviewItemToFsrsCard(item: ReviewItem): Card {
  const fallback = createEmptyCard(new Date(item.dueDate));

  return {
    ...fallback,
    due: new Date(item.dueDate),
    stability: item.fsrsStability ?? fallback.stability,
    difficulty: item.fsrsDifficulty ?? fallback.difficulty,
    elapsed_days: item.fsrsElapsedDays ?? fallback.elapsed_days,
    scheduled_days: item.fsrsScheduledDays ?? item.intervalDays ?? fallback.scheduled_days,
    reps: item.fsrsReps ?? item.repetitionCount ?? fallback.reps,
    lapses: item.fsrsLapses ?? item.lapseCount ?? fallback.lapses,
    state: item.fsrsState ? stateToFsrs[item.fsrsState] : fallback.state,
    last_review: item.fsrsLastReview
      ? new Date(item.fsrsLastReview)
      : item.lastReviewedAt
        ? new Date(item.lastReviewedAt)
        : fallback.last_review,
  };
}

export function fsrsCardToReviewFields(card: Card) {
  return {
    fsrsState: stateFromFsrs[card.state],
    fsrsStability: card.stability,
    fsrsDifficulty: card.difficulty,
    fsrsElapsedDays: card.elapsed_days,
    fsrsScheduledDays: card.scheduled_days,
    fsrsReps: card.reps,
    fsrsLapses: card.lapses,
    fsrsLastReview: card.last_review?.toISOString(),
  };
}

export function initializeReviewItemFsrs(item: ReviewItem) {
  const card = reviewItemToFsrsCard(item);

  return {
    ...item,
    ...fsrsCardToReviewFields(card),
  };
}

export function estimateRetrievability(item: ReviewItem, now = new Date()) {
  const card = reviewItemToFsrsCard(item);

  if (!card.last_review || card.stability <= 0) {
    return new Date(item.dueDate).getTime() <= now.getTime() ? 0.72 : 0.9;
  }

  return makeFsrsScheduler().get_retrievability(card, now, false);
}

export function updateReviewItem(
  item: ReviewItem,
  grade: ReviewGrade,
  reviewedAt = new Date(),
  desiredRetention = DEFAULT_DESIRED_RETENTION,
) {
  const scheduler = makeFsrsScheduler(desiredRetention);
  const rating = reviewGradeToFsrsRating(grade);
  const result = scheduler.next(reviewItemToFsrsCard(item), reviewedAt, rating);
  const updatedCard = result.card;
  const scheduledDays = Math.max(0, updatedCard.scheduled_days);

  return {
    ...item,
    ...fsrsCardToReviewFields(updatedCard),
    easeFactor: item.easeFactor,
    intervalDays: scheduledDays,
    repetitionCount: updatedCard.reps,
    lapseCount: updatedCard.lapses,
    lastReviewedAt: reviewedAt.toISOString(),
    dueDate: updatedCard.due.toISOString(),
  };
}
