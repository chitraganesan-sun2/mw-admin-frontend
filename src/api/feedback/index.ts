import { endpoints } from "../constants";
import { GET_API } from "../request";
import type { FeedbackSummary } from "@/utils/feedbackSummary";

export const getFeedbackSummary = async (days: number): Promise<FeedbackSummary> =>
  (await GET_API(`${endpoints.feedback.summary}?days=${days}`))?.data as FeedbackSummary;
