import { describe, expect, it } from "vitest";

import { applyTransform, type TransformInput } from "./transform";

const RAW = [
  "POST /login HTTP/1.1",
  "Host: example.com",
  "Content-Type: application/json",
  "Content-Length: 13",
  "",
  '{"amount":1}',
].join("\r\n");

const inputs = (count: number): TransformInput[] =>
  Array.from({ length: count }, (_unused, index) => ({
    raw: RAW,
    index,
    count,
    group: 0,
  }));

describe("applyTransform", () => {
  it("produces one request per input and keeps CRLF framing", async () => {
    const result = await applyTransform(
      'return forge(input.raw).setHeader("X-Index", String(input.index)).build();',
      inputs(3),
    );

    expect(result.ok).toBe(true);
    const values = result.ok ? result.values : [];
    expect(values).toHaveLength(3);
    expect(values[0]).toContain("X-Index: 0");
    expect(values[2]).toContain("X-Index: 2");
    expect(values[0]).toContain("\r\n");
    expect(values[0]?.includes("\n\n")).toBe(false);
  });

  it("keeps the untouched request byte-identical", async () => {
    const result = await applyTransform("return input.raw;", inputs(1));
    expect(result).toEqual({ ok: true, values: [RAW] });
  });

  it("exposes the group index so multi-group runs can differ", async () => {
    const result = await applyTransform(
      'return forge(input.raw).setHeader("X-Group", String(input.group)).build();',
      [{ raw: RAW, index: 0, count: 1, group: 3 }],
    );
    expect(result.ok ? result.values[0] : "").toContain("X-Group: 3");
  });

  it("exposes input.count and supports the full forge chain", async () => {
    const result = await applyTransform(
      [
        "return forge(input.raw)",
        '  .path("/login?n=" + input.count)',
        '  .addHeader("X-Trace", "t" + input.index)',
        '  .removeHeader("Content-Type")',
        '  .body("{\\"amount\\":" + input.index + "}")',
        "  .build();",
      ].join("\n"),
      inputs(2),
    );

    expect(result.ok).toBe(true);
    const first = result.ok ? result.values[0] : "";
    expect(first).toContain("POST /login?n=2 HTTP/1.1");
    expect(first).toContain("X-Trace: t0");
    expect(first).not.toContain("Content-Type");
    expect(first).toContain('{"amount":0}');
  });

  const statedLength = (raw: string): number =>
    Number(/Content-Length: (\d+)/.exec(raw)?.[1]);

  const bodyOf = (raw: string): string => {
    const separator = raw.indexOf("\r\n\r\n");
    return separator === -1 ? "" : raw.slice(separator + 4);
  };

  const fixed = async (body: string): Promise<string> => {
    const result = await applyTransform(
      `return fixContentLength(forge(input.raw).body(${JSON.stringify(body)}).build());`,
      inputs(1),
    );
    return result.ok ? (result.values[0] ?? "") : "";
  };

  it("recomputes Content-Length with fixContentLength", async () => {
    const out = await fixed("{}");
    expect(statedLength(out)).toBe(2);
  });

  it("counts the CRLF the pipeline actually sends in a multi-line body", async () => {
    const out = await fixed("a\nb\nc");
    expect(bodyOf(out)).toBe("a\r\nb\r\nc");
    expect(statedLength(out)).toBe(7);
  });

  it("counts a latin-1 character as the single byte Caido sends", async () => {
    const out = await fixed("caf\u00e9");
    expect(statedLength(out)).toBe(4);
  });

  it("counts an astral character as its UTF-8 bytes", async () => {
    const out = await fixed("\u{1F680}");
    expect(statedLength(out)).toBe(4);
  });

  it("supports async scripts", async () => {
    const result = await applyTransform(
      "await Promise.resolve(); return input.raw;",
      inputs(1),
    );
    expect(result).toEqual({ ok: true, values: [RAW] });
  });

  it("reports a syntax error instead of throwing", async () => {
    const result = await applyTransform("return forge(", inputs(1));
    expect(result.ok).toBe(false);
  });

  it("reports a thrown runtime error", async () => {
    const result = await applyTransform('throw new Error("boom");', inputs(1));
    expect(result).toEqual({ ok: false, error: "boom" });
  });

  it("rejects a script that does not return a string", async () => {
    const result = await applyTransform("return 42;", inputs(2));
    expect(result).toEqual({
      ok: false,
      error: "Transform must return a string (request 0)",
    });
  });

  it("rejects a script that returns nothing", async () => {
    const result = await applyTransform("forge(input.raw).build();", inputs(1));
    expect(result.ok).toBe(false);
  });
});
