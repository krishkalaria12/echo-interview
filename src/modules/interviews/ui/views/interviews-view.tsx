"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useTRPC } from "@/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { DataTable } from "@/components/data-table";
import { DataPagination } from "@/components/data-pagination";
import { EmptyState } from "@/components/empty-state";
import { columns } from "@/modules/interviews/ui/components/columns";
import { useInterviewsFilters } from "@/modules/interviews/hooks/use-interviews-filter";

export const InterviewsView = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const [filters, setFilters] = useInterviewsFilters();

  const { data } = useSuspenseQuery(
    trpc.interviews.getMany.queryOptions({
      ...filters,
    })
  );

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <DataTable
        columns={columns}
        data={data?.items}
        onRowClick={(row) => router.push(`/interviews/${row.id}`)}
      />
      <DataPagination
        page={filters.page}
        totalPages={data?.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />
      {data?.items?.length === 0 && (
        <EmptyState
          title="Create your first interview"
          description="Create an interview to start recording and analyzing your conversations. Each interview will be saved and can be reviewed later."
        />
      )}
    </div>
  );
};

export const InterviewsViewLoading = () => {
  return (
    <LoadingState
      title="Loading interviews..."
      description="Please wait while we load the interviews..."
    />
  );
};

export const InterviewsViewError = () => {
  return (
    <ErrorState
      title="Error loading interviews..."
      description="Please try again later."
    />
  );
};
