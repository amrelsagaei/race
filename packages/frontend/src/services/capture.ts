import type { RaceEntry, RaceGroup } from "shared";

import type { BurstEntry, PollResult } from "./types";

import type { FrontendSDK } from "@/types";

export async function buildRaceGroup(
  sdk: FrontendSDK,
  index: number,
  startedAt: string,
  poll: PollResult,
): Promise<RaceGroup> {
  const entries: RaceEntry[] = [];
  for (const burstEntry of poll.entries) {
    entries.push(
      await toRaceEntry(sdk, burstEntry, poll.pipelineError, poll.timedOut),
    );
  }
  return { index, startedAt, entries };
}

async function toRaceEntry(
  sdk: FrontendSDK,
  entry: BurstEntry,
  pipelineError: string | undefined,
  timedOut: boolean,
): Promise<RaceEntry> {
  const request = { raw: entry.requestRaw, connection: entry.connection };

  if (entry.responseId === undefined) {
    const failure =
      entry.error ??
      pipelineError ??
      (timedOut ? "Timed out waiting for a response" : undefined);
    return {
      request,
      status: failure !== undefined ? "error" : "pending",
      error: failure,
    };
  }

  let raw = "";
  const result = await sdk.graphql.response({ id: entry.responseId });
  if (result.response !== null && result.response !== undefined) {
    raw = result.response.raw;
  }

  return {
    request,
    response: {
      raw,
      statusCode: entry.statusCode,
      roundtripTime: entry.roundtripTime,
      length: entry.length,
    },
    status: "received",
  };
}
