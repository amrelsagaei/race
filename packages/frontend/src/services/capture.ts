import type { RaceEntry, RaceGroup } from "shared";

import type { BurstEntry, PollResult } from "./types";

import type { FrontendSDK } from "@/types";

export async function buildRaceGroup(
  sdk: FrontendSDK,
  index: number,
  startedAt: string,
  poll: PollResult,
): Promise<RaceGroup> {
  const entries = await Promise.all(
    poll.entries.map((entry) => toRaceEntry(sdk, entry, poll)),
  );
  return { index, startedAt, entries };
}

function unfinished(poll: PollResult): string | undefined {
  if (poll.aborted) {
    return "Cancelled before a response arrived";
  }
  return poll.timedOut ? "Timed out waiting for a response" : undefined;
}

async function toRaceEntry(
  sdk: FrontendSDK,
  entry: BurstEntry,
  poll: PollResult,
): Promise<RaceEntry> {
  const request = { raw: entry.requestRaw, connection: entry.connection };

  if (entry.responseId === undefined) {
    const failure = entry.error ?? poll.pipelineError ?? unfinished(poll);
    return {
      request,
      status: failure !== undefined ? "error" : "pending",
      error: failure,
      sentAt: entry.sentAt,
    };
  }

  const result = await sdk.graphql.response({ id: entry.responseId });
  const raw = result?.response?.raw ?? "";

  return {
    request,
    response: {
      raw,
      statusCode: entry.statusCode,
      roundtripTime: entry.roundtripTime,
      length: entry.length,
    },
    status: "received",
    sentAt: entry.sentAt,
  };
}
