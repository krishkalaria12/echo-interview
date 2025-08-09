"use client";
import { ChartContainer } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

type TimelinePoint = { t: number; sentiment?: number; speakingRatio?: number };

export function InterviewTimeline({ points }: { points: TimelinePoint[] }) {
  const data = points?.map((p) => ({
    t: p.t,
    sentiment: p.sentiment ?? 0,
    speakingRatio: p.speakingRatio ?? 0,
  })) || [];
  return (
    <ChartContainer id="interview-timeline" config={{ sentiment: { label: "Sentiment", color: "hsl(var(--chart-3))" }, speakingRatio: { label: "Speaking", color: "hsl(var(--chart-4))" } }} className="h-72">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="sentiment" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-sentiment)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--color-sentiment)" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="speakingRatio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-speakingRatio)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--color-speakingRatio)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="t" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="sentiment" stroke="var(--color-sentiment)" fillOpacity={1} fill="url(#sentiment)" />
        <Area type="monotone" dataKey="speakingRatio" stroke="var(--color-speakingRatio)" fillOpacity={1} fill="url(#speakingRatio)" />
      </AreaChart>
    </ChartContainer>
  );
}

