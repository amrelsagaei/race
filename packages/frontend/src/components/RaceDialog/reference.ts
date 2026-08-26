type ReferenceEntry = { name: string; description: string };

export const TRANSFORM_REFERENCE: ReferenceEntry[] = [
  { name: "input.raw", description: "The base request as a string" },
  { name: "input.index", description: "0-based position in the burst" },
  { name: "input.count", description: "Requests in the burst" },
  { name: "input.group", description: "0-based burst number in the run" },
  { name: "forge(raw)", description: "Chainable editor, end with .build()" },
  { name: ".method(method)", description: "Set the HTTP method" },
  { name: ".path(path)", description: "Set the path, query included" },
  { name: ".setHeader(name, value)", description: "Replace or add a header" },
  { name: ".addHeader(name, value)", description: "Append another header" },
  { name: ".removeHeader(name)", description: "Remove a header" },
  { name: ".setQuery(query)", description: "Replace the query string" },
  { name: ".addQueryParam(key, value)", description: "Add a query parameter" },
  { name: ".setCookie(name, value)", description: "Set a cookie" },
  { name: ".body(body)", description: "Replace the body" },
  { name: ".setBodyParam(name, value)", description: "Set one body parameter" },
  { name: ".build()", description: "Return the raw request string" },
  {
    name: "fixContentLength(raw)",
    description: "Recompute Content-Length from the body",
  },
];
