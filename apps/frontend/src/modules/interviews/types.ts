import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";

export type InterviewGetOne = inferRouterOutputs<AppRouter>["interviews"]["getOne"];
export type InterviewGetMany = inferRouterOutputs<AppRouter>["interviews"]["getMany"]["items"];
export type { InterviewStatus } from "@/db/schemas/interview.schema";