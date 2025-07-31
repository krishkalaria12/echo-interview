import { pgTable, pgEnum, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth.schema";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const interviewStatus = pgEnum("interview_status", [
  "upcoming",
  "active", 
  "completed",
  "processing",
  "cancelled"
]);

export const experienceLevel = pgEnum("experience_level", [
  "junior", 
  "mid",
  "senior"
]);

export const interviewType = pgEnum("interview_type", [
  "technical",
  "behavioral", 
  "system_design",
  "mixed"
]);

export const recommendation = pgEnum("recommendation", [
  "hire",
  "maybe", 
  "no"
]);

// Export enum types
export type InterviewStatus = typeof interviewStatus.enumValues[number];
export type ExperienceLevel = typeof experienceLevel.enumValues[number];
export type InterviewType = typeof interviewType.enumValues[number];
export type Recommendation = typeof recommendation.enumValues[number];

export const interviews = pgTable("interviews", {
  // Basic Info
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  // Interview Configuration
  position: text("position").notNull(),
  jobDescription: text("job_description"),
  experienceLevel: experienceLevel("experience_level").notNull(),
  interviewType: interviewType("interview_type").notNull().default("technical"),
  scheduledFor: timestamp("scheduled_for"),
  
  // Candidate Information
  resumeUrl: text("resume_url").notNull(),
  portfolioUrl: text("portfolio_url"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  
  // Interview Status & Timing
  status: interviewStatus("status").notNull().default("upcoming"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  
  // Interview Recordings
  transcriptUrl: text("transcript_url"),
  recordingUrl: text("recording_url"),
  
  // Results (populated after interview)
  overallScore: integer("overall_score"), // 1-100
  feedback: text("feedback"), // AI-generated detailed feedback
  strengths: text("strengths"), // AI-generated strengths text
  improvements: text("improvements"), // AI-generated areas for improvement
  recommendation: recommendation("recommendation"),
  summary: text("summary"), // Brief summary of the interview
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  // Indexes for better query performance
  index("interviews_user_id_idx").on(table.userId),
  index("interviews_status_idx").on(table.status),
  index("interviews_scheduled_for_idx").on(table.scheduledFor),
  index("interviews_created_at_idx").on(table.createdAt),
  index("interviews_position_idx").on(table.position),
  index("interviews_experience_level_idx").on(table.experienceLevel),
  // Composite indexes for common queries
  index("interviews_user_status_idx").on(table.userId, table.status),
  index("interviews_user_created_idx").on(table.userId, table.createdAt),
]);

// Export table types
export type Interview = InferSelectModel<typeof interviews>;
export type NewInterview = InferInsertModel<typeof interviews>;