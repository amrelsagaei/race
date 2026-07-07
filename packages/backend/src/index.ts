import type { SDK } from "caido:plugin";
import type { Spec } from "shared";

import {
  apiAppendGroup,
  apiClearRuns,
  apiDeleteRun,
  apiGetRun,
  apiListRuns,
  apiPersistRun,
  apiUpdateStatus,
} from "./api";
import { setSDK } from "./sdk";
import { runStore } from "./stores";

export function init(sdk: SDK<Spec>) {
  setSDK(sdk);

  sdk.api.register("listRuns", apiListRuns);
  sdk.api.register("getRun", apiGetRun);
  sdk.api.register("persistRun", apiPersistRun);
  sdk.api.register("appendGroup", apiAppendGroup);
  sdk.api.register("updateStatus", apiUpdateStatus);
  sdk.api.register("deleteRun", apiDeleteRun);
  sdk.api.register("clearRuns", apiClearRuns);

  sdk.events.onProjectChange(async (_sdk, project) => {
    await runStore.finalizeActiveRuns();
    await runStore.switchProject(project?.getId());
    sdk.api.send("project:changed", project?.getId());
  });

  runStore
    .initialize()
    .then(() => {
      sdk.api.send("project:changed", undefined);
    })
    .catch((error) => {
      sdk.console.error(`[Race] run store load failed: ${String(error)}`);
    });
}
