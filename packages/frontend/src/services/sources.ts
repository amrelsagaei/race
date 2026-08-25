import { err, ok, type RaceSeed, type Result } from "shared";

import { runTransform } from "./script";
import type { RequestSource } from "./types";

export async function buildRequestSources(
  seed: RaceSeed,
  count: number,
  group: number,
  script: string | undefined,
  timeoutMs: number,
): Promise<Result<RequestSource[]>> {
  const connectionInfo = {
    host: seed.connection.host,
    port: seed.connection.port,
    isTLS: seed.connection.isTls,
    SNI: seed.connection.sni,
  };

  let raws: string[];
  if (script !== undefined && script.trim() !== "") {
    const inputs = Array.from({ length: count }, (_unused, index) => ({
      raw: seed.raw,
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
    raws = Array.from({ length: count }, () => seed.raw);
  }

  return ok(raws.map((raw) => ({ raw: { raw, connectionInfo } })));
}
