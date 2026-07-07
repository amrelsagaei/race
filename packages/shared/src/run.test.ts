import { describe, expect, it } from "vitest";

import { RaceRunConfigSchema } from "./config";
import { type RaceRun, RaceRunSchema } from "./run";

const validRun: RaceRun = {
  summary: {
    id: "race_abc",
    label: "login",
    createdAt: "2026-07-07T00:00:00.000Z",
    target: { host: "example.com", port: 443, isTls: true },
    status: "completed",
    strategy: "LastByteSynchronization",
    groupCount: 1,
    requestCount: 2,
    completedGroups: 1,
    entryCount: 2,
    completedCount: 2,
    errorCount: 0,
    codeCounts: { "200": 2 },
    minMs: 40,
    maxMs: 55,
  },
  config: {
    requestCount: 2,
    groupCount: 1,
    betweenGroupDelayMs: 0,
    timeoutMs: 10000,
    strategy: "LastByteSynchronization",
  },
  groups: [
    {
      index: 0,
      startedAt: "2026-07-07T00:00:00.000Z",
      entries: [
        {
          request: {
            raw: "cmF3",
            connection: { host: "example.com", port: 443, isTls: true },
          },
          response: { raw: "cmVzcA==", statusCode: 200, roundtripTime: 40 },
          status: "received",
        },
        {
          request: {
            raw: "cmF3",
            connection: { host: "example.com", port: 443, isTls: true },
          },
          response: { raw: "cmVzcA==", statusCode: 200, roundtripTime: 55 },
          status: "received",
        },
      ],
    },
  ],
};

describe("shared schemas", () => {
  it("accepts a fully populated run", () => {
    expect(RaceRunSchema.safeParse(validRun).success).toBe(true);
  });

  it("rejects a request count below 2", () => {
    const result = RaceRunConfigSchema.safeParse({
      ...validRun.config,
      requestCount: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown config keys", () => {
    const result = RaceRunConfigSchema.safeParse({
      ...validRun.config,
      bogus: true,
    });
    expect(result.success).toBe(false);
  });
});
