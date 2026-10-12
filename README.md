# zapier-extralt

The [Zapier](https://zapier.com) integration for [Extralt](https://extralt.com), which turns
ecommerce stores into structured product data. It is built with the
[Zapier Platform CLI](https://docs.zapier.com/platform/build-cli/overview).

## What it does

**Triggers**, one per event, each starting a Zap when Extralt finishes work for the organization,
whether it was started from the dashboard, the Agent, the API or a Schedule:

- Robot Completed, Robot Failed
- Run Completed, Run Stopped, Run Failed, Run Enrichment Skipped
- Enrichment Completed, Enrichment Stopped, Enrichment Failed
- Import Completed, Import Failed

**Actions:**

- Create Robot: build a Robot for a store URL and country.
- Start Run: run a Robot, optionally from start URLs, with a budget and automatic Enrichment.
- Start Enrichment: normalize the Captures of a Run or Import.
- Run Query: run read-only SQL and return the rows as line items, so a later step can create one
  spreadsheet row or record per row.

## How the triggers work

The triggers are REST hooks. Turning a Zap on creates a webhook through `POST /v1/webhooks` for
that one event type, described as `Zapier:` and the trigger's name; turning it off deletes it. The
webhook appears in the Extralt dashboard under **Settings → Connections**.

Each Zap run receives one event, the same envelope every Extralt webhook carries:

```json
{
	"id": "evt_…",
	"type": "run.completed",
	"created_at": "2026-10-12T10:40:50Z",
	"data": { "id": "…", "status": "completed" }
}
```

- `data` is the object API v1 returns for that Robot, Run, Enrichment or Import, as it was when
  the event happened.
- Every delivery's [Standard Webhooks](https://www.standardwebhooks.com/) signature is checked
  against the secret the API returned when the webhook was created. Unsigned deliveries, and test
  events sent from the dashboard (which carry no resource), do not start the Zap.
- In the Zap editor, samples are the organization's recent Robots, Runs or Enrichments in the
  matching status, wrapped in the same envelope. Imports have no list route, so their samples are
  static.

## Development

Requires Node.js 22, the runtime Zapier runs this integration on.

```sh
npm ci
npm run check   # Prettier, tests and Zapier's schema validation
```

Tests use [nock](https://github.com/nock/nock) and need no Zapier account.

## Deploying

Pushing needs a Zapier account at the extralt.com domain. The CLI, `zapier-platform`, comes from
the `zapier-platform-cli` dev dependency, so install dependencies first. Once:

```sh
npm ci
npx zapier-platform login
npx zapier-platform register "Extralt"   # writes .zapierapprc; commit it
```

Then, for each version:

```sh
npx zapier-platform push        # validates, runs Zapier's integration checks and uploads
```

To try a version against staging, point it at the staging API:

```sh
npx zapier-platform env:set 0.1.0 EXTRALT_API_URL=https://api.extralt.dev
```

Environment variables are copied to every version pushed after it. Run
`npx zapier-platform env:unset <version> EXTRALT_API_URL` on a version before promoting it, so
public users reach `https://api.extralt.com`.

## Publishing

Zapier reviews public integrations before they are listed, then keeps them in beta for 90 days.
It requires, among others:

- a Zapier account whose email is at the extralt.com domain, with the publisher's role set to
  employee;
- a non-expiring Extralt test account registered to `integration-testing@zapier.com`, on a plan
  with the features the integration uses;
- a live, successful test Zap for every trigger and action;
- a square 512×512 transparent PNG logo, a homepage URL and a description following Zapier's
  convention.

See Zapier's [publishing requirements](https://docs.zapier.com/platform/publish/integration-publishing-requirements).
