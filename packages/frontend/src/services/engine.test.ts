import {
  err,
  ok,
  type RaceGroup,
  type RaceRunConfig,
  type RaceSeed,
} from "shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FrontendSDK } from "@/types";

const runBurst = vi.fn();
const ensureRaceCollection = vi.fn();
const runTransform = vi.fn();

vi.mock("./pipeline", () => ({ runBurst }));
vi.mock("./collection", () => ({ ensureRaceCollection }));
vi.mock("./script", () => ({ runTransform }));

const { runRace } = await import("./engine");

const seed: RaceSeed = {
  raw: "GET / HTTP/1.1\r\nHost: example.com\r\n\r\n",
  connection: { host: "example.com", port: 443, isTls: true },
};

const config: RaceRunConfig = {
  requestCount: 2,
  groupCount: 2,
  betweenGroupDelayMs: 0,
  timeoutMs: 10000,
  strategy: "LastByteSynchronization",
};

const summary = {
  id: "race_test",
  createdAt: "2026-07-07T00:00:00.000Z",
  target: seed.connection,
  status: "running" as const,
  strategy: config.strategy,
  groupCount: config.groupCount,
  requestCount: config.requestCount,
  completedGroups: 0,
  entryCount: 0,
  completedCount: 0,
  errorCount: 0,
  codeCounts: {},
};

const group = (index: number): RaceGroup => ({
  index,
  startedAt: "2026-07-07T00:00:00.000Z",
  entries: [
    {
      request: { raw: seed.raw, connection: seed.connection },
      response: { raw: "HTTP/1.1 200 OK\r\n\r\n", statusCode: 200 },
      status: "received",
    },
  ],
});

const backend = {
  persistRun: vi.fn(),
  appendGroup: vi.fn(),
  updateStatus: vi.fn(),
};
const sdk = { backend } as unknown as FrontendSDK;

const never = { shouldAbort: () => false };

describe("runRace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureRaceCollection.mockResolvedValue(undefined);
    backend.persistRun.mockResolvedValue(ok(summary));
    backend.appendGroup.mockResolvedValue(ok(undefined));
    backend.updateStatus.mockImplementation((id: string, status: string) =>
      Promise.resolve(ok({ ...summary, id, status })),
    );
  });

  it("appends every group and completes", async () => {
    runBurst.mockImplementation((_sdk, params: { index: number }) =>
      Promise.resolve(ok(group(params.index))),
    );
    const result = await runRace(sdk, seed, config, never, undefined);
    expect(backend.appendGroup).toHaveBeenCalledTimes(2);
    expect(backend.updateStatus).toHaveBeenLastCalledWith(
      summary.id,
      "completed",
    );
    expect(result).toEqual(
      ok({ ...summary, id: summary.id, status: "completed" }),
    );
  });

  it("marks the run failed when a burst throws", async () => {
    runBurst.mockRejectedValue(new Error("boom"));
    const result = await runRace(sdk, seed, config, never, undefined);
    expect(backend.updateStatus).toHaveBeenCalledWith(summary.id, "failed");
    expect(result).toEqual(err("boom"));
  });

  it("marks the run failed when a burst returns an error", async () => {
    runBurst.mockResolvedValue(err("rejected"));
    const result = await runRace(sdk, seed, config, never, undefined);
    expect(backend.updateStatus).toHaveBeenCalledWith(summary.id, "failed");
    expect(result).toEqual(err("rejected"));
  });

  it("marks the run cancelled when aborted before the first burst", async () => {
    const result = await runRace(
      sdk,
      seed,
      config,
      { shouldAbort: () => true },
      undefined,
    );
    expect(runBurst).not.toHaveBeenCalled();
    expect(backend.updateStatus).toHaveBeenCalledWith(summary.id, "cancelled");
    expect(result).toEqual(ok({ ...summary, status: "cancelled" }));
  });

  it("marks the run cancelled when stopped during the final burst", async () => {
    let aborted = false;
    runBurst.mockImplementation((_sdk, params: { index: number }) => {
      aborted = true;
      return Promise.resolve(ok(group(params.index)));
    });
    await runRace(
      sdk,
      seed,
      { ...config, groupCount: 1 },
      { shouldAbort: () => aborted },
      undefined,
    );
    expect(backend.appendGroup).toHaveBeenCalledTimes(1);
    expect(backend.updateStatus).toHaveBeenLastCalledWith(
      summary.id,
      "cancelled",
    );
  });

  it("marks the run failed when nothing responded at all", async () => {
    runBurst.mockImplementation((_sdk, params: { index: number }) =>
      Promise.resolve(
        ok({
          ...group(params.index),
          entries: [
            {
              request: { raw: seed.raw, connection: seed.connection },
              status: "error" as const,
              error: "failed to parse request",
            },
          ],
        }),
      ),
    );
    await runRace(sdk, seed, config, never, undefined);
    expect(backend.updateStatus).toHaveBeenLastCalledWith(summary.id, "failed");
  });

  it("marks the run partial when only some requests responded", async () => {
    runBurst.mockImplementation((_sdk, params: { index: number }) =>
      Promise.resolve(
        ok({
          ...group(params.index),
          entries: [
            ...group(params.index).entries,
            {
              request: { raw: seed.raw, connection: seed.connection },
              status: "error" as const,
              error: "Timed out waiting for a response",
            },
          ],
        }),
      ),
    );
    await runRace(sdk, seed, config, never, undefined);
    expect(backend.updateStatus).toHaveBeenLastCalledWith(
      summary.id,
      "partial",
    );
  });

  it("does not persist a run when the transform preflight fails", async () => {
    runTransform.mockResolvedValue(err("SyntaxError"));
    const result = await runRace(
      sdk,
      seed,
      { ...config, jsHook: "return (" },
      never,
      undefined,
    );
    expect(backend.persistRun).not.toHaveBeenCalled();
    expect(result).toEqual(err("SyntaxError"));
  });
});
