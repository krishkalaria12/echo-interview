import JSONL from "jsonl-parse-stringify";
import { inArray, eq } from "drizzle-orm";
import { createAgent, gemini, TextMessage } from "@inngest/agent-kit";

import { inngest } from "./client";
import { db } from "@/db";
import { user, agents, interviews } from "@/db/schemas";
import type { StreamTranscriptItem } from "@/modules/interviews/types";
import { INTERVIEW_SUMMARY_PROMPT } from "@/lib/system-prompt";

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
