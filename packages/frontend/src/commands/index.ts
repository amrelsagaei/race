import { openRaceDialog } from "./configureRace";

import type { FrontendSDK } from "@/types";

const Commands = {
  configure: "race.configure",
} as const;

export function registerCommands(sdk: FrontendSDK): void {
  sdk.commands.register(Commands.configure, {
    name: "Race it",
    group: "Race",
    when: (context) =>
      context.type === "RequestRowContext" || context.type === "RequestContext",
    run: (context) => openRaceDialog(sdk, context),
  });

  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: Commands.configure,
    leadingIcon: "fas fa-flag-checkered",
  });
  sdk.menu.registerItem({
    type: "Request",
    commandId: Commands.configure,
    leadingIcon: "fas fa-flag-checkered",
  });
}
