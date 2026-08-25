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

const projectDir = "/tmp/race-test/projects/default";
const indexFile = `${projectDir}/index.json`;
const bodyFile = (runId: string) => `${projectDir}/runs/${runId}.json`;
const groupFile = (runId: string, index: number) =>
  `${projectDir}/runs/${runId}.g${index}.json`;

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
    const run = await runStore.get(summary.id);
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
    expect(await runStore.get("missing")).toBeUndefined();
  });

  it("reloads persisted runs after switchProject", async () => {
    const summary = await runStore.create(input);
    await runStore.appendGroup(summary.id, group(0, [200, 200]));
    await runStore.switchProject(undefined);
    expect(runStore.list()).toHaveLength(1);
    expect((await runStore.get(summary.id))?.groups).toHaveLength(1);
  });

  it("updates the run status", async () => {
    const summary = await runStore.create(input);
    const updated = await runStore.updateStatus(summary.id, "partial");
    expect(updated.status).toBe("partial");
  });

  it("marks running runs partial on finalize", async () => {
    const summary = await runStore.create(input);
    await runStore.finalizeActiveRuns();
    expect((await runStore.get(summary.id))?.summary.status).toBe("partial");
  });

  it("finalizes runs left running by a crash on initialize", async () => {
    const summary = await runStore.create(input);
    await runStore.initialize();
    expect(runStore.list()[0]?.status).toBe("partial");
    expect(summary.status).toBe("running");
  });

  it("removes and clears runs", async () => {
    const summary = await runStore.create(input);
    await runStore.remove(summary.id);
    expect(runStore.list()).toHaveLength(0);
    expect(mockFs._store.has(bodyFile(summary.id))).toBe(false);
    const other = await runStore.create(input);
    await runStore.clear();
    expect(runStore.list()).toHaveLength(0);
    expect(mockFs._store.has(bodyFile(other.id))).toBe(false);
  });

  it("writes one file per group and never rewrites earlier ones", async () => {
    const summary = await runStore.create(input);
    await runStore.appendGroup(summary.id, group(0, [200, 200]));
    vi.clearAllMocks();
    await runStore.appendGroup(summary.id, group(1, [201, 201]));

    const written = mockFs.writeFile.mock.calls.map((call) => call[0]);
    expect(
      written.some((file) => file.startsWith(groupFile(summary.id, 1))),
    ).toBe(true);
    expect(
      written.some((file) => file.startsWith(groupFile(summary.id, 0))),
    ).toBe(false);
    expect(written.some((file) => file.startsWith(bodyFile(summary.id)))).toBe(
      false,
    );

    const run = await runStore.get(summary.id);
    expect(run?.groups).toHaveLength(2);
    expect(run?.summary.codeCounts).toEqual({ "200": 2, "201": 2 });
  });

  it("deletes every group file when a run is removed", async () => {
    const summary = await runStore.create(input);
    await runStore.appendGroup(summary.id, group(0, [200, 200]));
    await runStore.appendGroup(summary.id, group(1, [200, 200]));
    await runStore.remove(summary.id);
    expect(mockFs._store.has(groupFile(summary.id, 0))).toBe(false);
    expect(mockFs._store.has(groupFile(summary.id, 1))).toBe(false);
    expect(mockFs._store.has(bodyFile(summary.id))).toBe(false);
  });

  it("drops invalid summaries on load", async () => {
    await runStore.create(input);
    const raw = mockFs._store.get(indexFile);
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw as string) as { summaries: unknown[] };
    parsed.summaries.push({ id: "bad" });
    mockFs._store.set(indexFile, JSON.stringify(parsed));
    await runStore.switchProject(undefined);
    expect(runStore.list()).toHaveLength(1);
  });

  it("quarantines an unreadable index instead of starting empty", async () => {
    await runStore.create(input);
    mockFs._store.set(indexFile, "{ not json");
    await runStore.switchProject(undefined);
    expect(runStore.list()).toHaveLength(0);
    expect(mockFs._store.get(`${indexFile}.corrupt`)).toBe("{ not json");
  });

  it("refuses a run id that would escape the run directory", async () => {
    await expect(runStore.remove("../index")).rejects.toThrow(/Invalid run id/);
    await expect(runStore.get("../../etc/passwd")).rejects.toThrow(
      /Invalid run id/,
    );
    expect(mockFs._store.has(indexFile)).toBe(false);
  });

  it("refuses to save a run into a project that has since changed", async () => {
    const summary = await runStore.create(input);
    const pending = runStore.appendGroup(summary.id, group(0, [200, 200]));
    await runStore.switchProject("other");
    await expect(pending).rejects.toThrow(/project changed/i);
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
