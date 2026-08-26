import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref } from "vue";

import { editorTheme } from "./editorTheme";
import { httpLanguage } from "./httpLanguage";

import { normalizeRequestHead } from "@/utils/http";

export function useBaseRequestEditor(initialRaw: string) {
  const host = ref<HTMLDivElement>();
  const normalised = normalizeRequestHead(initialRaw);
  const edited = ref(normalised !== initialRaw);
  let view: EditorView | undefined;

  onMounted(() => {
    if (host.value === undefined) {
      return;
    }
    const extensions: Extension[] = [
      EditorState.lineSeparator.of("\r\n"),
      lineNumbers(),
      history(),
      httpLanguage,
      EditorView.lineWrapping,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          edited.value = true;
        }
      }),
      ...editorTheme({ height: "100%" }),
    ];
    view = new EditorView({
      state: EditorState.create({ doc: normalised, extensions }),
      parent: host.value,
    });
  });

  onBeforeUnmount(() => {
    view?.destroy();
    view = undefined;
  });

  function read(): string {
    return view === undefined ? normalised : view.state.sliceDoc();
  }

  return { host, read, edited };
}
