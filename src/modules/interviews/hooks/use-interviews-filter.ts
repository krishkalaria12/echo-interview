import { parseAsInteger, parseAsString, useQueryStates, parseAsStringEnum } from "nuqs";

import { DEFAULT_PAGE } from "@/lib/constants";
import { InterviewStatus } from "../types";

export const useInterviewsFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({ clearOnDefault: true }),
    status: parseAsStringEnum(Object.values(InterviewStatus)),
  });
};