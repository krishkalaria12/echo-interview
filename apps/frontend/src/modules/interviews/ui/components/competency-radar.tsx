"use client";
import { ChartContainer } from "@/components/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

type CompetencyScores = Array<{ name: string; score: number }>;

export function CompetencyRadar({ data }: { data: CompetencyScores }) {
  const chartData = data?.map((d) => ({ subject: d.name, A: d.score })) || [];
  return (
    <ChartContainer id="competency-radar" config={{ A: { label: "Score", color: "hsl(var(--chart-2))" } }} className="h-80">
      <RadarChart outerRadius={110} data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <Radar name="Score" dataKey="A" stroke="var(--color-A)" fill="var(--color-A)" fillOpacity={0.5} />
      </RadarChart>
    </ChartContainer>
  );
}

