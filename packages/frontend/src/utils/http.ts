const CRLF = "\r\n";
const BODY_BOUNDARY = /\r\n\r\n|\r\n\n|\n\r\n|\n\n|\r\r/;

export function normalizeRequestHead(raw: string): string {
  const boundary = BODY_BOUNDARY.exec(raw);
  if (boundary === null) {
    return raw.replace(/\r\n|\r|\n/g, CRLF);
  }
  const head = raw.slice(0, boundary.index).replace(/\r\n|\r|\n/g, CRLF);
  const body = raw.slice(boundary.index + boundary[0].length);
  return `${head}${CRLF}${CRLF}${body}`;
}
