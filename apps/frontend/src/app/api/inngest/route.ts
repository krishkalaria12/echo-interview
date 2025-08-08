import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { interviewsProcessing, interviewsProfileEnrich, interviewsDeepAnalysis } from "../../../inngest/functions";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    interviewsProcessing,
    interviewsProfileEnrich,
    interviewsDeepAnalysis,
  ],
});