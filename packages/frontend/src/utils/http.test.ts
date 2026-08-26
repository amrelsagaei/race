import { describe, expect, it } from "vitest";

import { normalizeRequestHead } from "./http";

const CRLF = "\r\n";

describe("normalizeRequestHead", () => {
  it("leaves a CRLF request untouched", () => {
    const raw = `GET / HTTP/1.1${CRLF}Host: example.com${CRLF}${CRLF}`;
    expect(normalizeRequestHead(raw)).toBe(raw);
  });

  it("turns LF-only headers into real lines", () => {
    const raw = "GET / HTTP/1.1\nHost: example.com\n\n";
    expect(normalizeRequestHead(raw)).toBe(
      `GET / HTTP/1.1${CRLF}Host: example.com${CRLF}${CRLF}`,
    );
  });

  it("never rewrites bytes inside the body", () => {
    const raw = "POST / HTTP/1.1\nContent-Length: 5\n\na\nb\nc";
    const out = normalizeRequestHead(raw);
    expect(out).toBe(
      `POST / HTTP/1.1${CRLF}Content-Length: 5${CRLF}${CRLF}a\nb\nc`,
    );
    expect(out.slice(out.indexOf(`${CRLF}${CRLF}`) + 4)).toBe("a\nb\nc");
  });

  it("keeps a body with mixed terminators byte for byte", () => {
    const body = ` ${CRLF}x\ny\r`;
    const out = normalizeRequestHead(
      `POST / HTTP/1.1${CRLF}Host: h${CRLF}${CRLF}${body}`,
    );
    expect(out.slice(out.indexOf(`${CRLF}${CRLF}`) + 4)).toBe(body);
  });

  it("normalises a headers-only request with no terminator", () => {
    expect(normalizeRequestHead("GET / HTTP/1.1\nHost: h")).toBe(
      `GET / HTTP/1.1${CRLF}Host: h`,
    );
  });

  it("normalises bare carriage returns in the head", () => {
    expect(normalizeRequestHead(`GET / HTTP/1.1\rHost: h${CRLF}${CRLF}`)).toBe(
      `GET / HTTP/1.1${CRLF}Host: h${CRLF}${CRLF}`,
    );
  });
});
