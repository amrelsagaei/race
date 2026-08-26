import { err, ok } from "shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { baseRequest, config, group, summary } from "./__tests__/fixtures";

import type { FrontendSDK } from "@/types";

const runBurst = vi.fn();
const ensureRaceCollection = vi.fn();
const runTransform = vi.fn();

vi.mock("./pipeline", () => ({ runBurst }));
vi.mock("./collection", () => ({ ensureRaceCollection }));
vi.mock("./script", () => ({ runTransform }));

const { runRace } = await import("./engine");

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
    const result = await runRace(sdk, baseRequest, config, never, undefined);
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
    const result = await runRace(sdk, baseRequest, config, never, undefined);
    expect(backend.updateStatus).toHaveBeenCalledWith(summary.id, "failed");
    expect(result).toEqual(err("boom"));
  });

  it("marks the run failed when a burst returns an error", async () => {
    runBurst.mockResolvedValue(err("rejected"));
    const result = await runRace(sdk, baseRequest, config, never, undefined);
    expect(backend.updateStatus).toHaveBeenCalledWith(summary.id, "failed");
    expect(result).toEqual(err("rejected"));
  });

  it("marks the run cancelled when aborted before the first burst", async () => {
    const result = await runRace(
      sdk,
      baseRequest,
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
      baseRequest,
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
              request: {
                raw: baseRequest.raw,
                connection: baseRequest.connection,
              },
              status: "error" as const,
              error: "failed to parse request",
            },
          ],
        }),
      ),
    );
    await runRace(sdk, baseRequest, config, never, undefined);
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
              request: {
                raw: baseRequest.raw,
                connection: baseRequest.connection,
              },
              status: "error" as const,
              error: "Timed out waiting for a response",
            },
          ],
        }),
      ),
    );
    await runRace(sdk, baseRequest, config, never, undefined);
    expect(backend.updateStatus).toHaveBeenLastCalledWith(
      summary.id,
      "partial",
    );
  });

  it("does not persist a run when the transform preflight fails", async () => {
    runTransform.mockResolvedValue(err("SyntaxError"));
    const result = await runRace(
      sdk,
      baseRequest,
      { ...config, jsHook: "return (" },
      never,
      undefined,
    );
    expect(backend.persistRun).not.toHaveBeenCalled();
    expect(result).toEqual(err("SyntaxError"));
  });
});
