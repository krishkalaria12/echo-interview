"use client";

import {
  CircleXIcon,
  CircleCheckIcon,
  ClockArrowUpIcon,
  VideoIcon,
  LoaderIcon,
} from "lucide-react";

import { CommandSelect } from "@/components/command-select";
import { useInterviewsFilters } from "@/modules/interviews/hooks/use-interviews-filter";
import { InterviewStatus } from "@/modules/interviews/types";

const options = [
  {
    id: InterviewStatus.Upcoming,
    value: InterviewStatus.Upcoming,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <ClockArrowUpIcon />
        {InterviewStatus.Upcoming}
      </div>
    ),
  },
  {
    id: InterviewStatus.Completed,
    value: InterviewStatus.Completed,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleCheckIcon />
        {InterviewStatus.Completed}
      </div>
    ),
  },
  {
    id: InterviewStatus.Active,
    value: InterviewStatus.Active,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <VideoIcon />
        {InterviewStatus.Active}
      </div>
    ),
  },
  {
    id: InterviewStatus.Processing,
    value: InterviewStatus.Processing,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <LoaderIcon />
        {InterviewStatus.Processing}
      </div>
    ),
  },
  {
    id: InterviewStatus.Cancelled,
    value: InterviewStatus.Cancelled,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleXIcon />
        {InterviewStatus.Cancelled}
      </div>
    ),
  },
];

export const StatusFilter = () => {
  const [filters, setFilters] = useInterviewsFilters();

  return (
    <CommandSelect
      placeholder="Status"
      className="h-9"
      options={options}
      onSelect={(value) => setFilters({ status: value as InterviewStatus })}
      value={filters.status ?? ""}
    />
  );
};
