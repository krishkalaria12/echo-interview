import { createLoader, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server";
import { DEFAULT_PAGE } from "@/lib/constants";
import { InterviewStatus } from "./types";

export const filtersSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({ clearOnDefault: true }),
  status: parseAsStringEnum(Object.values(InterviewStatus)),
};

export const loadSearchParams = createLoader(filtersSearchParams);