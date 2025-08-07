import { relations } from "drizzle-orm";
import { agents } from "./agent.schema";
import { interviews } from "./interview.schema";
import { user } from "./auth.schema";

// User relations
export const userRelations = relations(user, ({ many }) => ({
  agents: many(agents),
  interviews: many(interviews),
}));

// Agent relations
export const agentRelations = relations(agents, ({ one, many }) => ({
  user: one(user, {
    fields: [agents.userId],
    references: [user.id],
  }),
  interview: one(interviews, {
    fields: [agents.interviewId],
    references: [interviews.id],
  }),
}));

// Interview relations
export const interviewRelations = relations(interviews, ({ one }) => ({
  user: one(user, {
    fields: [interviews.userId],
    references: [user.id],
  }),
  agent: one(agents, {
    fields: [interviews.id],
    references: [agents.interviewId],
  }),
}));