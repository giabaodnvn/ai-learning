import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: ReactNode;
  /** Optional node rendered opposite the title, e.g. a level badge. */
  right?: ReactNode;
}

/**
 * The title + one-line description block every app screen opens with. Eight
 * pages had their own copy of the same two elements, and the review screen
 * repeated it four times across its own loading / error / done / active states.
 */
export function PageHeader({ title, description, right }: Props) {
  const heading = (
    <div>
      <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
    </div>
  );

  if (!right) return heading;

  return (
    <div className="flex items-center justify-between gap-4">
      {heading}
      {right}
    </div>
  );
}
