/**
 * Shared Telegram API helper.
 * Used by both the webhook handler and background notifications.
 */

export function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

export function getBotUsername(): string {
  return process.env.BOT_USERNAME ?? "MemberGobot";
}

export function getAppDomain(): string {
  // Render.com provides this automatically after deploy
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, "");
  // Replit provides REPLIT_DOMAINS (production) or REPLIT_DEV_DOMAIN (dev)
  const domains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "";
  const primary = domains.split(",")[0].trim();
  return primary ? `https://${primary}` : "";
}

export function getGameUrl(): string {
  return getAppDomain();
}

/**
 * Send a Telegram Bot API request.
 * Returns the parsed JSON response (or null on error).
 */
export async function sendTelegramRequest(
  method: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const token = getBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  } catch (e) {
    console.error("[telegram] sendTelegramRequest failed", method, e);
    return null;
  }
}

/**
 * Send a simple HTML-formatted message to a Telegram chat.
 * Fire-and-forget — errors are swallowed.
 */
export async function notifyUser(
  chatId: string | number,
  text: string,
  extraOpts: Record<string, unknown> = {},
): Promise<void> {
  await sendTelegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extraOpts,
  });
}
