<script setup lang="ts">
import type { EditorView } from "@codemirror/view";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import type { FrontendSDK } from "@/types";

defineOptions({ name: "RaceResultEditors" });

const editorSurface = { "--c-bg-subtle": "hsl(var(--c-surface-900))" };

const props = defineProps<{
  sdk: FrontendSDK;
  requestRaw: string;
  responseRaw: string;
}>();

const requestHost = ref<HTMLDivElement>();
const responseHost = ref<HTMLDivElement>();
let requestView: EditorView | undefined;
let responseView: EditorView | undefined;

function setContent(view: EditorView | undefined, content: string): void {
  if (view === undefined) {
    return;
  }
  if (view.state.doc.toString() === content) {
    return;
  }
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: content },
  });
}

onMounted(() => {
  if (requestHost.value !== undefined) {
    const editor = props.sdk.ui.httpRequestEditor();
    requestHost.value.appendChild(editor.getElement());
    requestView = editor.getEditorView();
    setContent(requestView, props.requestRaw);
  }
  if (responseHost.value !== undefined) {
    const editor = props.sdk.ui.httpResponseEditor();
    responseHost.value.appendChild(editor.getElement());
    responseView = editor.getEditorView();
    setContent(responseView, props.responseRaw);
  }
});

watch(
  () => props.requestRaw,
  (value) => setContent(requestView, value),
);
watch(
  () => props.responseRaw,
  (value) => setContent(responseView, value),
);

function release(view: EditorView | undefined): void {
  try {
    view?.destroy();
  } catch {
    return;
  }
}

onBeforeUnmount(() => {
  release(requestView);
  release(responseView);
  requestHost.value?.replaceChildren();
  responseHost.value?.replaceChildren();
  requestView = undefined;
  responseView = undefined;
});
</script>

<template>
  <Splitter class="h-full min-h-0 !border-0" :style="editorSurface">
    <SplitterPanel :size="50" :min-size="20" class="min-h-0 overflow-hidden">
      <div
        ref="requestHost"
        class="flex h-full min-h-0 flex-col overflow-hidden [&>*]:min-h-0 [&>*]:flex-1 [&>*]:overflow-hidden"
      />
    </SplitterPanel>
    <SplitterPanel :size="50" :min-size="20" class="min-h-0 overflow-hidden">
      <div
        ref="responseHost"
        class="flex h-full min-h-0 flex-col overflow-hidden [&>*]:min-h-0 [&>*]:flex-1 [&>*]:overflow-hidden"
      />
    </SplitterPanel>
  </Splitter>
</template>
