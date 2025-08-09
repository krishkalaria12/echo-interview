import { interviewsRouter } from '@/modules/interviews/server/procedures';
import { createTRPCRouter } from '../init';

export const appRouter = createTRPCRouter({
  interviews: interviewsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;