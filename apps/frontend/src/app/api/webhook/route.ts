import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import {
  MessageNewEvent,
  CallEndedEvent,
  CallRecordingReadyEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallTranscriptionReadyEvent,
} from "@stream-io/node-sdk";

import { db } from "@/db";
import { agents, interviews } from "@/db/schemas";
import { streamVideo } from "@/lib/stream-video";
import { inngest } from "@/inngest/client";
import { streamChat } from "@/lib/stream-chat";
import { generateAvatarUri } from "@/lib/avatar";
import { chatInstructions } from "@/lib/chat-instructions";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

function verifySignatureWithSDK(body: string, signature: string): boolean {
  return streamVideo.verifyWebhook(body, signature);
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  const apiKey = req.headers.get("x-api-key");

  if (!signature || !apiKey) {
    return NextResponse.json(
      { error: "Missing signature or API key" },
      { status: 400 }
    );
  }

  const body = await req.text();

  if (!verifySignatureWithSDK(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (payload as Record<string, unknown>)?.type;

  if (eventType === "call.session_started") {
    const event = payload as CallSessionStartedEvent;
    const interviewId = event.call.custom?.interviewId;

    if (!interviewId) {
      return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });
    }

    const [existingInterview] = await db
        .select()
        .from(interviews)
        .where(
            and(
                eq(interviews.id, interviewId),
                not(eq(interviews.status, "completed")),
                not(eq(interviews.status, "active")),
                not(eq(interviews.status, "cancelled")),
                not(eq(interviews.status, "processing")),
            )
        );

    if (!existingInterview) {
        return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    await db
        .update(interviews)
        .set({
            status: "active",
            startedAt: new Date(),
        })
        .where(eq(interviews.id, existingInterview.id));

    const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.interviewId, existingInterview.id));

    if (!existingAgent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const call = streamVideo.video.call("default", interviewId);
    const realtimeClient = await streamVideo.video.connectOpenAi({
        call,
        openAiApiKey: process.env.OPENAI_API_KEY!,
        agentUserId: existingAgent.id,
    });

    realtimeClient.updateSession({
        instructions: existingAgent.instructions,
    });
  } else if (eventType === "call.session_participant_left") {
    const event = payload as CallSessionParticipantLeftEvent;
    const interviewId = event.call_cid.split(":")[1];

    if (!interviewId) {
      return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });
    }

    const call = streamVideo.video.call("default", interviewId);
    await call.end();

  } else if (eventType === "call.session_ended") {
    const event = payload as CallEndedEvent;
    const interviewId = event.call.custom?.interviewId;

    if (!interviewId) {
      return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });
    }

    await db
      .update(interviews)
      .set({
        status: "processing",
        endedAt: new Date(),
      })
      .where(and(eq(interviews.id, interviewId), eq(interviews.status, "active")));
  } else if (eventType === "call.transcription_ready") {
    const event = payload as CallTranscriptionReadyEvent;
    const interviewId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"

    const [updatedInterview] = await db
      .update(interviews)
      .set({
        transcriptUrl: event.call_transcription.url,
      })
      .where(eq(interviews.id, interviewId))
      .returning();

    if (!updatedInterview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 400 });
    }

    // Avoid duplicate processing events if already completed
    if (updatedInterview.status !== "completed") {
      await inngest.send({
        name: "interviews/processing",
        data: {
          interviewId: updatedInterview.id,
          transcriptUrl: updatedInterview.transcriptUrl,
        }
      })
    }
  } else if (eventType === "call.recording_ready") {
    const event = payload as CallRecordingReadyEvent;
    const interviewId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"

    await db
      .update(interviews)
      .set({
        recordingUrl: event.call_recording.url,
      })
      .where(eq(interviews.id, interviewId));
  } else if (eventType == "message.new") {
    const event = payload as MessageNewEvent;
    const userId = event.user?.id;
    const channelId = event.channel_id;
    const text = event.message?.text ?? "";

    if (!userId || !channelId || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [existingInterview] = await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.id, channelId), eq(interviews.status, "completed")));

    if (!existingInterview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.interviewId, existingInterview.id));

    if (!existingAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const channel = streamChat.channel("messaging", channelId);
    await channel.watch();

    const previousMessages: ChatCompletionMessageParam[] = channel.state.messages
      .slice(-5)
      .filter((msg) => !!msg.text && msg.text.trim() !== "")
      .map<ChatCompletionMessageParam>((message) => ({
        role: message.user?.id === existingAgent.id ? "assistant" : "user",
        content: message.text || "",
      }));

    const instructions = chatInstructions(
      existingInterview.summary || "",
      existingAgent.instructions || ""
    );

    const GPTResponse = await openai.chat.completions.create({
      messages: [
        { role: "system", content: instructions },
        ...previousMessages,
        { role: "user", content: text },
      ],
      model: "gemini-2.5-flash",
    });

    const GPTResponseText = GPTResponse.choices[0]?.message?.content;

    if (!GPTResponseText) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 400 }
      );
    }

    const avatarUrl = generateAvatarUri({
      seed: existingAgent.name,
      variant: "botttsNeutral",
    });

    await streamChat.upsertUser({
      id: existingAgent.id,
      name: existingAgent.name,
      image: avatarUrl,
    });

    await channel.sendMessage({
      text: GPTResponseText,
      user: {
        id: existingAgent.id,
        name: existingAgent.name,
        image: avatarUrl,
      },
    });
  }

  return NextResponse.json({ status: "ok" });
};