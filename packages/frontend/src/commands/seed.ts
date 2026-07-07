import { err, ok, type RaceSeed, type Result } from "shared";

import type { CommandContext, FrontendSDK } from "@/types";

export async function extractSeed(
  sdk: FrontendSDK,
  context: CommandContext,
): Promise<Result<RaceSeed>> {
  if (context.type === "RequestRowContext") {
    const meta = context.requests[0];
    if (meta === undefined) {
      return err("No request selected");
    }
    const query = await sdk.graphql.request({ id: meta.id });
    const request = query.request;
    if (request === null || request === undefined) {
      return err("Could not load the selected request");
    }
    return ok({
      raw: request.raw,
      connection: {
        host: request.host,
        port: request.port,
        isTls: request.isTls,
        sni: request.sni ?? undefined,
      },
      sourceRequestId: meta.id,
    });
  }

  if (context.type === "RequestContext") {
    const request = context.request;
    return ok({
      raw: request.raw,
      connection: {
        host: request.host,
        port: request.port,
        isTls: request.isTls,
      },
    });
  }

  return err("Unsupported context for Race");
}
