"use client";
import { ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export function ScoreCard({ score }: { score: number }) {
  return (
    <div className="mt-2">
      <ChartContainer
        id="overall-score"
        config={{ score: { label: "Score", color: "hsl(var(--chart-1))" } }}
        className="h-52"
      >
        <BarChart data={[{ label: "Overall", score }] }>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} />
          <Bar dataKey="score" fill="var(--color-score)" radius={6} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

