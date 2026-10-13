# Repository Instructions

The Zapier integration for the Extralt API v1, built with the Zapier Platform CLI
(`zapier-platform`) and pushed to Zapier, not published to npm.

## Repository

- `npm run check` runs everything CI runs: Prettier, the tests and Zapier's schema validation. Run
  it before finishing. `npx zapier-platform validate` also runs Zapier's integration checks, which
  need network access to zapier.com.
- Never commit secrets, tokens or `.env` files. `.zapierapprc` holds only the integration id and
  is committed; deploy keys live in `~/.zapierrc` or the `ZAPIER_DEPLOY_KEY` secret.
- PR titles follow Conventional Commits; release-please derives versions and the changelog from
  them. Never edit the version, `CHANGELOG.md` or `.release-please-manifest.json` by hand.
- Workflows pin every action to a full commit SHA with its version in a comment, start from
  `permissions: {}` and grant each job only what it needs, never persist checkout credentials, and
  pass untrusted context such as PR titles through `env`. zizmor checks them in CI.

## Integration

- The Extralt API is the contract. Use its names for resources, fields and event types, and never
  validate input beyond what the Zap editor needs; the API is authoritative.
- `zapier-platform-core` is the only runtime dependency; use Node.js built-ins otherwise.
- Webhook signatures follow Standard Webhooks. The tests use the specification's reference vector,
  which Extralt's signer also matches; keep it. The same verifier lives in `n8n-nodes-extralt`.
- Every POST the API deduplicates carries a fresh `Idempotency-Key`.
