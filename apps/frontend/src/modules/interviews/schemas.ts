import { z } from "zod";
import { 
  InterviewStatus, 
  ExperienceLevel, 
  InterviewType, 
  Recommendation 
} from "@/db/schemas/interview.schema";

// Zod Validation Schemas
export const interviewInsertSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    position: z.string().min(1, { message: "Position is required" }),
    jobDescription: z.string().optional(),
    experienceLevel: z.enum(["junior", "mid", "senior"] as const satisfies readonly ExperienceLevel[]),
    interviewType: z.enum(["technical", "behavioral", "system_design", "mixed"] as const satisfies readonly InterviewType[]).default("technical"),
    duration: z.number().int().min(15).max(180).default(30), // 15 mins to 3 hours
    scheduledFor: z.date().optional(),
    
    // Candidate Information
    resumeUrl: z.string().url({ message: "Valid resume URL is required" }),
    portfolioUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    linkedinUrl: z.string().url().optional(),
  });
  
export const interviewUpdateSchema = interviewInsertSchema
    .extend({
      id: z.string().min(1, { message: "ID is required" }),
      // Make all fields optional for updates
      name: z.string().min(1, { message: "Name is required" }).optional(),
      position: z.string().min(1, { message: "Position is required" }).optional(),
      experienceLevel: z.enum(["junior", "mid", "senior"] as const satisfies readonly ExperienceLevel[]).optional(),
      interviewType: z.enum(["technical", "behavioral", "system_design", "mixed"] as const satisfies readonly InterviewType[]).optional(),
      duration: z.number().int().min(15).max(180).optional(),
      resumeUrl: z.string().url().optional(),
      
      // Additional fields for updates
      status: z.enum(["upcoming", "active", "completed", "processing", "cancelled"] as const satisfies readonly InterviewStatus[]).optional(),
      startedAt: z.date().optional(),
      endedAt: z.date().optional(),
      
      // Recording URLs
      transcriptUrl: z.string().url().optional(),
      recordingUrl: z.string().url().optional(),
      
      // Results
      overallScore: z.number().int().min(1).max(100).optional(),
      feedback: z.string().optional(),
      strengths: z.string().optional(),
      improvements: z.string().optional(),
      recommendation: z.enum(["hire", "maybe", "no"] as const satisfies readonly Recommendation[]).optional(),
      summary: z.string().optional(),
    });
  
// Separate schema for just the results update (after interview completion)
export const interviewResultsSchema = z.object({
    id: z.string().min(1, { message: "ID is required" }),
    overallScore: z.number().int().min(1).max(100),
    feedback: z.string().min(1, { message: "Feedback is required" }),
    strengths: z.string().min(1, { message: "Strengths are required" }),
    improvements: z.string().min(1, { message: "Improvements are required" }),
    recommendation: z.enum(["hire", "maybe", "no"] as const satisfies readonly Recommendation[]),
    summary: z.string().min(1, { message: "Summary is required" }),
    transcriptUrl: z.string().url().optional(),
    recordingUrl: z.string().url().optional(),
  });