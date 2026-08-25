import type { RaceGroup, RaceRunInput, RaceRunSummary } from "shared";

export function newSummary(id: string, input: RaceRunInput): RaceRunSummary {
  return {
    id,
    label: input.label,
    createdAt: new Date().toISOString(),
    target: input.target,
    status: "running",
    strategy: input.config.strategy,
    groupCount: input.config.groupCount,
    requestCount: input.config.requestCount,
    completedGroups: 0,
    entryCount: 0,
    completedCount: 0,
    errorCount: 0,
    codeCounts: {},
  };
}

export function byNewestFirst(a: RaceRunSummary, b: RaceRunSummary): number {
  if (a.createdAt === b.createdAt) {
    return 0;
  }
  return a.createdAt < b.createdAt ? 1 : -1;
}

export function foldGroup(
  summary: RaceRunSummary,
  group: RaceGroup,
): RaceRunSummary {
  const codeCounts: Record<string, number> = { ...summary.codeCounts };
  let entryCount = summary.entryCount;
  let completedCount = summary.completedCount;
  let errorCount = summary.errorCount;
  let minMs = summary.minMs;
  let maxMs = summary.maxMs;

  for (const entry of group.entries) {
    entryCount += 1;
    if (entry.status === "error") {
      errorCount += 1;
    }
    const response = entry.response;
    if (response !== undefined) {
      completedCount += 1;
      if (response.statusCode !== undefined) {
        const key = String(response.statusCode);
        codeCounts[key] = (codeCounts[key] ?? 0) + 1;
      }
      if (response.roundtripTime !== undefined) {
        const rtt = response.roundtripTime;
        minMs = minMs === undefined ? rtt : Math.min(minMs, rtt);
        maxMs = maxMs === undefined ? rtt : Math.max(maxMs, rtt);
      }
    }
  }

  return {
    ...summary,
    completedGroups: summary.completedGroups + 1,
    entryCount,
    completedCount,
    errorCount,
    codeCounts,
    minMs,
    maxMs,
  };
}
