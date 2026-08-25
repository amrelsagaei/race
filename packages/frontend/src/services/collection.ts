import type { Indicator } from "@caido/sdk-frontend";

import type { FrontendSDK } from "@/types";

const COLLECTION_NAME = "Race";
const INDICATOR = {
  icon: "fas fa-flag-checkered",
  description: "Used by the Race plugin",
};

type RaceStorage = { collectionId?: string };

let markedId: string | undefined;
let marker: Indicator | undefined;

export async function ensureRaceCollection(
  sdk: FrontendSDK,
): Promise<string | undefined> {
  const stored = sdk.storage.get() as RaceStorage | undefined;
  const existing = findCollection(sdk, stored?.collectionId);
  if (existing !== undefined) {
    if (existing !== stored?.collectionId) {
      await sdk.storage.set({ ...stored, collectionId: existing });
    }
    markRaceCollection(sdk, existing);
    return existing;
  }

  const created = await createCollection(sdk);
  if (created === undefined) {
    return undefined;
  }
  await sdk.storage.set({ ...stored, collectionId: created });
  markRaceCollection(sdk, created);
  return created;
}

export function markExistingRaceCollection(sdk: FrontendSDK): void {
  const stored = sdk.storage.get() as RaceStorage | undefined;
  const existing = findCollection(sdk, stored?.collectionId);
  if (existing !== undefined) {
    markRaceCollection(sdk, existing);
  }
}

function markRaceCollection(sdk: FrontendSDK, collectionId: string): void {
  if (markedId === collectionId) {
    return;
  }
  try {
    marker?.remove();
    marker = sdk.replay.addCollectionIndicator(collectionId, INDICATOR);
    markedId = collectionId;
  } catch {
    markedId = undefined;
  }
}

function findCollection(
  sdk: FrontendSDK,
  cachedId: string | undefined,
): string | undefined {
  const collections = sdk.replay.getCollections();
  if (collections.length === 0) {
    return undefined;
  }
  const cached =
    cachedId === undefined
      ? undefined
      : collections.find((collection) => collection.id === cachedId);
  const named = collections.find(
    (collection) => collection.name === COLLECTION_NAME,
  );
  return (cached ?? named)?.id;
}

async function createCollection(sdk: FrontendSDK): Promise<string | undefined> {
  try {
    const created = await sdk.replay.createCollection(COLLECTION_NAME);
    return created.id;
  } catch {
    return undefined;
  }
}
