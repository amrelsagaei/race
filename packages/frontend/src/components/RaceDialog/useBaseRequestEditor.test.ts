import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";

import { normalizeRequestHead } from "@/utils/http";

const CRLF = "\r\n";

describe("base request round trip", () => {
  const raw = `POST /u HTTP/1.1${CRLF}Host: h${CRLF}${CRLF}part1${CRLF}part2`;
  const state = EditorState.create({
    doc: normalizeRequestHead(raw),
    extensions: [EditorState.lineSeparator.of(CRLF)],
  });

  it("returns the request byte for byte through sliceDoc", () => {
    expect(state.sliceDoc()).toBe(raw);
  });

  it("would lose every CRLF through doc.toString", () => {
    expect(state.doc.toString()).not.toBe(raw);
    expect(state.doc.toString().includes(CRLF)).toBe(false);
  });
});
