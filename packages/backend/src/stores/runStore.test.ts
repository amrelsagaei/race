import type { RaceGroup, RaceRunInput } from "shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockFs } from "../__tests__/mockFs";
import { createMockSDK } from "../__tests__/mockSdk";

const mockFs = createMockFs();
const mockSdk = createMockSDK();

vi.mock("fs/promises", () => mockFs);
vi.mock("../sdk", () => ({ requireSDK: () => mockSdk }));

const { runStore } = await import("./runStore");
const { apiPersistRun } = await import("../api/runs");

const storeFile = "/tmp/race-test/projects/default/runs.json";

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

describe("runStore", () => {
  beforeEach(async () => {
    mockFs._store.clear();
    vi.clearAllMocks();
    await runStore.switchProject(undefined);
  });

  it("creates a run and lists it", async () => {
    const summary = await runStore.create(input);
    expect(summary.strategy).toBe("LastByteSynchronization");
    expect(summary.groupCount).toBe(2);
    expect(summary.requestCount).toBe(2);
    expect(summary.completedGroups).toBe(0);
    expect(runStore.list()).toHaveLength(1);
  });

  it("appends a group and recomputes counts", async () => {
    const summary = await runStore.create(input);
    await runStore.appendGroup(summary.id, group(0, [200, 429]));
    const run = runStore.get(summary.id);
    expect(run?.groups).toHaveLength(1);
    expect(run?.summary.entryCount).toBe(2);
    expect(run?.summary.completedCount).toBe(2);
    expect(run?.summary.codeCounts).toEqual({ "200": 1, "429": 1 });
    expect(run?.summary.completedGroups).toBe(1);
    expect(run?.summary.minMs).toBe(200);
    expect(run?.summary.maxMs).toBe(429);
  });

  it("returns undefined for an unknown run", async () => {
    await runStore.create(input);
    expect(runStore.get("missing")).toBeUndefined();
  });

  it("reloads persisted runs after switchProject", async () => {
    const summary = await runStore.create(input);
    await runStore.appendGroup(summary.id, group(0, [200, 200]));
    await runStore.switchProject(undefined);
    expect(runStore.list()).toHaveLength(1);
    expect(runStore.get(summary.id)?.groups).toHaveLength(1);
  });

  it("updates the run status", async () => {
    const summary = await runStore.create(input);
    const updated = await runStore.updateStatus(summary.id, "partial");
    expect(updated.status).toBe("partial");
  });

  it("marks running runs partial on finalize", async () => {
    const summary = await runStore.create(input);
    await runStore.finalizeActiveRuns();
    expect(runStore.get(summary.id)?.summary.status).toBe("partial");
  });

  it("removes and clears runs", async () => {
    const summary = await runStore.create(input);
    await runStore.remove(summary.id);
    expect(runStore.list()).toHaveLength(0);
    await runStore.create(input);
    await runStore.clear();
    expect(runStore.list()).toHaveLength(0);
  });

  it("drops invalid runs on load", async () => {
    await runStore.create(input);
    const raw = mockFs._store.get(storeFile);
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw as string) as { runs: unknown[] };
    parsed.runs.push({ summary: { id: "bad" } });
    mockFs._store.set(storeFile, JSON.stringify(parsed));
    await runStore.switchProject(undefined);
    expect(runStore.list()).toHaveLength(1);
  });

  it("rejects an invalid config at the API boundary without writing", async () => {
    const badInput = {
      ...input,
      config: { ...input.config, requestCount: 1 },
    } as RaceRunInput;
    const result = await apiPersistRun(mockSdk as never, badInput);
    expect(result.kind).toBe("Error");
    expect(runStore.list()).toHaveLength(0);
  });
});
