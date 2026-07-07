import type { RaceGroup, RaceRun } from "shared";

import type { ResultRow } from "./types";

function parseRequestLine(raw: string): { method: string; path: string } {
  const firstLine = (raw.split("\n")[0] ?? "").replace("\r", "");
  const parts = firstLine.split(" ");
  return { method: parts[0] ?? "", path: parts[1] ?? "" };
}

export function groupToRows(group: RaceGroup, offset: number): ResultRow[] {
  return group.entries.map((entry, index) => {
    const line = parseRequestLine(entry.request.raw);
    return {
      index: offset + index + 1,
      method: line.method,
      path: line.path,
      status: entry.response?.statusCode,
      length: entry.response?.length,
      time: entry.response?.roundtripTime,
      requestRaw: entry.request.raw,
      responseRaw: entry.response?.raw ?? "",
    };
  });
}

export function runToRows(run: RaceRun): ResultRow[] {
  const rows: ResultRow[] = [];
  let offset = 0;
  for (const group of run.groups) {
    rows.push(...groupToRows(group, offset));
    offset += group.entries.length;
  }
  return rows;
}
