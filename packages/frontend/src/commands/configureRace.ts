import type { DialogComponent } from "@caido/sdk-frontend";

import { extractSeed } from "./seed";

import { RaceDialog } from "@/components/RaceDialog";
import { activeRun } from "@/services/activeRun";
import type { CommandContext, FrontendSDK } from "@/types";

export async function openRaceDialog(
  sdk: FrontendSDK,
  context: CommandContext,
): Promise<void> {
  if (activeRun.isActive()) {
    sdk.window.showToast("A race is already running", { variant: "warning" });
    return;
  }

  const seed = await extractSeed(sdk, context);
  if (seed.kind === "Error") {
    sdk.window.showToast(seed.error, { variant: "warning" });
    return;
  }

  const dialog = sdk.window.showDialog(
    {
      component: RaceDialog as DialogComponent["component"],
      props: { seed: seed.value, sdk },
      events: {
        close: () => {
          dialog.close();
        },
      },
    },
    {
      title: "Configure Race",
      modal: true,
      draggable: true,
      closeOnEscape: true,
    },
  );
}
