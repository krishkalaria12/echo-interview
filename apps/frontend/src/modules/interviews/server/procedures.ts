import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { z } from "zod";

import { interviewInsertSchema, interviewUpdateSchema } from "@/modules/interviews/schemas";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/lib/constants";
import { db } from "@/db";
import { agents, interviews } from "@/db/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { InterviewStatus } from "@/modules/interviews/types";
import { generateAvatarUri } from "@/lib/avatar";
import { streamVideo } from "@/lib/stream-video";
import generateInterviewSystemPrompt from "@/lib/system-prompt";

export const interviewsRouter = createTRPCRouter({
    generateToken: protectedProcedure.mutation(async ({ ctx }) => {
        await streamVideo.upsertUsers([
            {
                id: ctx.auth.user.id,
                name: ctx.auth.user.name,
                role: "admin",
                image: ctx.auth.user.image ?? generateAvatarUri({ seed: ctx.auth.user.name, variant: "initials" }),
            },
        ]);

        const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        const issuedAt = Math.floor(Date.now() / 1000) - 60; // issued at

        const token = streamVideo.generateUserToken({
            user_id: ctx.auth.user.id,
            exp: expirationTime,
            iat: issuedAt,
        });

        return token;
    }),
    remove: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const [removedInterview] = await db
                .delete(interviews)
                .where(
                    and(
                        eq(interviews.id, input.id),
                        eq(interviews.userId, ctx.auth.user.id)
                    )
                )
                .returning();
            
            if (!removedInterview) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Interview not found" });
            }

            return removedInterview;
        }),
    update: protectedProcedure
        .input(interviewUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const [interview] = await db
                .update(interviews)
                .set(input)
                .where(
                    and(
                        eq(interviews.id, input.id),
                        eq(interviews.userId, ctx.auth.user.id)
                    )
                )
                .returning();
            
            if (!interview) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Interview not found" });
            }

            return interview;
        }),
    create: protectedProcedure
        .input(interviewInsertSchema)
        .mutation(async ({ ctx, input }) => {
            const [interview] = await db
                .insert(interviews)
                .values({
                ...input,
                userId: ctx.auth.user.id,
            }).returning();

            // Create stream call with proper custom fields
            const call = streamVideo.video.call("default", interview.id);
            await call.create({
                data: {
                    created_by_id: ctx.auth.user.id,
                    custom: {
                        interviewId: interview.id,
                        interviewName: interview.name,
                    },
                    settings_override: {
                        transcription: {
                            language: "en",
                            mode: "auto-on",
                            closed_caption_mode: "auto-on",
                        },
                        recording: {
                            mode: "auto-on",
                            quality: "1080p"
                        }
                    }
                }
            });

            // create the agent for the call
            const [createdAgent] = await db.insert(agents).values({
                name: `Interview Agent for ${interview.name}`,
                userId: ctx.auth.user.id,
                interviewId: interview.id,
                instructions: generateInterviewSystemPrompt({
                    interview,
                    candidateName: interview.name,
                    interviewerName: interview.name,
                }),
            }).returning();

            // add the agent to the call (as Stream user)
            await streamVideo.upsertUsers([
                {
                    id: createdAgent.id,
                    name: createdAgent.name,
                    role: "user",
                    image: generateAvatarUri({ seed: createdAgent.name, variant: "botttsNeutral" }),
                }
            ])

            return interview;
        }),
    getOne: protectedProcedure
        .input(z.object({ id: z.string()}))
        .query(async ({ ctx, input }) => {
            const [existingInterview] = await db
                .select({
                    ...getTableColumns(interviews)
                })
                .from(interviews)
                .where(
                    and(
                        eq(interviews.id, input.id),
                        eq(interviews.userId, ctx.auth.user.id)
                    )
                )
            if (!existingInterview) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Interview not found" });
            }

            return existingInterview;
        }),
    getMany: protectedProcedure
        .input(
            z.object({
                page: z.number().default(DEFAULT_PAGE),
                pageSize: z
                    .number()
                    .min(MIN_PAGE_SIZE)
                    .max(MAX_PAGE_SIZE)
                    .default(DEFAULT_PAGE_SIZE),
                search: z.string().nullish(),
                status: z.enum(Object.values(InterviewStatus)).nullish(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, search, status } = input;
            const offset = (page - 1) * pageSize;
            
            const data = await db
                .select({
                    ...getTableColumns(interviews),
                    duration: sql<number>`EXTRACT(EPOCH FROM ("ended_at" - "started_at"))`.as("duration")
                })
                .from(interviews)
                .where(
                    and(
                        eq(interviews.userId, ctx.auth.user.id),
                        search ? ilike(interviews.name, `%${search}%`) : undefined,
                        status ? eq(interviews.status, status) : undefined
                    )
                )
                .orderBy(desc(interviews.createdAt))
                .limit(pageSize)
                .offset(offset)

            
            const [total] = await db
                .select({ count: count() })
                .from(interviews)
                .where(
                    and(
                        eq(interviews.userId, ctx.auth.user.id),
                        search ? ilike(interviews.name, `%${search}%`) : undefined,
                        status ? eq(interviews.status, status) : undefined
                    )
                )
            
            const totalPages = Math.ceil(total.count / pageSize);

            return {
                items: data,
                totalPages,
                total: total.count,
            }
        })
});