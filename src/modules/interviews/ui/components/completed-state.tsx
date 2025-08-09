import {
  SparklesIcon,
  FileTextIcon,
  BookOpenTextIcon,
  FileVideoIcon,
  ClockFadingIcon,
} from "lucide-react";
import Markdown from "react-markdown";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SummaryHeader } from "./summary-header";
import { InterviewGetOne } from "../../types";
import { ScoreCard } from "./score-card";
import { CompetencyRadar } from "./competency-radar";
import { InterviewTimeline } from "./timeline";
import { InterviewAnalysis, InterviewAnalysisSchema } from "@/modules/interviews/analysis/types";
import { ListSection } from "./list-section";
import { formatDuration } from "@/lib/utils";
import { Transcript } from "./transcript";
import { ChatProvider } from "./chat-provider";

type WithOptionalAnalysis = { analysis?: string | null };

interface Props {
  data: InterviewGetOne & WithOptionalAnalysis;
}

export const CompletedState = ({ data }: Props) => {
  let analysis: InterviewAnalysis | null = null;
  try {
    const parsed = data.analysis ? JSON.parse(data.analysis) : null;
    const safe = parsed ? InterviewAnalysisSchema.safeParse(parsed) : null;
    analysis = safe?.success ? safe.data : null;
  } catch {}
  // Calculate duration from start and end times
  const duration = data.startedAt && data.endedAt 
    ? Math.floor((new Date(data.endedAt).getTime() - new Date(data.startedAt).getTime()) / 1000)
    : null;

  return (
    <div className="flex flex-col gap-y-4">
      <Tabs defaultValue="summary">
        <ScrollArea className="w-full">
          <TabsList className="p-0 bg-background justify-start rounded-none h-13">
            <TabsTrigger
              value="summary"
              className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
            >
              <BookOpenTextIcon />
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="transcript"
              className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
            >
              <FileTextIcon />
              Transcript
            </TabsTrigger>
            <TabsTrigger
              value="recording"
              className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
            >
              <FileVideoIcon />
              Recording
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
            >
              <SparklesIcon />
              Ask AI
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="summary">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="px-5 py-5 gap-y-5 flex flex-col col-span-5">
              <SummaryHeader title={data.name} duration={duration ? formatDuration(duration) : null} />
              
              <div className="flex gap-x-2 items-center">
                <SparklesIcon className="size-4" />
                <p>General summary</p>
              </div>

              {!duration && (
                <Badge variant="outline" className="w-max">No duration</Badge>
              )}

              {typeof data.overallScore === "number" && <ScoreCard score={data.overallScore} />}

              {data.summary && (
                <div className="prose prose-sm max-w-none">
                  <Markdown
                    components={{
                      h1: (props) => <h1 className="text-2xl font-medium mb-6" {...props} />,
                      h2: (props) => <h2 className="text-xl font-medium mb-6" {...props} />,
                      h3: (props) => <h3 className="text-lg font-medium mb-6" {...props} />,
                      h4: (props) => <h4 className="text-base font-medium mb-6" {...props} />,
                      p: (props) => <p className="mb-6 leading-relaxed" {...props} />,
                      ul: (props) => <ul className="list-disc list-inside mb-6" {...props} />,
                      ol: (props) => <ol className="list-decimal list-inside mb-6" {...props} />,
                      li: (props) => <li className="mb-1" {...props} />,
                      strong: (props) => <strong className="font-semibold" {...props} />,
                      code: (props) => <code className="bg-gray-100 px-1 py-0.5 rounded" {...props} />,
                      blockquote: (props) => <blockquote className="border-l-4 pl-4 italic my-4" {...props} />,
                    }}
                  >
                    {data.summary}
                  </Markdown>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <ListSection title="Strengths" items={data.strengths} positive />
                <ListSection title="Improvements" items={data.improvements} positive={false} />
              </div>
              {analysis?.competencyScores && analysis?.competencyScores?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Competency Breakdown</h3>
                  <CompetencyRadar data={analysis.competencyScores} />
                </div>
              )}
              {analysis?.timeline && analysis?.timeline?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Interview Timeline</h3>
                  <InterviewTimeline points={analysis.timeline} />
                </div>
              )}
              {data.feedback && (
                <div>
                  <h3 className="font-medium mb-2">Detailed Feedback</h3>
                  <Markdown>{data.feedback}</Markdown>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transcript">
          <Transcript interviewId={data.id} />
        </TabsContent>

        <TabsContent value="recording">
          <div className="bg-white rounded-lg border px-4 py-5">
            {data.recordingUrl ? (
              <video
                src={data.recordingUrl}
                className="w-full rounded-lg"
                controls
              />
            ) : (
              <p className="text-muted-foreground">No recording available</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <ChatProvider interviewId={data.id} interviewName={data.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};