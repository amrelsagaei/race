import { err, ok, type RaceSeed, type Result } from "shared";

import { runTransform } from "./script";

type ConnectionInfoInput = {
  host: string;
  port: number;
  isTLS: boolean;
  SNI: string | undefined;
};
type RequestSourceInput = {
  raw: { raw: string; connectionInfo: ConnectionInfoInput };
};

export async function buildRequestSources(
  seed: RaceSeed,
  count: number,
  script: string | undefined,
  timeoutMs: number,
): Promise<Result<RequestSourceInput[]>> {
  const connectionInfo: ConnectionInfoInput = {
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
