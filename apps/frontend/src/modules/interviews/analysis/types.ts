import { z } from "zod";

export const CompetencyScoreSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
});

export type CompetencyScore = z.infer<typeof CompetencyScoreSchema>;

export const TimelinePointSchema = z.object({
  t: z.number(),
  sentiment: z.number().optional(),
  speakingRatio: z.number().optional(),
});

export type TimelinePoint = z.infer<typeof TimelinePointSchema>;

export const InterviewAnalysisSchema = z.object({
  rubric: z.record(z.string(), z.unknown()).nullable().optional(),
  competencyScores: z.array(CompetencyScoreSchema).nullable().optional(),
  timeline: z.array(TimelinePointSchema).nullable().optional(),
});

export type InterviewAnalysis = z.infer<typeof InterviewAnalysisSchema>;

export const InterviewAnalysisOutputSchema = z.object({
  overallScore: z.number().min(1).max(100),
  recommendation: z.enum(["hire", "maybe", "no"]),
  summary: z.string(),
  strengths: z.string(),
  improvements: z.string(),
  feedback: z.string(),
  rubric: z.record(z.string(), z.unknown()).nullable().optional(),
  competencyScores: z.array(CompetencyScoreSchema).nullable().optional(),
  timeline: z.array(TimelinePointSchema).nullable().optional(),
});

export type InterviewAnalysisOutput = z.infer<typeof InterviewAnalysisOutputSchema>;

