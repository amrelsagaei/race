import {
  RACE_STORE_VERSION,
  type RaceGroup,
  type RaceRun,
  type RaceRunBody,
  RaceRunBodySchema,
  type RaceRunInput,
  type RaceRunSummary,
  RaceRunSummarySchema,
  type RunStatus,
} from "shared";

import { requireSDK } from "../sdk";
import { assertRunId, newId } from "../util/ids";

import { migrateLegacyStore } from "./migrate";
import {
  configPath,
  indexPath,
  readGroups,
  removeRunFiles,
  writeGroup,
} from "./runFiles";
import { getProjectDir, readJson, writeJson } from "./storage";
import { byNewestFirst, foldGroup, newSummary } from "./summary";

type IndexFile = { version: number; summaries: unknown[] };

class RunStoreClass {
  private projectId: string | undefined;
  private projectApplied = false;
  private summaries = new Map<string, RaceRunSummary>();

  private dir(): string {
    return getProjectDir(this.projectId);
  }

  private indexFile(): string {
    return indexPath(this.dir());
  }

  private assertProject(projectId: string | undefined): void {
    if (this.projectId !== projectId) {
      throw new Error("The project changed while the run was being saved");
    }
  }

  async initialize(): Promise<void> {
    const project = await requireSDK().projects.getCurrent();
    if (!this.projectApplied) {
      await this.switchProject(project?.getId());
    }
    await this.finalizeActiveRuns();
  }

  async switchProject(projectId: string | undefined): Promise<void> {
    this.projectApplied = true;
    this.projectId = projectId;
    this.summaries = new Map();
    await migrateLegacyStore(this.dir());
    const loaded = await readJson<IndexFile>(this.indexFile());
    const items = Array.isArray(loaded?.summaries) ? loaded.summaries : [];
    for (const item of items) {
      const parsed = RaceRunSummarySchema.safeParse(item);
      if (parsed.success) {
        this.summaries.set(parsed.data.id, parsed.data);
      }
    }
  }

  async finalizeActiveRuns(): Promise<void> {
    let changed = false;
    for (const [runId, summary] of this.summaries) {
      if (summary.status === "running") {
        this.summaries.set(runId, { ...summary, status: "partial" });
        changed = true;
      }
    }
    if (changed) {
      await this.persistIndex();
    }
  }

  list(): RaceRunSummary[] {
    return [...this.summaries.values()].sort(byNewestFirst);
  }

  async get(runId: string): Promise<RaceRun | undefined> {
    assertRunId(runId);
    const summary = this.summaries.get(runId);
    if (summary === undefined) {
      return undefined;
    }
    const body = await this.readBody(runId);
    if (body === undefined) {
      return undefined;
    }
    const groups =
      body.groups.length > 0
        ? body.groups
        : await readGroups(this.dir(), runId, summary.completedGroups);
    return { summary, config: body.config, groups };
  }

  async create(input: RaceRunInput): Promise<RaceRunSummary> {
    const projectId = this.projectId;
    const summary = newSummary(newId("race"), input);
    await writeJson(configPath(this.dir(), summary.id), {
      config: input.config,
      groups: [],
    });
    this.assertProject(projectId);
    this.summaries.set(summary.id, summary);
    await this.persistIndex();
    return summary;
  }

  async appendGroup(runId: string, group: RaceGroup): Promise<void> {
    assertRunId(runId);
    const projectId = this.projectId;
    const summary = this.summaries.get(runId);
    if (summary === undefined) {
      throw new Error(`Unknown run: ${runId}`);
    }
    await writeGroup(this.dir(), runId, group);
    this.assertProject(projectId);
    if (!this.summaries.has(runId)) {
      throw new Error(`Unknown run: ${runId}`);
    }
    this.summaries.set(runId, foldGroup(summary, group));
    await this.persistIndex();
  }

  async updateStatus(
    runId: string,
    status: RunStatus,
  ): Promise<RaceRunSummary> {
    assertRunId(runId);
    const summary = this.summaries.get(runId);
    if (summary === undefined) {
      throw new Error(`Unknown run: ${runId}`);
    }
    const updated = { ...summary, status };
    this.summaries.set(runId, updated);
    await this.persistIndex();
    return updated;
  }

  async remove(runId: string): Promise<void> {
    assertRunId(runId);
    const projectId = this.projectId;
    const summary = this.summaries.get(runId);
    if (summary === undefined) {
      return;
    }
    this.summaries.delete(runId);
    const dir = this.dir();
    await this.persistIndex();
    this.assertProject(projectId);
    await removeRunFiles(dir, runId, summary.completedGroups);
  }

  async clear(): Promise<void> {
    const projectId = this.projectId;
    const dir = this.dir();
    const runs = [...this.summaries.values()];
    this.summaries = new Map();
    await this.persistIndex();
    for (const summary of runs) {
      this.assertProject(projectId);
      await removeRunFiles(dir, summary.id, summary.completedGroups);
    }
  }

  private async readBody(runId: string): Promise<RaceRunBody | undefined> {
    const raw = await readJson<unknown>(configPath(this.dir(), runId));
    const parsed = RaceRunBodySchema.safeParse(raw);
    return parsed.success ? parsed.data : undefined;
  }

  private async persistIndex(): Promise<void> {
    await writeJson(this.indexFile(), {
      version: RACE_STORE_VERSION,
      summaries: [...this.summaries.values()],
    });
  }
}

export const runStore = new RunStoreClass();
