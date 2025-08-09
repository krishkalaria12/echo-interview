"use client";

import { authClient } from "@/lib/auth-client";
import { LoadingState } from "@/components/loading-state";
import { ChatUI } from "./chat-ui";

interface Props {
  interviewId: string;
  interviewName: string;
}

export const ChatProvider = ({ interviewId, interviewName }: Props) => {
  const { data, isPending } = authClient.useSession();

  if (isPending || !data?.user) {
    return (
      <LoadingState
        title="Loading..."
        description="Please wait while we load the chat"
      />
    );
  }

  return (
    <ChatUI
      interviewId={interviewId}
      interviewName={interviewName}
      userId={data.user.id}
      userName={data.user.name}
      userImage={data.user.image || ""}
    />
  );
};