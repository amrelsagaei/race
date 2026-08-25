import type { FrontendSDK } from "@/types";

type NetworkSettings = { network?: { stack?: string } };

const HTTP2_STACK = "V2";

export async function isHttp2Enabled(sdk: FrontendSDK): Promise<boolean> {
  try {
    const result = await sdk.graphql.instanceSettings();
    const settings = result?.instanceSettings as NetworkSettings | undefined;
    return settings?.network?.stack === HTTP2_STACK;
  } catch {
    return false;
  }
}
