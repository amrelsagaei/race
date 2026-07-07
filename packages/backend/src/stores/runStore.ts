import path from "path";

import {
  RACE_STORE_VERSION,
  type RaceGroup,
  type RaceRun,
  type RaceRunInput,
  RaceRunSchema,
  type RaceRunSummary,
  type RunStatus,
} from "shared";

import { requireSDK } from "../sdk";
import { newId } from "../util/ids";

import { getProjectDir, readJson, writeJson } from "./storage";

type StoreFile = {
  version: number;
  runs: unknown[];
};

function recompute(run: RaceRun): void {
  const codeCounts: Record<string, number> = {};
  let entryCount = 0;
  let completedCount = 0;
  let errorCount = 0;
  let minMs: number | undefined;
  let maxMs: number | undefined;

  for (const group of run.groups) {
    for (const entry of group.entries) {
      entryCount += 1;
      if (entry.status === "error") {
        errorCount += 1;
      }
      const response = entry.response;
      if (response !== undefined) {
        completedCount += 1;
        if (response.statusCode !== undefined) {
          const key = String(response.statusCode);
          codeCounts[key] = (codeCounts[key] ?? 0) + 1;
        }
        if (response.roundtripTime !== undefined) {
          const rtt = response.roundtripTime;
          minMs = minMs === undefined ? rtt : Math.min(minMs, rtt);
          maxMs = maxMs === undefined ? rtt : Math.max(maxMs, rtt);
        }
      }
    }
  }

  run.summary.completedGroups = run.groups.length;
  run.summary.entryCount = entryCount;
  run.summary.completedCount = completedCount;
  run.summary.errorCount = errorCount;
  run.summary.codeCounts = codeCounts;
  run.summary.minMs = minMs;
  run.summary.maxMs = maxMs;
}

class RunStoreClass {
  private projectId: string | undefined;
  private runs = new Map<string, RaceRun>();

  private file(): string {
    return path.join(getProjectDir(this.projectId), "runs.json");
  }

  async switchProject(projectId: string | undefined): Promise<void> {
    this.projectId = projectId;
    this.runs = new Map();
    const loaded = await readJson<StoreFile>(this.file());
    const items = Array.isArray(loaded?.runs) ? loaded.runs : [];
    for (const item of items) {
      const parsed = RaceRunSchema.safeParse(item);
      if (parsed.success) {
        this.runs.set(parsed.data.summary.id, parsed.data);
      }
    }
  }

  async finalizeActiveRuns(): Promise<void> {
    let changed = false;
    for (const run of this.runs.values()) {
      if (run.summary.status === "running") {
        run.summary.status = "partial";
        changed = true;
      }
    }
    if (changed) {
      await this.persistToDisk();
    }
  }

  async initialize(): Promise<void> {
    const project = await requireSDK().projects.getCurrent();
    await this.switchProject(project?.getId());
  }

  list(): RaceRunSummary[] {
    return [...this.runs.values()]
      .map((run) => run.summary)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  get(runId: string): RaceRun | undefined {
    return this.runs.get(runId);
  }

  async create(input: RaceRunInput): Promise<RaceRunSummary> {
    const summary: RaceRunSummary = {
      id: newId("race"),
      label: input.label,
      createdAt: new Date().toISOString(),
      target: input.target,
      status: "running",
      strategy: input.config.strategy,
      groupCount: input.config.groupCount,
      requestCount: input.config.requestCount,
      completedGroups: 0,
      entryCount: 0,
      completedCount: 0,
      errorCount: 0,
      codeCounts: {},
    };
    this.runs.set(summary.id, { summary, config: input.config, groups: [] });
    await this.persistToDisk();
    return summary;
  }

  async appendGroup(runId: string, group: RaceGroup): Promise<void> {
    const run = this.runs.get(runId);
    if (run === undefined) {
      throw new Error(`Unknown run: ${runId}`);
    }
    run.groups.push(group);
    recompute(run);
    await this.persistToDisk();
  }

  async updateStatus(
    runId: string,
    status: RunStatus,
  ): Promise<RaceRunSummary> {
    const run = this.runs.get(runId);
    if (run === undefined) {
      throw new Error(`Unknown run: ${runId}`);
    }
    run.summary.status = status;
    await this.persistToDisk();
    return run.summary;
  }

  async remove(runId: string): Promise<void> {
    this.runs.delete(runId);
    await this.persistToDisk();
  }

  async clear(): Promise<void> {
    this.runs = new Map();
    await this.persistToDisk();
  }

  private async persistToDisk(): Promise<void> {
    await writeJson(this.file(), {
      version: RACE_STORE_VERSION,
      runs: [...this.runs.values()],
    });
  }
}

export const runStore = new RunStoreClass();
