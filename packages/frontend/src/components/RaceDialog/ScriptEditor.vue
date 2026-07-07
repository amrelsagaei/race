<script setup lang="ts">
import {
  autocompletion,
  type CompletionContext,
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState, type Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

defineOptions({ name: "RaceScriptEditor" });

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const container = ref<HTMLDivElement>();
let view: EditorView | undefined;

const COMPLETIONS = [
  { label: "input.raw", type: "variable", info: "Seed request as a string" },
  { label: "input.index", type: "variable", info: "0-based burst position" },
  { label: "input.count", type: "variable", info: "Requests in the burst" },
  { label: "helper.setHeader", type: "function", detail: "(raw, name, value)" },
  { label: "helper.removeHeader", type: "function", detail: "(raw, name)" },
  { label: "helper.setBody", type: "function", detail: "(raw, body)" },
  { label: "helper.setPath", type: "function", detail: "(raw, path)" },
  { label: "helper.fixContentLength", type: "function", detail: "(raw)" },
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
  const isDark = document.documentElement.getAttribute("data-mode") === "dark";
  const extensions: Extension[] = [
    lineNumbers(),
    history(),
    javascript(),
    javascriptLanguage.data.of({ autocomplete: raceCompletions }),
    autocompletion(),
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        emit("update:modelValue", update.state.doc.toString());
      }
    }),
    EditorView.theme({
      "&": {
        fontSize: "13px",
        backgroundColor: "transparent",
        maxHeight: "260px",
      },
      "&.cm-editor.cm-focused": { outline: "none" },
      ".cm-scroller": { overflow: "auto" },
      ".cm-content": {
        fontFamily: "ui-monospace, monospace",
        minHeight: "140px",
      },
      ".cm-gutters": { backgroundColor: "transparent", border: "none" },
    }),
  ];
  if (isDark) {
    extensions.push(oneDark);
  } else {
    extensions.push(syntaxHighlighting(defaultHighlightStyle));
  }
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
