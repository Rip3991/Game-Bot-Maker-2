import app from "./app";
import { logger } from "./lib/logger";
import { getBotToken, getAppDomain, sendTelegramRequest } from "./lib/telegram";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/** Automatically register the Telegram webhook on every server startup.
 *  This way the webhook always points to the current live URL — no manual
 *  /set-webhook call needed after restarts or deployments. */
async function autoRegisterWebhook(): Promise<void> {
  const token = getBotToken();
  if (!token) {
    logger.warn("TELEGRAM_BOT_TOKEN not set — skipping webhook registration");
    return;
  }

  // REPLIT_DOMAINS is set in production (deployed); REPLIT_DEV_DOMAIN in dev.
  const base = getAppDomain();
  if (!base) {
    logger.warn("No domain env var found — skipping webhook registration");
    return;
  }

  const webhookUrl = `${base}/api/telegram/webhook`;

  try {
    const result = await sendTelegramRequest("setWebhook", {
      url: webhookUrl,
      allowed_updates: ["message", "pre_checkout_query", "chat_member"],
    }) as { ok?: boolean; description?: string } | null;

    if (result?.ok) {
      logger.info({ webhookUrl }, "Telegram webhook auto-registered");
    } else {
      logger.warn({ webhookUrl, result }, "Telegram webhook registration returned non-ok");
    }
  } catch (err) {
    logger.error({ err }, "Failed to auto-register Telegram webhook");
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Register webhook after server is up (non-blocking)
  autoRegisterWebhook().catch(() => {});

  // ── Self-ping keep-alive ──────────────────────────────────────────────────
  // Render free tier suspends services after ~15 min of inactivity.
  // We ping our own /healthz every 4 minutes so the process stays awake
  // 24/7 without needing an external cron or Termux session.
  const selfPingUrl = (() => {
    const domain = getAppDomain();
    if (!domain) return null;
    return `${domain}/healthz`;
  })();

  if (selfPingUrl) {
    logger.info({ selfPingUrl }, "Self-ping keep-alive enabled (every 4 min)");
    setInterval(async () => {
      try {
        const res = await fetch(selfPingUrl);
        logger.debug({ status: res.status }, "Self-ping ok");
      } catch (err) {
        logger.warn({ err }, "Self-ping failed (transient, will retry)");
      }
    }, 4 * 60 * 1000);
  } else {
    logger.warn("Self-ping disabled — no REPLIT_DOMAINS or RENDER_EXTERNAL_URL set");
  }
});
