import type { FrontendSDK } from "@/types";

const COLLECTION_NAME = "Race";

export async function ensureRaceCollection(
  sdk: FrontendSDK,
): Promise<string | undefined> {
  const existing = await findRaceCollection(sdk);
  if (existing !== undefined) {
    return existing;
  }

  const created = await sdk.graphql.createReplaySessionCollection({
    input: { name: COLLECTION_NAME },
  });
  const collection = created.createReplaySessionCollection.collection;
  if (collection === null || collection === undefined) {
    return undefined;
  }
  return collection.id;
}

export async function deleteRaceCollection(
  sdk: FrontendSDK,
  collectionId: string,
): Promise<void> {
  await sdk.graphql.deleteReplaySessionCollection({ id: collectionId });
}

async function findRaceCollection(
  sdk: FrontendSDK,
): Promise<string | undefined> {
  const result = await sdk.graphql.replaySessionCollections();
  const match = result.replaySessionCollections.edges.find(
    (edge) => edge.node.name === COLLECTION_NAME,
  );
  return match?.node.id;
}
