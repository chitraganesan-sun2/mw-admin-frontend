export interface FeedbackSide {
  responses: number;
  helpful: { yes: number; no: number; unanswered: number };
  goal_addressed: { yes: number; partly: number; no: number; unanswered: number };
}

export interface FeedbackSummary {
  days: number;
  learner: FeedbackSide;
  volunteer: FeedbackSide;
}

/** Whole-number percentage of the answered total (unanswered is left out so skipped questions don't skew it). */
export function percentOfAnswered(count: number, counts: Record<string, number>): number | null {
  const answered = Object.entries(counts).reduce((sum, [k, v]) => (k === "unanswered" ? sum : sum + v), 0);
  return answered === 0 ? null : Math.round((count / answered) * 100);
}
