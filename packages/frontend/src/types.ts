import type { Caido } from "@caido/sdk-frontend";
import type { Spec } from "shared";

export type FrontendSDK = Caido<Spec>;

export type CommandContext = Parameters<
  Parameters<FrontendSDK["commands"]["register"]>[1]["run"]
>[0];
