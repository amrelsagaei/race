import { err, ok, type RaceBaseRequest, type Result } from "shared";

import { runTransform } from "./script";
import type { RequestSource } from "./types";

export async function buildRequestSources(
  baseRequest: RaceBaseRequest,
  count: number,
  group: number,
  script: string | undefined,
  timeoutMs: number,
): Promise<Result<RequestSource[]>> {
  const connectionInfo = {
    host: baseRequest.connection.host,
    port: baseRequest.connection.port,
    isTLS: baseRequest.connection.isTls,
    SNI: baseRequest.connection.sni,
  };

  let raws: string[];
  if (script !== undefined && script.trim() !== "") {
    const inputs = Array.from({ length: count }, (_unused, index) => ({
      raw: baseRequest.raw,
      index,
      count,
      group,
    }));
    const result = await runTransform(inputs, script, timeoutMs);
    if (result.kind === "Error") {
      return err(result.error);
    }
    raws = result.value;
  } else {
    raws = Array.from({ length: count }, () => baseRequest.raw);
  }

  return ok(raws.map((raw) => ({ raw: { raw, connectionInfo } })));
}
