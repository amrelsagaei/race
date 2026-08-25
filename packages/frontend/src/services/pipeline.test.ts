import { ok, type RaceSeed } from "shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { pipelineSettingsCandidates } from "./constants";
import type { BurstParams } from "./types";

import type { FrontendSDK } from "@/types";

const buildRequestSources = vi.fn();
const pollUntilComplete = vi.fn();
const buildRaceGroup = vi.fn();

vi.mock("./sources", () => ({ buildRequestSources }));
vi.mock("./pollBurst", () => ({ pollUntilComplete }));
vi.mock("./capture", () => ({ buildRaceGroup }));

const { runBurst } = await import("./pipeline");

const seed: RaceSeed = {
  raw: "GET / HTTP/1.1\r\nHost: example.com\r\n\r\n",
  connection: { host: "example.com", port: 443, isTls: true },
};

const source = {
  raw: {
    raw: seed.raw,
    connectionInfo: {
      host: "example.com",
      port: 443,
      isTLS: true,
      SNI: undefined,
    },
  },
};

const params: BurstParams = {
  seed,
  count: 2,
  script: undefined,
  collectionId: undefined,
  strategy: "LastByteSynchronization",
  timeoutMs: 1000,
  index: 0,
  onProgress: undefined,
  shouldAbort: () => false,
};

const createReplayPipelineHttpOneSession = vi.fn();
const startReplayTask = vi.fn();
const deleteReplaySessions = vi.fn();
const cancelTask = vi.fn();

const sdk = {
  graphql: {
    createReplayPipelineHttpOneSession,
    startReplayTask,
    deleteReplaySessions,
    cancelTask,
  },
} as unknown as FrontendSDK;

describe("pipelineSettingsCandidates", () => {
  it("offers the current pipeline strategy input before the legacy enum", () => {
    expect(pipelineSettingsCandidates("LastByteSynchronization")).toEqual([
      {
        strategy: {
          lastByteSynchronization: { failureBehavior: "ABORT_ON_PARTIAL" },
        },
      },
      { strategy: "LAST_BYTE_SYNCHRONIZATION" },
    ]);
    expect(pipelineSettingsCandidates("Sequential")).toEqual([
      { strategy: { sequential: { abortOnFailure: false } } },
      { strategy: "SEQUENTIAL" },
    ]);
  });

  it("offers no legacy fallback for a strategy older Caido never had", () => {
    expect(pipelineSettingsCandidates("SinglePacketAttack")).toEqual([
      {
        strategy: {
          singlePacketAttack: {
            convertToHttp2: true,
            failureBehavior: "ABORT_ON_PARTIAL",
          },
        },
      },
    ]);
  });
});

describe("runBurst", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildRequestSources.mockResolvedValue(ok([source, source]));
    pollUntilComplete.mockResolvedValue({
      entries: [],
      timedOut: false,
      aborted: false,
      pipelineError: undefined,
    });
    buildRaceGroup.mockResolvedValue({
      index: 0,
      startedAt: "2026-07-07T00:00:00.000Z",
      entries: [],
    });
    startReplayTask.mockResolvedValue({
      startReplayTask: {
        error: undefined,
        task: {
          id: "task_1",
          replayEntry: {
            __typename: "ReplayEntryHttpOnePipeline",
            id: "entry_1",
            httpEntries: [{}, {}],
          },
        },
      },
    });
    deleteReplaySessions.mockResolvedValue({
      deleteReplaySessions: { deletedIds: ["session_1"] },
    });
    cancelTask.mockResolvedValue({ cancelTask: { cancelledId: "task_1" } });
  });

  it("falls back to the legacy strategy shape when the current one is rejected", async () => {
    createReplayPipelineHttpOneSession
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        createReplayPipelineHttpOneSession: { session: { id: "session_1" } },
      });

    const result = await runBurst(sdk, params);

    expect(result.kind).toBe("Ok");
    expect(createReplayPipelineHttpOneSession).toHaveBeenCalledTimes(2);
    expect(
      createReplayPipelineHttpOneSession.mock.calls[0]?.[0].input.settings,
    ).toEqual({
      strategy: {
        lastByteSynchronization: { failureBehavior: "ABORT_ON_PARTIAL" },
      },
    });
    expect(startReplayTask).toHaveBeenCalledWith({ sessionId: "session_1" });
  });

  it("cancels the running task when the burst is interrupted", async () => {
    createReplayPipelineHttpOneSession.mockResolvedValue({
      createReplayPipelineHttpOneSession: { session: { id: "session_1" } },
    });
    pollUntilComplete.mockResolvedValue({
      entries: [],
      timedOut: true,
      aborted: true,
      pipelineError: undefined,
    });

    await runBurst(sdk, params);

    expect(cancelTask).toHaveBeenCalledWith({ id: "task_1" });
    expect(deleteReplaySessions).toHaveBeenCalledWith({ ids: ["session_1"] });
  });

  it("leaves a finished task alone", async () => {
    createReplayPipelineHttpOneSession.mockResolvedValue({
      createReplayPipelineHttpOneSession: { session: { id: "session_1" } },
    });

    await runBurst(sdk, params);

    expect(cancelTask).not.toHaveBeenCalled();
    expect(deleteReplaySessions).toHaveBeenCalledTimes(1);
  });

  it("reports a clear error instead of crashing when every shape is rejected", async () => {
    createReplayPipelineHttpOneSession.mockResolvedValue(undefined);

    const result = await runBurst(sdk, params);

    expect(result).toEqual({
      kind: "Error",
      error:
        "Caido rejected the pipeline request. Update Race, or Caido, so both speak the same pipeline schema.",
    });
    expect(startReplayTask).not.toHaveBeenCalled();
  });
});
