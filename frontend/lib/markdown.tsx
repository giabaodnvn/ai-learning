export function parseLine(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|_.*?_)/g);
  if (parts.length === 1) return text;
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="font-semibold text-zinc-900">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-sm text-indigo-700">{p.slice(1, -1)}</code>;
    if (p.startsWith("_") && p.endsWith("_"))
      return <em key={i} className="italic text-zinc-500">{p.slice(1, -1)}</em>;
    return p;
  });
}

export function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (/^## /.test(line))
      return <h3 key={i} className="font-bold text-zinc-900 text-base mt-5 mb-2 first:mt-0">{parseLine(line.replace(/^## /, ""))}</h3>;
    if (/^### /.test(line))
      return <h4 key={i} className="font-semibold text-zinc-800 mt-3 mb-1">{parseLine(line.replace(/^### /, ""))}</h4>;
    if (/^(\d+)\. /.test(line))
      return <li key={i} className="ml-5 list-decimal text-zinc-700 leading-relaxed">{parseLine(line.replace(/^\d+\. /, ""))}</li>;
    if (/^- /.test(line))
      return <li key={i} className="ml-5 list-disc text-zinc-700 leading-relaxed">{parseLine(line.slice(2))}</li>;
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    return <p key={i} className="text-zinc-700 leading-relaxed">{parseLine(line)}</p>;
  });
}
