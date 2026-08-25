<div align="center">
  <img src="assets/banner.png" alt="Race" width="100%" />
</div>

Race is a Caido plugin for HTTP race-condition testing. Right-click any request, configure a test in a dialog, and fire synchronized bursts through Caido's native replay pipeline. Every request and its response, status code, and round-trip time are captured live and saved to a durable, project-scoped history.

## Installation

### From Plugin Store

1. Open Caido
2. Navigate to **Plugins** in the left sidebar
3. Search for "Race"
4. Click **Install**

### Manual Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build the plugin:

   ```bash
   pnpm build
   ```

3. Install in Caido:
   - Upload the `dist/plugin_package.zip` file by clicking "Install Package" in Caido's plugin page

## Usage

Right-click any request in HTTP History, Search, or Replay and choose **Race it**. In the dialog set the requests per burst, the number of groups, the between-group delay, the per-burst timeout, and the strategy, then click **Run**. Results stream into the dialog as the bursts complete and are saved to the **Race** page, where you can open any run to review every request and response in native editors.

Race never opens its own sockets, it drives Caido's engine. Last-byte sync releases every final byte together across parallel connections, sequential sends them one after another as a control run, and single packet sends the whole burst in one TCP packet. Single packet needs HTTP/2 enabled in Caido; Race detects that and disables the option when it is off. Each burst runs in its own pipeline session inside a dedicated **Race** collection in Replay, removed once its results are copied into Race's history.

### Transform script

Each request in a burst can be mutated by an optional JavaScript transform that runs in a sandboxed worker and returns the raw request for that index. Use `forge(raw)` to edit the request fluently, `input.index` to vary each request within a burst and `input.group` to vary each burst:

```js
return forge(input.raw)
  .setHeader("Idempotency-Key", "req-" + input.index)
  .build();
```

---

<div align="center">
  <p>Made with care by <a href="https://amrelsagaei.com">Amr Elsagaei</a> for the Caido and security community</p>
</div>
