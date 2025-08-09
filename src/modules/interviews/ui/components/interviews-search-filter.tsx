import { SearchIcon } from "lucide-react";

import { useInterviewsFilters } from "@/modules/interviews/hooks/use-interviews-filter";
import { Input } from "@/components/ui/input";

export const InterviewsSearchFilter = () => {
  const [filters, setFilters] = useInterviewsFilters();

  return (
    <div className="flex items-center gap-x-2">
      <div className="relative flex-1 max-w-sm">
        <Input
            placeholder="Filter by name"
            value={filters.search ?? ""}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-[200px] pl-7 h-9 bg-white"
        />
        <SearchIcon className="absolute size-4 text-muted-foreground left-2 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
};
