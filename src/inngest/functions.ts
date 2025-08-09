import JSONL from "jsonl-parse-stringify";
import { inArray, eq } from "drizzle-orm";
import { createAgent, gemini, TextMessage } from "@inngest/agent-kit";

import { inngest } from "./client";
import { db } from "@/db";
import { user, agents, interviews } from "@/db/schemas";
import type { StreamTranscriptItem } from "@/modules/interviews/types";
import { INTERVIEW_SUMMARY_PROMPT } from "@/lib/system-prompt";
import { buildProfile } from "@/ai/profile";
import { runAnalysis } from "@/ai/analysis";
import { streamVideo } from "@/lib/stream-video";

const summarizer = createAgent({
    name: "summarizer",
    system: INTERVIEW_SUMMARY_PROMPT.trim(),
    model: gemini({
        model: "gemini-2.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
    })
})

// Triggers on event: "interviews/processing"
export const interviewsProcessing = inngest.createFunction(
  { id: "interviews/processing" },
  { event: "interviews/processing" },
  // Using a lightweight type on the payload to keep the client loosely typed
  async ({ event, step }) => {
    const transcriptUrl = event.data?.transcriptUrl;

    if (!transcriptUrl) {
      throw new Error("Missing transcriptUrl in event data");
    }

    const response = await step.run("fetch-transcript", async () => {
      return fetch(transcriptUrl).then((res) => res.text());
    });

    const transcript = await step.run("parse-transcript", async () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      const uniqueSpeakerIds = Array.from(
        new Set(transcript.map((item) => item.speaker_id))
      );

      if (uniqueSpeakerIds.length === 0) return transcript;

      const [userSpeakers, agentSpeakers] = await Promise.all([
        db.select().from(user).where(inArray(user.id, uniqueSpeakerIds)).then((users) => users.map((user) => ({
            ...user
        }))),
        db.select().from(agents).where(inArray(agents.id, uniqueSpeakerIds)).then((agents) => agents.map((agent) => ({
            ...agent
        }))),
      ]);

      const speakers = [
        ...userSpeakers,
        ...agentSpeakers,
      ];

      return transcript.map((item) => {
        const speaker = speakers.find((s) => s.id === item.speaker_id);

        if (!speaker) {
          return {
            ...item,
            user: {
                name: "unknown"
            }
          }
        }

        return { 
            ...item,
            user: {
                name: speaker.name,
            }
         };
      });
    });

    const { output } = await summarizer.run(
        "Summarize the following transcript: " +
        JSON.stringify(transcriptWithSpeakers)
    );

    await step.run("save-summary", async () => {
        await db
            .update(interviews)
            .set({
                summary: (output[0] as TextMessage).content as string,
                status: "completed",
            })
            .where(eq(interviews.id, event.data.interviewId));
    });

    return { transcript: transcriptWithSpeakers, summary: output };
  }
);

// Enrich profile and update agent instructions
export const interviewsProfileEnrich = inngest.createFunction(
  { id: "interviews/profile.enrich" },
  { event: "interviews/profile.enrich" },
  async ({ event, step }) => {
    const { interviewId, resumeUrl, githubUrl, linkedinUrl, portfolioUrl, position, agentId } = event.data as any;
    const profile = await step.run("build-profile", async () =>
      buildProfile({ resumeUrl, githubUrl, linkedinUrl, portfolioUrl, position })
    );

    if (!profile) return { updated: false };

    const [existing] = await db.select().from(agents).where(eq(agents.id, agentId));
    if (!existing) return { updated: false };

    const [interview] = await db.select().from(interviews).where(eq(interviews.id, interviewId));
    if (!interview) return { updated: false };

    const updatedInstructions = `${existing.instructions}\n\n### Candidate Profile (Enriched)\n${profile}`;
    await db.update(agents).set({ instructions: updatedInstructions }).where(eq(agents.id, agentId));

    return { updated: true };
  }
);

// Deep analysis after transcript is ready
export const interviewsDeepAnalysis = inngest.createFunction(
  { id: "interviews/analysis" },
  { event: "interviews/processing" },
  async ({ event, step }) => {
    const transcriptUrl = (event.data as any)?.transcriptUrl as string | undefined;
    const interviewId = (event.data as any)?.interviewId as string | undefined;
    if (!transcriptUrl || !interviewId) return { ok: false };

    // Optional: fetch previous summary if exists for comparison
    const [existing] = await db.select().from(interviews).where(eq(interviews.id, interviewId));
    const analysis = await step.run("run-analysis", async () =>
      runAnalysis({ transcriptUrl, previousSummary: existing?.summary })
    );

    await db
      .update(interviews)
      .set({
        summary: analysis.summary ?? existing?.summary ?? null,
        strengths: analysis.strengths ?? null,
        improvements: analysis.improvements ?? null,
        feedback: analysis.feedback ?? null,
        overallScore: analysis.overallScore ?? null,
        recommendation: analysis.recommendation && ["hire","maybe","no"].includes(analysis.recommendation) ? analysis.recommendation : null,
        // analysis JSON optional: write only if column exists; ignore otherwise
      })
      .where(eq(interviews.id, interviewId));

    return { ok: true };
  }
);
