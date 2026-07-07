import { Router } from "express";

const router = Router();

function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function getGameUrl(): string {
  const domains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "";
  const primary = domains.split(",")[0].trim();
  return primary ? `https://${primary}` : "";
}

async function sendTelegramRequest(
  method: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const token = getBotToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// POST /telegram/webhook  — receives updates from Telegram
router.post("/telegram/webhook", async (req, res): Promise<void> => {
  const token = getBotToken();
  if (!token) {
    req.log.error("TELEGRAM_BOT_TOKEN is not configured");
    res.status(500).json({ error: "Bot not configured" });
    return;
  }

  const update = req.body as {
    message?: {
      chat: { id: number };
      text?: string;
      from?: { first_name?: string };
    };
  };

  const message = update.message;
  if (!message) {
    res.json({ ok: true });
    return;
  }

  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();
  const firstName = message.from?.first_name ?? "Çiftçi";

  if (text === "/start" || text.startsWith("/start ")) {
    const gameUrl = getGameUrl();

    if (!gameUrl) {
      req.log.warn("Game URL could not be determined — REPLIT_DOMAINS not set");
      await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Oyun URL'si henüz ayarlanmadı. Lütfen daha sonra tekrar dene.",
      });
      res.json({ ok: true });
      return;
    }

    // Extract referral param: /start ref_<telegramId>
    const startParam = text.replace("/start", "").trim();
    const refParam = startParam.startsWith("ref_") ? startParam : "";
    const appUrl = refParam ? `${gameUrl}?startapp=${refParam}` : gameUrl;

    await sendTelegramRequest("sendMessage", {
      chat_id: chatId,
      text: `🌾 <b>Merhaba ${firstName}!</b> Çiftliğine hoş geldin!\n\n🐄 İneklerin sütünü bekliyor\n🐔 Tavukların yumurtasını bekliyor\n🌾 Tarlan mahsulünü bekliyor\n\n🪙 Arkadaşlarını davet et, <b>500 Coin</b> kazan!\n🎡 Her gün çarkı çevir, ödül kazan!\n⭐ Coinleri Telegram Stars'a çevir!\n\nOynamak için aşağıdaki butona tıkla:`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚜 Çiftliği Aç", web_app: { url: appUrl } }],
          [{ text: "👥 Arkadaş Davet Et", switch_inline_query: `Çiftlik oyununu oyna! Her davet = 500 Coin ${gameUrl}` }],
        ],
      },
    });
  }

  res.json({ ok: true });
});

// GET /telegram/set-webhook  — call this once to register the webhook with Telegram
router.get("/telegram/set-webhook", async (req, res): Promise<void> => {
  const token = getBotToken();
  if (!token) {
    res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not set" });
    return;
  }

  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const domains = process.env.REPLIT_DOMAINS;
  const host = (domains ? domains.split(",")[0].trim() : null) ?? devDomain;
  if (!host) {
    res.status(500).json({ error: "Could not determine host domain (REPLIT_DEV_DOMAIN / REPLIT_DOMAINS not set)" });
    return;
  }
  const webhookUrl = `https://${host}/api/telegram/webhook`;

  const result = await sendTelegramRequest("setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message"],
  });

  req.log.info({ webhookUrl, result }, "Webhook set");
  res.json({ webhookUrl, result });
});

// GET /telegram/webhook-info  — check current webhook status
router.get("/telegram/webhook-info", async (req, res): Promise<void> => {
  const result = await sendTelegramRequest("getWebhookInfo", {});
  res.json(result);
});

export default router;
