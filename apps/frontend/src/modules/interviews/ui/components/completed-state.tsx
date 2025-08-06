import { EmptyState } from "@/components/empty-state";

export const CompletedState = () => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
        <EmptyState
            image="/completed.svg"
            title="Interview Completed"
            description="Your interview has been completed. You can review the transcript and feedback."
        />
    </div>
  );
};