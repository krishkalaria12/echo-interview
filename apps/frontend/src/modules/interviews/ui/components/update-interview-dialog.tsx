import { ResponsiveDialog } from "@/components/responsive-dialog";
import { InterviewForm } from "@/modules/interviews/ui/components/interview-form";
import { InterviewGetOne } from "@/modules/interviews/types";

interface UpdateInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: InterviewGetOne;
}

export const UpdateInterviewDialog = ({
  open,
  onOpenChange,
  initialData,
}: UpdateInterviewDialogProps) => {
  return (
    <ResponsiveDialog
      title="Update Interview"
      description="Update the interview"
      open={open}
      onOpenChange={onOpenChange}
    >
      <InterviewForm 
        onSuccess={() => {
          onOpenChange(false);
        }} 
        onCancel={() => onOpenChange(false)} 
        initialValues={initialData}
      />
    </ResponsiveDialog>
  );
};
