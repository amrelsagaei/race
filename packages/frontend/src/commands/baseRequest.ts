import { err, ok, type RaceBaseRequest, type Result } from "shared";

import type { CommandContext, FrontendSDK } from "@/types";

type SourceRequest = {
  raw: string;
  host: string;
  port: number;
  isTls: boolean;
};

function toBaseRequest(
  request: SourceRequest,
  sni: string | undefined,
): RaceBaseRequest {
  return {
    raw: request.raw,
    connection: {
      host: request.host,
      port: request.port,
      isTls: request.isTls,
      sni,
    },
  };
}

export async function extractBaseRequest(
  sdk: FrontendSDK,
  context: CommandContext,
): Promise<Result<RaceBaseRequest>> {
  if (context.type === "RequestRowContext") {
    const meta = context.requests[0];
    if (meta === undefined) {
      return err("No request selected");
    }
    if (context.requests.length > 1) {
      sdk.window.showToast("Racing the first of the selected requests", {
        variant: "info",
      });
    }
    const query = await sdk.graphql.request({ id: meta.id });
    const request = query?.request;
    if (request === null || request === undefined) {
      return err("Could not load the selected request");
    }
    return ok(toBaseRequest(request, request.sni ?? undefined));
  }

  if (context.type === "RequestContext") {
    return ok(toBaseRequest(context.request, undefined));
  }

  return err("Unsupported context for Race");
}
