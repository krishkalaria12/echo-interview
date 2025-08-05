import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";

export type InterviewGetOne = inferRouterOutputs<AppRouter>["interviews"]["getOne"];
export type InterviewGetMany = inferRouterOutputs<AppRouter>["interviews"]["getMany"]["items"];
export enum InterviewStatus {
    UPCOMING = "upcoming",
    ACTIVE = "active",
    COMPLETED = "completed",
    PROCESSING = "processing",
    CANCELLED = "cancelled",
}