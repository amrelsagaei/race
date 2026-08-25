import {
  type RaceRunConfig,
  RaceRunConfigSchema,
  type StrategyEnum,
} from "shared";
import { computed, ref } from "vue";

import { DEFAULT_TIMEOUT_MS } from "@/services/constants";
import { strategyLabel } from "@/utils/format";

const STRATEGIES: StrategyEnum[] = [
  "LastByteSynchronization",
  "SinglePacketAttack",
  "Sequential",
];

const NO_HTTP2 = "HTTP/2 is not enabled";

export function useRaceConfig(isHttp2Enabled: () => boolean) {
  const requestCount = ref(20);
  const groupCount = ref(1);
  const betweenGroupDelayMs = ref(0);
  const timeoutMs = ref(DEFAULT_TIMEOUT_MS);
  const strategy = ref<StrategyEnum>("LastByteSynchronization");
  const jsHook = ref("");
  const label = ref("");

  const totalRequests = computed(() => requestCount.value * groupCount.value);
  const isLarge = computed(() => totalRequests.value > 500);

  const strategyOptions = computed(() =>
    STRATEGIES.map((value) => ({
      label: strategyLabel(value),
      value,
      disabled: value === "SinglePacketAttack" && !isHttp2Enabled(),
    })),
  );
  const strategyNote = computed(() =>
    isHttp2Enabled() ? undefined : NO_HTTP2,
  );

  function buildConfig(): RaceRunConfig | undefined {
    const candidate = {
      requestCount: requestCount.value,
      groupCount: groupCount.value,
      betweenGroupDelayMs: betweenGroupDelayMs.value,
      timeoutMs: timeoutMs.value,
      strategy: strategy.value,
      jsHook: jsHook.value.trim() !== "" ? jsHook.value : undefined,
      label: label.value.trim() === "" ? undefined : label.value,
    };
    const parsed = RaceRunConfigSchema.safeParse(candidate);
    return parsed.success ? parsed.data : undefined;
  }

  return {
    requestCount,
    groupCount,
    betweenGroupDelayMs,
    timeoutMs,
    strategy,
    jsHook,
    label,
    strategyOptions,
    strategyNote,
    totalRequests,
    isLarge,
    buildConfig,
  };
}
