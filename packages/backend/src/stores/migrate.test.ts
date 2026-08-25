import type { RaceGroup, RaceRun, RaceRunInput } from "shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockFs } from "../__tests__/mockFs";
import { createMockSDK } from "../__tests__/mockSdk";

const mockFs = createMockFs();
const mockSdk = createMockSDK();

vi.mock("fs/promises", () => mockFs);
vi.mock("../sdk", () => ({ requireSDK: () => mockSdk }));

const { runStore } = await import("./runStore");

const projectDir = "/tmp/race-test/projects/default";
const indexFile = `${projectDir}/index.json`;
const legacyFile = `${projectDir}/runs.json`;

const input: RaceRunInput = {
  config: {
    requestCount: 2,
    groupCount: 2,
    betweenGroupDelayMs: 0,
    timeoutMs: 10000,
    strategy: "LastByteSynchronization",
  },
  target: { host: "example.com", port: 443, isTls: true },
  label: "login",
};

const group = (index: number, codes: number[]): RaceGroup => ({
  index,
  startedAt: "2026-07-07T00:00:00.000Z",
  entries: codes.map((code) => ({
    request: {
      raw: "cmF3",
      connection: { host: "example.com", port: 443, isTls: true },
    },
    response: { raw: "cmVzcA==", statusCode: code, roundtripTime: code },
    status: "received",
  })),
});

const legacyRun: RaceRun = {
  summary: {
    id: "race_legacy",
    label: "legacy",
    createdAt: "2026-07-06T00:00:00.000Z",
    target: { host: "example.com", port: 443, isTls: true },
    status: "completed",
    strategy: "Sequential",
    groupCount: 1,
    requestCount: 2,
    completedGroups: 1,
    entryCount: 2,
    completedCount: 2,
    errorCount: 0,
    codeCounts: { "200": 2 },
  },
  config: { ...input.config, strategy: "Sequential" },
  groups: [group(0, [200, 200])],
};

describe("migrateLegacyStore", () => {
  beforeEach(async () => {
    mockFs._store.clear();
    vi.clearAllMocks();
    await runStore.switchProject(undefined);
  });

  it("migrates a legacy single-file store and removes the source", async () => {
    mockFs._store.set(
      legacyFile,
      JSON.stringify({ version: 1, runs: [legacyRun] }),
    );
    await runStore.switchProject(undefined);
    expect(runStore.list()).toHaveLength(1);
    expect((await runStore.get("race_legacy"))?.groups).toHaveLength(1);
    expect(mockFs._store.has(legacyFile)).toBe(false);
    expect(mockFs._store.has(indexFile)).toBe(true);
  });

  it("keeps the legacy store when a run could not be migrated", async () => {
    mockFs._store.set(
      legacyFile,
      JSON.stringify({ version: 1, runs: [legacyRun, { summary: { id: 1 } }] }),
    );
    await runStore.switchProject(undefined);
    expect(runStore.list()).toHaveLength(1);
    expect(mockFs._store.has(legacyFile)).toBe(true);
  });

  it("never migrates over an existing store", async () => {
    const summary = await runStore.create(input);
    mockFs._store.set(
      legacyFile,
      JSON.stringify({ version: 1, runs: [legacyRun] }),
    );
    await runStore.switchProject(undefined);
    expect(runStore.list().map((run) => run.id)).toEqual([summary.id]);
    expect(mockFs._store.has(legacyFile)).toBe(true);
  });
});
