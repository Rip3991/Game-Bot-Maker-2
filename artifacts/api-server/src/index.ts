import app from "./app";
import { logger } from "./lib/logger";
import { getBotToken, sendTelegramRequest } from "./lib/telegram";

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
  const domains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "";
  const host = domains.split(",")[0].trim();
  if (!host) {
    logger.warn("No domain env var found — skipping webhook registration");
    return;
  }

  const webhookUrl = `https://${host}/api/telegram/webhook`;

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
});
