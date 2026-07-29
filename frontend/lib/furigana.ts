// Parsing the ruby-annotated HTML the passage generator produces into typed
// segments the reader can render and tap on.
//
// Pure string work with no React in it, so it can be reasoned about (and
// tested) apart from the component that draws the result.

export interface RubySegment {
  type: "ruby";
  word: string;
  reading: string;
  /** Offset of this segment's text within `plainText`. */
  plainStart: number;
}

export interface TextSegment {
  type: "text";
  text: string;
  plainStart: number;
}

export interface BreakSegment {
  type: "break";
}

export type Segment = RubySegment | TextSegment | BreakSegment;

export interface ParsedPassage {
  segments: Segment[];
  /** The passage with all markup removed — what gets sent to text-to-speech. */
  plainText: string;
}

/** `<ruby>WORD<rt>READING</rt></ruby>`, a run of plain text, or a `<br>`. */
const TOKEN = /<ruby>([\s\S]*?)<rt>([\s\S]*?)<\/rt><\/ruby>|([^<]+)|<br\s*\/?>/gi;

export function parseSegments(html: string): ParsedPassage {
  const segments: Segment[] = [];
  let plain = "";

  // Paragraphs become line breaks; everything else is handled by TOKEN.
  const cleaned = html.replace(/<p>\s*/g, "").replace(/\s*<\/p>/g, "<br/>");

  const re = new RegExp(TOKEN.source, TOKEN.flags);
  let match: RegExpExecArray | null;

  while ((match = re.exec(cleaned)) !== null) {
    const [, rubyWord, rubyReading, text] = match;

    if (rubyWord !== undefined) {
      const word = rubyWord.replace(/<[^>]+>/g, ""); // strip nested tags
      segments.push({ type: "ruby", word, reading: rubyReading, plainStart: plain.length });
      plain += word;
      continue;
    }

    if (text !== undefined) {
      text.split("\n").forEach((line, i) => {
        if (i > 0) {
          segments.push({ type: "break" });
          plain += "\n";
        }
        if (line) {
          segments.push({ type: "text", text: line, plainStart: plain.length });
          plain += line;
        }
      });
      continue;
    }

    // <br>
    segments.push({ type: "break" });
    plain += "\n";
  }

  return { segments, plainText: plain };
}
