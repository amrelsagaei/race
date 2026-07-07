import {
  type RaceRunConfig,
  RaceRunConfigSchema,
  type StrategyEnum,
} from "shared";
import { computed, ref } from "vue";

import { DEFAULT_TIMEOUT_MS } from "@/services/constants";
import { strategyLabel } from "@/utils/format";

const STRATEGIES: StrategyEnum[] = ["LastByteSynchronization", "Sequential"];

export function useRaceConfig() {
  const requestCount = ref(20);
  const groupCount = ref(1);
  const betweenGroupDelayMs = ref(0);
  const timeoutMs = ref(DEFAULT_TIMEOUT_MS);
  const strategy = ref<StrategyEnum>("LastByteSynchronization");
  const jsHook = ref("");
  const label = ref("");

  const totalRequests = computed(() => requestCount.value * groupCount.value);
  const isLarge = computed(() => totalRequests.value > 500);

  const strategyOptions = STRATEGIES.map((value) => ({
    label: strategyLabel(value),
    value,
  }));

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
    totalRequests,
    isLarge,
    buildConfig,
  };
}
