import JSONL from "jsonl-parse-stringify";
import { Annotation, MemorySaver, StateGraph, START, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { nanoid } from "nanoid";
import { z } from "zod";
import { InterviewAnalysisOutputSchema } from "@/modules/interviews/analysis/types";

type TranscriptItem = {
  speaker_id: string;
  type: string;
  text: string;
  start_ts: number;
  stop_ts: number;
  user?: { name?: string };
};

export type AnalysisInputs = {
  transcriptUrl: string;
  previousSummary?: string | null;
};

const AnalysisState = Annotation.Root({
  // Inputs mirrored in state so we can pass them to graph
  transcriptUrl: Annotation<string>(),
  previousSummary: Annotation<string | null>(),
  // Derived
  transcriptItems: Annotation<TranscriptItem[]>(),
  summary: Annotation<string | null>(),
  strengths: Annotation<string | null>(),
  improvements: Annotation<string | null>(),
  feedback: Annotation<string | null>(),
  overallScore: Annotation<number | null>(),
  recommendation: Annotation<"hire" | "maybe" | "no" | null>(),
});

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
  responseMimeType: "application/json",
});

async function fetchTranscript(state: typeof AnalysisState.State) {
  const res = await fetch(state.transcriptUrl);
  const text = await res.text();
  const parsed = JSONL.parse<TranscriptItem>(text);
  return { transcriptItems: parsed };
}

function extractJsonFromText(text: string): string | null {
  const fence = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) return fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return null;
}

async function analyze(state: typeof AnalysisState.State) {
  const { transcriptItems, previousSummary } = state as any;
  // Guard: empty transcript
  if (!transcriptItems || transcriptItems.length === 0) {
    return {
      overallScore: null,
      recommendation: null,
      summary: "Transcript is empty; cannot analyze.",
      strengths: null,
      improvements: "Please provide a non-empty transcript for analysis.",
      feedback: "Transcript is empty; no analysis could be performed.",
      analysis: JSON.stringify({ timeline: [] }),
    };
  }
  const prompt = `You are an expert interview evaluator. Analyze the transcript and produce:
1) Overall Score (1-100)
2) Recommendation (hire/maybe/no)
3) Summary (markdown, concise)
4) Strengths (markdown list)
5) Improvements (markdown list)
6) Feedback (markdown detailed)
7) If previous summary exists, briefly compare and state how this one is better or worse.

Return JSON with keys: overallScore, recommendation, summary, strengths, improvements, feedback.

Transcript JSON:
${JSON.stringify(transcriptItems).slice(0, 120000)}

Previous Summary:
${previousSummary || ""}`;

  const response = await model.invoke(`${prompt}\nRespond ONLY with a single minified JSON object matching keys: overallScore, recommendation, summary, strengths, improvements, feedback, competencyScores, timeline, rubric.`);
  const content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  const jsonCandidate = extractJsonFromText(content) ?? content;

  // Validate with Zod (structured output)
  let parsed: ReturnType<typeof InterviewAnalysisOutputSchema.safeParse> | undefined;
  try {
    parsed = InterviewAnalysisOutputSchema.safeParse(JSON.parse(jsonCandidate));
  } catch {
    parsed = undefined;
  }
  if (!parsed || !parsed.success) {
    // Fallback: attempt minimal fields
    let loose: any = {};
    try { loose = JSON.parse(jsonCandidate); } catch { loose = {}; }
    return {
      overallScore: Number(loose.overallScore) || null,
      recommendation: (loose.recommendation?.toLowerCase?.() || null) as any,
      summary: loose.summary || null,
      strengths: loose.strengths || null,
      improvements: loose.improvements || null,
      feedback: loose.feedback || null,
      analysis: JSON.stringify({
        rubric: loose.rubric || null,
        competencyScores: loose.competencyScores || null,
        timeline: loose.timeline || null,
      }),
    };
  }
  const valid = parsed.data;
  return {
    overallScore: valid.overallScore,
    recommendation: valid.recommendation,
    summary: valid.summary,
    strengths: valid.strengths,
    improvements: valid.improvements,
    feedback: valid.feedback,
    analysis: JSON.stringify({
      rubric: valid.rubric || null,
      competencyScores: valid.competencyScores || null,
      timeline: valid.timeline || null,
    }),
  };
}

export async function runAnalysis(inputs: AnalysisInputs) {
  const graph = new StateGraph(AnalysisState)
    .addNode("fetchTranscript", fetchTranscript)
    .addNode("analyze", analyze)
    .addEdge(START, "fetchTranscript")
    .addEdge("fetchTranscript", "analyze")
    .addEdge("analyze", END)
    .compile({ checkpointer: new MemorySaver() });
  const initialState = {
    transcriptUrl: inputs.transcriptUrl,
    previousSummary: inputs.previousSummary ?? null,
  } as Partial<typeof AnalysisState.State> as any;

  const output = await graph.invoke(initialState, { configurable: { thread_id: nanoid() } });
  return output;
}

