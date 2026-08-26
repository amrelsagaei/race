import type { DialogComponent } from "@caido/sdk-frontend";

import { extractBaseRequest } from "./baseRequest";

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

  const baseRequest = await extractBaseRequest(sdk, context);
  if (activeRun.isActive()) {
    sdk.window.showToast("A race is already running", { variant: "warning" });
    return;
  }
  if (baseRequest.kind === "Error") {
    sdk.window.showToast(baseRequest.error, { variant: "warning" });
    return;
  }

  const dialog = sdk.window.showDialog(
    {
      component: RaceDialog as DialogComponent["component"],
      props: { baseRequest: baseRequest.value, sdk },
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
      closeOnEscape: false,
    },
  );
}
