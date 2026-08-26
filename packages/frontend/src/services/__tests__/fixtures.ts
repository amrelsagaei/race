import type {
  RaceBaseRequest,
  RaceGroup,
  RaceRunConfig,
  RaceRunSummary,
} from "shared";

export const baseRequest: RaceBaseRequest = {
  raw: "GET / HTTP/1.1\r\nHost: example.com\r\n\r\n",
  connection: { host: "example.com", port: 443, isTls: true },
};

export const config: RaceRunConfig = {
  requestCount: 2,
  groupCount: 2,
  betweenGroupDelayMs: 0,
  timeoutMs: 10000,
  strategy: "LastByteSynchronization",
};

export const summary: RaceRunSummary = {
  id: "race_test",
  createdAt: "2026-07-07T00:00:00.000Z",
  target: baseRequest.connection,
  status: "running",
  strategy: config.strategy,
  groupCount: config.groupCount,
  requestCount: config.requestCount,
  completedGroups: 0,
  entryCount: 0,
  completedCount: 0,
  errorCount: 0,
  codeCounts: {},
};

export function group(index: number): RaceGroup {
  return {
    index,
    startedAt: "2026-07-07T00:00:00.000Z",
    entries: [
      {
        request: { raw: baseRequest.raw, connection: baseRequest.connection },
        response: { raw: "HTTP/1.1 200 OK\r\n\r\n", statusCode: 200 },
        status: "received",
      },
    ],
  };
}
