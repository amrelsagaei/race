<div align="center">
  <img src="assets/banner.png" alt="Race" width="100%" />
</div>

Race is a Caido plugin for HTTP race-condition testing. Right-click any
request, configure a test in a dialog, and fire multiple synchronized bursts
through Caido's native last-byte-synchronized replay pipeline. Every request and
its response, status code, and round-trip time are captured live and saved to a
durable, project-scoped history you can review at any time.

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

Right-click any request in HTTP History, Search, or Replay and choose **Race
it**. In the dialog set the requests per burst, the number of groups, the
between-group delay, the per-burst timeout, and the strategy, then click
**Run**. Results stream into the dialog as the bursts complete and are saved to
the **Race** page, where you can open any run to review every request and
response in native editors, grouped by burst.

The synchronization is done by Caido's own engine, a real last-byte barrier
across parallel connections. Race never opens its own sockets; it drives the
pipeline and reads the results back.

### Transform script

Each request in a burst can be mutated by an optional JavaScript transform that
runs in a sandboxed worker and returns the raw request for that index. Use
`forge(raw)` to edit the request fluently and `input.index` to vary each one:

```js
return forge(input.raw)
  .setHeader("Idempotency-Key", "req-" + input.index)
  .build();
```

---

<div align="center">
  <p>Made with care by <a href="https://amrelsagaei.com">Amr Elsagaei</a> for the Caido and security community</p>
</div>
