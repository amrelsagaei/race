export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function sleepUntilAborted(
  ms: number,
  shouldAbort: () => boolean,
): Promise<void> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (shouldAbort()) {
      return;
    }
    await sleep(Math.min(100, deadline - Date.now()));
  }
}
