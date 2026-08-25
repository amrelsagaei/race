import { describe, expect, it } from "vitest";

import { formatSentAt } from "./format";

describe("formatSentAt", () => {
  it("renders a wall-clock time with millisecond precision", () => {
    expect(formatSentAt("2026-08-25T18:16:22.123Z")).toMatch(
      /^\d{2}:\d{2}:\d{2}\.123$/,
    );
  });

  it("pads sub-100ms values", () => {
    expect(formatSentAt("2026-08-25T18:16:22.007Z")).toMatch(/\.007$/);
  });

  it("renders nothing when the request has no timestamp", () => {
    expect(formatSentAt(undefined)).toBe("");
  });

  it("passes an unparsable value through untouched", () => {
    expect(formatSentAt("not-a-date")).toBe("not-a-date");
  });
});
