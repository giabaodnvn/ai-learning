interface Props {
  /** Sentence with `___` marking each blank. */
  text: string;
}

/**
 * A fill-in-the-blank sentence, with every `___` drawn as an underline.
 * The single exercise and the 10-question practice set each had a private
 * `renderSentence` with an identical body, inside an identical card wrapper.
 */
export function BlankSentence({ text }: Props) {
  const parts = text.split("___");

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-lg text-zinc-800 leading-relaxed">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="inline-block min-w-[60px] border-b-2 border-zinc-400 mx-1 align-bottom" />
            )}
          </span>
        ))}
      </p>
    </div>
  );
}
