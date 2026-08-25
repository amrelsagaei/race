import { applyTransform, type TransformInput } from "./transform";

const ctx = globalThis as unknown as {
  onmessage: (event: {
    data: { script: string; inputs: TransformInput[] };
  }) => void;
  postMessage: (message: unknown) => void;
};

ctx.onmessage = (event) => {
  const { script, inputs } = event.data;
  void applyTransform(script, inputs).then((result) => {
    ctx.postMessage(result);
  });
};
