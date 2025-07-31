import { useRouter } from "next/navigation";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { InterviewForm } from "@/modules/interviews/components/interview-form";

interface NewInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewInterviewDialog = ({
  open,
  onOpenChange,
}: NewInterviewDialogProps) => {
  const router = useRouter();

  const handleSuccess = (interviewId?: string) => {
    onOpenChange(false);
    if (interviewId) {
      router.push(`/interviews/${interviewId}`);
    }
  };

  return (
    <ResponsiveDialog
      title="New Interview"
      description="Create a new interview"
      open={open}
      onOpenChange={onOpenChange}
    >
      <InterviewForm 
        onSuccess={handleSuccess} 
        onCancel={() => onOpenChange(false)} 
      />
    </ResponsiveDialog>
  );
};
