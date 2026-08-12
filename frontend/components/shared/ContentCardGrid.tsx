import type { ReactNode } from "react";
import { CardSkeletonGrid } from "@/components/shared/CardSkeletonGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

interface Props<T> {
  items: T[];
  loading: boolean;
  /** List-level failure message; null when the request succeeded. */
  error?: string | null;
  emptyTitle: ReactNode;
  emptySubtitle?: ReactNode;
  /** Shimmer bars per skeleton card while loading. */
  skeletonLines?: number;
  renderItem: (item: T) => ReactNode;
}

/**
 * The loading → error → empty → two-column grid chain the reading and
 * listening lists both walk through. Written out twice before, which is how
 * one of them ended up with a four-bar skeleton and the other a three-bar one
 * for the same card shape.
 */
export function ContentCardGrid<T>({
  items,
  loading,
  error,
  emptyTitle,
  emptySubtitle,
  skeletonLines,
  renderItem,
}: Props<T>) {
  return (
    <>
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {loading ? (
        <CardSkeletonGrid lines={skeletonLines} />
      ) : items.length === 0 ? (
        <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{items.map(renderItem)}</div>
      )}
    </>
  );
}
