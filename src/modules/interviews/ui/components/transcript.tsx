"use client";

import { useState } from "react";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import Highlighter from "react-highlight-words";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarUri } from "@/lib/avatar";

interface Props {
  interviewId: string;
}

type TranscriptItem = {
  speaker_id: string;
  type: string;
  text: string;
  start_ts: number;
  stop_ts: number;
  user?: {
    name: string;
    image?: string | null;
  };
};

export const Transcript = ({ interviewId }: Props) => {
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.interviews.getTranscript.queryOptions({ id: interviewId })
  );

  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = (data ?? []).filter((item: TranscriptItem) =>
    item.text.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
      <p className="text-sm font-medium">Transcript</p>

      <div className="relative">
        <Input
          placeholder="Search Transcript"
          className="pl-7 h-9 w-[240px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      </div>

      <ScrollArea className="h-[420px]">
        <div className="flex flex-col gap-y-4">
          {filteredData.map((item: TranscriptItem) => {
            const avatarSrc =
              item.user?.image ??
              generateAvatarUri({
                seed: item.user?.name ?? "Unknown",
                variant: "initials",
              });

            return (
              <div
                key={`${item.start_ts}-${item.speaker_id}`}
                className="flex flex-col gap-y-2 hover:bg-muted p-4 rounded-md border"
              >
                <div className="flex gap-x-2 items-center">
                  <Avatar className="size-6">
                    <AvatarImage src={avatarSrc} alt="User Avatar" />
                  </Avatar>
                  <p className="text-sm font-medium">{item.user?.name ?? "Unknown"}</p>
                  <p className="text-sm text-blue-500 font-medium">
                    {format(new Date(0, 0, 0, 0, 0, 0, item.start_ts), "mm:ss")}
                  </p>
                </div>
                <Highlighter
                  className="text-sm text-neutral-700"
                  highlightClassName="bg-yellow-200"
                  searchWords={[searchQuery]}
                  autoEscape={true}
                  textToHighlight={item.text}
                />
              </div>
            );
          })}
          {filteredData.length === 0 && (
            <p className="text-sm text-muted-foreground">No transcript items.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};