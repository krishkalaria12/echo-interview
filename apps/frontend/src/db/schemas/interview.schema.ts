import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth.schema";

export const interviewStatus = pgEnum("interview_status", [
  "upcoming",
  "active", 
  "completed",
  "processing",
  "cancelled"
]);

export const interviews = pgTable("interviews", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  status: interviewStatus("status").notNull().default("upcoming"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  transcriptUrl: text("transcript_url"),
  recordingUrl: text("recording_url"),
  summary: text("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
