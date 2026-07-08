---
name: Telegram bot token debugging
description: How to diagnose a Telegram bot token that looks configured but silently fails (delayed/failed purchases, broken webhook, failed getChatMember checks).
---

## Symptom
User reports Telegram Stars purchases feel delayed/stuck, and/or channel-join verification silently fails, and/or `/start` behaves oddly — even though `TELEGRAM_BOT_TOKEN` shows up as an existing secret.

## Root cause pattern
`viewEnvVars` reporting a secret as `true` only means a key exists in the secrets store — it does NOT guarantee the running process actually received a non-empty value. The token can be empty in the live process while still "existing" in the platform.

**Why:** Any code path that does `if (!token) { silently return null / fall back to dev-mode-grants-instantly }` will mask a broken token as either "nothing happens" or "instant free grants," which looks like a delay/inconsistency bug rather than an auth failure.

## How to apply
1. Don't trust `viewEnvVars` existence alone when a Telegram/bot API call seems to silently no-op. Add a temporary `console.log(token ? token.length : 0)` in the token getter, restart the workflow, and hit an endpoint that uses it (e.g. `getWebhookInfo`).
2. If length is 0 despite the secret "existing," ask the user to re-provide the token via `requestEnvVar` (do not guess or reuse the old one).
3. After a token fix, the Telegram webhook URL is often stale (registered against a previous dev domain) — re-call the app's `set-webhook` route to re-register against the current `REPLIT_DEV_DOMAIN`/`REPLIT_DOMAINS`, then verify via `getWebhookInfo` that `last_error_message` is gone.
4. Remove any temporary debug logging before finishing.
5. Note for `getChatMember`-based channel-join verification: the bot must be an admin/member of the target channel or the API call will fail even with a valid token — this looks identical to "user hasn't joined" from the app's perspective, so mention this requirement to the user.
