import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

type Sizing = {
  height?: string;
  maxHeight?: string;
  minContentHeight?: string;
};

export function editorTheme(sizing: Sizing): Extension[] {
  const isDark = document.documentElement.getAttribute("data-mode") === "dark";
  return [
    EditorView.theme({
      "&": {
        fontSize: "13px",
        backgroundColor: "transparent",
        ...(sizing.height === undefined ? {} : { height: sizing.height }),
        ...(sizing.maxHeight === undefined
          ? {}
          : { maxHeight: sizing.maxHeight }),
      },
      "&.cm-editor.cm-focused": { outline: "none" },
      ".cm-scroller": { overflow: "auto" },
      ".cm-content": {
        fontFamily: "ui-monospace, monospace",
        ...(sizing.minContentHeight === undefined
          ? {}
          : { minHeight: sizing.minContentHeight }),
      },
      ".cm-gutters": { backgroundColor: "transparent", border: "none" },
    }),
    isDark ? oneDark : syntaxHighlighting(defaultHighlightStyle),
  ];
}
