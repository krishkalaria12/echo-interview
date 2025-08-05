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
    id: InterviewStatus.UPCOMING,
    value: InterviewStatus.UPCOMING,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <ClockArrowUpIcon />
        {InterviewStatus.UPCOMING}
      </div>
    ),
  },
  {
    id: InterviewStatus.COMPLETED,
    value: InterviewStatus.COMPLETED,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleCheckIcon />
        {InterviewStatus.COMPLETED}
      </div>
    ),
  },
  {
    id: InterviewStatus.ACTIVE,
    value: InterviewStatus.ACTIVE,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <VideoIcon />
        {InterviewStatus.ACTIVE}
      </div>
    ),
  },
  {
    id: InterviewStatus.PROCESSING,
    value: InterviewStatus.PROCESSING,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <LoaderIcon />
        {InterviewStatus.PROCESSING}
      </div>
    ),
  },
  {
    id: InterviewStatus.CANCELLED,
    value: InterviewStatus.CANCELLED,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleXIcon />
        {InterviewStatus.CANCELLED}
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
