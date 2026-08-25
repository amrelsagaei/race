import { beforeEach, describe, expect, it, vi } from "vitest";

import { ensureRaceCollection } from "./collection";

import type { FrontendSDK } from "@/types";

const getCollections = vi.fn();
const createCollection = vi.fn();
const addCollectionIndicator = vi.fn();
const get = vi.fn();
const set = vi.fn();

const sdk = {
  replay: { getCollections, createCollection, addCollectionIndicator },
  storage: { get, set },
} as unknown as FrontendSDK;

const collections = (entries: Array<{ id: string; name: string }>) =>
  entries.map((entry) => ({ ...entry, sessionIds: [] }));

describe("ensureRaceCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockReturnValue(undefined);
    set.mockResolvedValue(undefined);
    createCollection.mockResolvedValue({ id: "new", name: "Race" });
    addCollectionIndicator.mockReturnValue({ remove: vi.fn() });
  });

  it("adopts an existing Race collection instead of creating another", async () => {
    getCollections.mockReturnValue(
      collections([
        { id: "1", name: "Default" },
        { id: "7", name: "Race" },
      ]),
    );

    expect(await ensureRaceCollection(sdk)).toBe("7");
    expect(createCollection).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({ collectionId: "7" });
  });

  it("marks the collection so it is recognisable in Replay", async () => {
    getCollections.mockReturnValue(collections([{ id: "9", name: "Race" }]));

    await ensureRaceCollection(sdk);

    expect(addCollectionIndicator).toHaveBeenCalledWith("9", {
      icon: "fas fa-flag-checkered",
      description: "Used by the Race plugin",
    });
  });

  it("reuses the cached collection without touching storage", async () => {
    get.mockReturnValue({ collectionId: "7" });
    getCollections.mockReturnValue(collections([{ id: "7", name: "Race" }]));

    expect(await ensureRaceCollection(sdk)).toBe("7");
    expect(createCollection).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  it("creates the collection only when none exists", async () => {
    getCollections.mockReturnValue(collections([{ id: "1", name: "Default" }]));

    expect(await ensureRaceCollection(sdk)).toBe("new");
    expect(createCollection).toHaveBeenCalledWith("Race");
  });

  it("never reuses a cached id from another project", async () => {
    get.mockReturnValue({ collectionId: "7" });
    getCollections.mockReturnValue([]);
    createCollection.mockRejectedValue(new Error("nope"));

    expect(await ensureRaceCollection(sdk)).toBeUndefined();
  });

  it("falls back to the default collection when creation fails", async () => {
    getCollections.mockReturnValue([]);
    createCollection.mockRejectedValue(new Error("nope"));

    expect(await ensureRaceCollection(sdk)).toBeUndefined();
  });
});
