import {
  StreamLanguage,
  type StreamParser,
  type StringStream,
} from "@codemirror/language";

type HttpState = {
  section: "request" | "headers" | "body";
  afterColon: boolean;
};

function requestToken(stream: StringStream) {
  if (stream.sol() && stream.match(/^[A-Z]+(?=\s)/) !== null) {
    return "keyword";
  }
  if (stream.match(/^\s+/) !== null) {
    return null;
  }
  if (stream.match(/^HTTP\/[0-9.]+/i) !== null) {
    return "keyword";
  }
  if (stream.match(/^\S+/) !== null) {
    return "string";
  }
  stream.next();
  return null;
}

const parser: StreamParser<HttpState> = {
  startState: () => ({ section: "request", afterColon: false }),

  token(stream, state) {
    if (state.section === "body") {
      stream.skipToEnd();
      return null;
    }

    if (state.section === "request") {
      const tag = requestToken(stream);
      if (stream.eol()) {
        state.section = "headers";
      }
      return tag;
    }

    if (stream.sol()) {
      state.afterColon = false;
    }
    if (!state.afterColon && stream.match(/^[^:\s][^:]*(?=:)/) !== null) {
      return "propertyName";
    }
    if (!state.afterColon && stream.match(/^:/) !== null) {
      state.afterColon = true;
      return "punctuation";
    }
    stream.skipToEnd();
    return "string";
  },

  blankLine(state) {
    if (state.section === "headers") {
      state.section = "body";
    }
  },
};

export const httpLanguage = StreamLanguage.define(parser);
