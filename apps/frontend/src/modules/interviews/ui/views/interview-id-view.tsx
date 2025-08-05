
"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { InterviewIdViewHeader } from "@/modules/interviews/ui/components/interview-id-view-header";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { UpdateInterviewDialog } from "../components/update-interview-dialog";

interface Props {
  interviewId: string;
}

export const InterviewIdView = ({ interviewId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const { ConfirmationDialog: RemoveConfirmationDialog, confirm } = useConfirm(
    "Remove Interview",
    "Are you sure you want to remove this interview?",
    "destructive"
  );
  
  const { data } = useSuspenseQuery(
    trpc.interviews.getOne.queryOptions({ id: interviewId }),
  );

  const removeInterview = useMutation(
    trpc.interviews.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.interviews.getMany.queryOptions({}));

        router.push("/interviews");
      },
    })
  )

  const handleRemoveInterview = async () => {
    const ok = await confirm();

    if (!ok) return;

    removeInterview.mutate({ id: interviewId });
  }

  return (
    <>
      <RemoveConfirmationDialog />
      <UpdateInterviewDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        initialData={data}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <InterviewIdViewHeader
          interviewId={interviewId}
          interviewName={data.name}
          onEdit={() => setUpdateDialogOpen(true)}
          onRemove={handleRemoveInterview}
        />
      </div>
    </>
  );
};

export const InterviewIdViewLoading = () => {
    return (
      <LoadingState
        title="Loading interview..."
        description="Please wait while we load the interview..."
      />
    );
  };
  
  export const InterviewIdViewError = () => {
    return (
      <ErrorState
        title="Error loading interview..."
        description="Please try again later."
      />
    );
  };