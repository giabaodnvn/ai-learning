"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface UseGeneratedContentOptions<T> {
  /** react-query cache key prefix; the level is appended to it. */
  resource: string;
  /** Collection endpoint, e.g. "/api/v1/reading_passages". `/generate` is appended for creates. */
  path: string;
  level: string;
  /** Skip the list request while another view is on screen. */
  listEnabled?: boolean;
  /** Called with the freshly generated item after it is prepended to the cache. */
  onGenerated: (item: T) => void;
  listErrorMessage: string;
  generateErrorMessage: string;
}

export interface UseGeneratedContentResult<T> {
  items: T[];
  loading: boolean;
  listError: string | null;
  generate: (topic: string) => void;
  generating: boolean;
  generateError: string | null;
}

/**
 * List + generate for the AI-generated content endpoints (reading passages,
 * listening exercises), which share the same shape: a level-keyed collection
 * plus a `POST …/generate` that prepends its result to that collection.
 *
 * Keying the query on the level is what stops a slow earlier response from
 * overwriting a newer one.
 */
export function useGeneratedContent<T>({
  resource,
  path,
  level,
  listEnabled = true,
  onGenerated,
  listErrorMessage,
  generateErrorMessage,
}: UseGeneratedContentOptions<T>): UseGeneratedContentResult<T> {
  const queryClient = useQueryClient();
  const queryKey = [resource, level];

  const { data = [], isLoading, isError } = useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      const res = await api.get(path, { params: { level } });
      return res.data;
    },
    enabled: listEnabled,
  });

  const generateMutation = useMutation({
    mutationFn: async (topic: string) => {
      const res = await api.post(`${path}/generate`, { jlpt_level: level, topic });
      return res.data as T;
    },
    onSuccess: (item) => {
      queryClient.setQueryData<T[]>(queryKey, (old) => [item, ...(old ?? [])]);
      onGenerated(item);
    },
  });

  return {
    items: data,
    loading: isLoading,
    listError: isError ? listErrorMessage : null,
    generate: generateMutation.mutate,
    generating: generateMutation.isPending,
    generateError: generateMutation.isError ? generateErrorMessage : null,
  };
}
