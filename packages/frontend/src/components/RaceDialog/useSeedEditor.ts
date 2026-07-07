import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState, type Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref } from "vue";

import { httpLanguage } from "./httpLanguage";

export function useSeedEditor(initialRaw: string) {
  const host = ref<HTMLDivElement>();
  let view: EditorView | undefined;

  onMounted(() => {
    if (host.value === undefined) {
      return;
    }
    const isDark =
      document.documentElement.getAttribute("data-mode") === "dark";
    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      httpLanguage,
      EditorView.lineWrapping,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.theme({
        "&": {
          fontSize: "13px",
          height: "100%",
          backgroundColor: "transparent",
        },
        "&.cm-editor.cm-focused": { outline: "none" },
        ".cm-scroller": { overflow: "auto" },
        ".cm-content": { fontFamily: "ui-monospace, monospace" },
        ".cm-gutters": { backgroundColor: "transparent", border: "none" },
      }),
    ];
    if (isDark) {
      extensions.push(oneDark);
    } else {
      extensions.push(syntaxHighlighting(defaultHighlightStyle));
    }
    view = new EditorView({
      state: EditorState.create({ doc: initialRaw, extensions }),
      parent: host.value,
    });
  });

  onBeforeUnmount(() => {
    view?.destroy();
    view = undefined;
  });

  function read(): string {
    return view !== undefined ? view.state.doc.toString() : initialRaw;
  }

  return { host, read };
}
