<script setup lang="ts">
import {
  autocompletion,
  type CompletionContext,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import { editorTheme } from "./editorTheme";

defineOptions({ name: "RaceScriptEditor" });

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const container = ref<HTMLDivElement>();
let view: EditorView | undefined;

const COMPLETIONS = [
  { label: "input.raw", type: "variable", info: "Base request as a string" },
  { label: "input.index", type: "variable", info: "0-based burst position" },
  { label: "input.count", type: "variable", info: "Requests in the burst" },
  {
    label: "forge",
    type: "function",
    detail: "(raw)",
    info: "Chainable request editor, end with .build()",
  },
  {
    label: "fixContentLength",
    type: "function",
    detail: "(raw)",
    info: "Recompute Content-Length from the body",
  },
  { label: ".method", type: "method", detail: "(method)" },
  { label: ".path", type: "method", detail: "(path)" },
  { label: ".setHeader", type: "method", detail: "(name, value)" },
  { label: ".addHeader", type: "method", detail: "(name, value)" },
  { label: ".removeHeader", type: "method", detail: "(name)" },
  { label: ".setQuery", type: "method", detail: "(query)" },
  { label: ".addQueryParam", type: "method", detail: "(key, value)" },
  { label: ".setCookie", type: "method", detail: "(name, value)" },
  { label: ".body", type: "method", detail: "(body)" },
  { label: ".setBodyParam", type: "method", detail: "(name, value)" },
  { label: ".build", type: "method", detail: "()" },
];

function raceCompletions(context: CompletionContext) {
  const word = context.matchBefore(/[\w.]*/);
  if (word === null || (word.from === word.to && !context.explicit)) {
    return null;
  }
  return { from: word.from, options: COMPLETIONS };
}

function createEditor(): void {
  if (container.value === undefined) {
    return;
  }
  const extensions: Extension[] = [
    lineNumbers(),
    history(),
    javascript(),
    javascriptLanguage.data.of({ autocomplete: raceCompletions }),
    autocompletion(),
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        emit("update:modelValue", update.state.doc.toString());
      }
    }),
    ...editorTheme({ maxHeight: "260px", minContentHeight: "140px" }),
  ];
  view = new EditorView({
    state: EditorState.create({ doc: props.modelValue, extensions }),
    parent: container.value,
  });
}

onMounted(createEditor);
onBeforeUnmount(() => {
  view?.destroy();
});

watch(
  () => props.modelValue,
  (value) => {
    if (view === undefined) {
      return;
    }
    if (value === view.state.doc.toString()) {
      return;
    }
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  },
);
</script>

<template>
  <div
    ref="container"
    class="border border-surface-700 rounded overflow-hidden"
  />
</template>
