import { Classic } from "@caido/primevue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import { createApp } from "vue";

import { registerCommands } from "./commands";
import { SDKPlugin } from "./plugins/sdk";
import { useRunsStore } from "./stores/runs";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

export const init = (sdk: FrontendSDK) => {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(PrimeVue, { unstyled: true, pt: Classic });
  app.use(ConfirmationService);
  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, { height: "100%", width: "100%" });
  root.id = "plugin--race";
  app.mount(root);

  sdk.navigation.addPage("/race", { body: root });
  sdk.sidebar.registerItem("Race", "/race", {
    icon: "fas fa-flag-checkered",
  });

  useRunsStore(pinia).initialize(sdk);
  registerCommands(sdk);
};
