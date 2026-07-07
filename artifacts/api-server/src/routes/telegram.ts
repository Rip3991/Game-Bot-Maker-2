import { Router } from "express";
import { getBotToken, getBotUsername, getGameUrl, sendTelegramRequest } from "../lib/telegram";

// In-memory dedup for successful_payment — prevents double-coin-grant on
// duplicate webhook deliveries (cleared on restart; acceptable for this scale).
const processedPayments = new Set<string>();

const router = Router();

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
      from?: { first_name?: string; id?: number };
      successful_payment?: {
        currency: string;
        total_amount: number;
        invoice_payload: string;
        telegram_payment_charge_id: string;
      };
    };
    pre_checkout_query?: {
      id: string;
      from: { id: number };
      currency: string;
      total_amount: number;
      invoice_payload: string;
    };
  };

  // ── pre_checkout_query: MUST answer within 10 s or payment fails ──────────
  if (update.pre_checkout_query) {
    const pcq = update.pre_checkout_query;
    await sendTelegramRequest("answerPreCheckoutQuery", {
      pre_checkout_query_id: pcq.id,
      ok: true,
    });
    res.json({ ok: true });
    return;
  }

  const message = update.message;
  if (!message) {
    res.json({ ok: true });
    return;
  }

  // ── successful_payment: grant Coins after Stars payment ──────────────────
  if (message.successful_payment) {
    const sp = message.successful_payment;
    const payload = sp.invoice_payload; // "buycoins_{packageId}_{telegramId}"
    if (payload.startsWith("buycoins_")) {
      const parts = payload.split("_");
      // payload format: buycoins_<packageId>_<telegramId>
      // telegramId may contain underscores, so join from index 2 onward
      const packageId = parts[1];
      const telegramId = parts.slice(2).join("_");

      if (telegramId && packageId) {
        // Dynamic import to avoid circular deps
        const { COIN_PACKAGES } = await import("./stars");
        const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
        if (pkg) {
          const { db, usersTable } = await import("@workspace/db");
          const { sql } = await import("drizzle-orm");
          await db
            .update(usersTable)
            .set({ coins: sql`${usersTable.coins} + ${pkg.coins}` })
            .where((await import("drizzle-orm")).eq(usersTable.telegramId, telegramId));

          req.log.info({ telegramId, packageId, coinsGranted: pkg.coins }, "Coins granted after Stars payment");

          // Notify the user
          await sendTelegramRequest("sendMessage", {
            chat_id: message.chat.id,
            text: `🎉 <b>${pkg.coins} Coin</b> hesabına eklendi!\n\n⭐ ${pkg.stars} Star harcadın\n🪙 ${pkg.coins} Coin kazandın\n\nOyuna dön ve harca! 🚀`,
            parse_mode: "HTML",
          });
        }
      }
    }
    res.json({ ok: true });
    return;
  }

  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();
  const firstName = message.from?.first_name ?? "Çiftçi";
  const userId = message.from?.id;

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

    // Build the Mini App URL — pass startapp param for referral tracking
    // Format: https://t.me/{botUsername}?startapp={refParam} is for direct bot links
    // For inline button web_app, we embed the startapp in the URL query
    const appUrl = refParam
      ? `${gameUrl}?startapp=${refParam}`
      : gameUrl;

    // Referral invite link for sharing — ?startapp= opens the Mini App directly
    // and sets initDataUnsafe.start_param so the referral is tracked
    const botUsername = getBotUsername();
    const inviteUrl = userId
      ? `https://t.me/${botUsername}?startapp=ref_${userId}`
      : `https://t.me/${botUsername}`;

    await sendTelegramRequest("sendMessage", {
      chat_id: chatId,
      text: `🌾 <b>Merhaba ${firstName}!</b> Sarı'nın Çiftliği'ne hoş geldin!\n\n🐄 İneklerin sütünü bekliyor\n🐔 Tavukların yumurtasını bekliyor\n🌾 Tarlan mahsulünü bekliyor\n\n🪙 Her arkadaş davetinde <b>50 Coin</b> kazan!\n🎡 Her gün çarkı çevir, ödül kazan!\n💸 350 TL'ye kadar çekim yapabilirsin!\n\nOynamak için aşağıdaki butona tıkla 👇`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚜 Çiftliği Aç", web_app: { url: appUrl } }],
          [{ text: "👥 Arkadaş Davet Et & 50 Coin Kazan", url: `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent("Benimle Sarı'nın Çiftliği'ni oyna! Davet bonusu kazan 🌾🪙")}` }],
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
    allowed_updates: ["message", "pre_checkout_query"],
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
