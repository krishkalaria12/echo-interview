import { and, count, desc, eq, getTableColumns, ilike } from "drizzle-orm";
import { z } from "zod";

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/lib/constants";
import { db } from "@/db";
import { interviews } from "@/db/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const interviewsRouter = createTRPCRouter({
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
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, search } = input;
            const offset = (page - 1) * pageSize;
            
            const data = await db
                .select({
                    ...getTableColumns(interviews)
                })
                .from(interviews)
                .where(
                    and(
                        eq(interviews.userId, ctx.auth.user.id),
                        search ? ilike(interviews.name, `%${search}%`) : undefined
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
                        search ? ilike(interviews.name, `%${search}%`) : undefined
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