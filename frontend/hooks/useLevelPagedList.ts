"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JlptLevel } from "@/types/quiz";

export interface PagedMeta {
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

/** The `{ data, meta }` envelope every paginated list endpoint returns. */
export interface PagedResponse<T> {
  data: T[];
  meta: PagedMeta;
}

interface Options {
  /** react-query cache key prefix; level, page and `params` are appended. */
  resource: string;
  /** Collection endpoint, e.g. "/api/v1/kanjis". */
  path: string;
  perPage: number;
  /** Extra query params (e.g. a committed search term). Part of the cache key. */
  params?: Record<string, string>;
}

/**
 * Level + page state for a paginated list endpoint.
 *
 * The vocabulary, kanji and grammar grids each carried their own copy of this:
 * two `useState`s, a `useQuery` with `keepPreviousData`, and a level handler
 * that has to reset the page — one of the three had drifted and left the user
 * on page 4 of a level with two pages.
 */
export function useLevelPagedList<T>({ resource, path, perPage, params = {} }: Options) {
  const [level, setLevel] = useState<JlptLevel>("n5");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<PagedResponse<T>>({
    queryKey: [resource, level, page, params],
    queryFn: async () => {
      const res = await api.get(path, { params: { level, page, per_page: perPage, ...params } });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  return {
    level,
    page,
    setPage,
    /** Switch level and go back to the first page of it. */
    changeLevel: (next: JlptLevel) => {
      setLevel(next);
      setPage(1);
    },
    /** Reset to the first page — for filters the caller owns, e.g. search. */
    resetPage: () => setPage(1),
    data,
    isLoading,
    isError,
  };
}
