import { Router } from "express";
import { getBotToken, getBotUsername, getGameUrl, sendTelegramRequest } from "../lib/telegram";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const processedPayments = new Set<string>();

// Cache Telegram file_id after first upload so subsequent /start calls are instant
let cachedBannerFileId: string | null = null;

const router = Router();

function isAdmin(telegramId?: number | string): boolean {
  const adminIds = process.env.ADMIN_TELEGRAM_IDS ?? "";
  if (!adminIds) return false;
  return adminIds.split(",").map(s => s.trim()).includes(String(telegramId));
}

function getBannerUrl(): string {
  const domains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "";
  const primary = domains.split(",")[0].trim();
  return primary ? `https://${primary}/telegram-banner.jpg` : "";
}

router.post("/telegram/webhook", async (req, res): Promise<void> => {
  const token = getBotToken();
  if (!token) {
    req.log.error("TELEGRAM_BOT_TOKEN is not configured");
    res.status(500).json({ error: "Bot not configured" });
    return;
  }

  // Respond immediately so Telegram doesn't retry and user sees instant reply
  res.json({ ok: true });

  const update = req.body as {
    message?: {
      chat: { id: number };
      text?: string;
      from?: { first_name?: string; id?: number; username?: string };
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

  if (update.pre_checkout_query) {
    const pcq = update.pre_checkout_query;
    await sendTelegramRequest("answerPreCheckoutQuery", {
      pre_checkout_query_id: pcq.id,
      ok: true,
    });
    return;
  }

  const message = update.message;
  if (!message) return;

  if (message.successful_payment) {
    const sp = message.successful_payment;
    const payload = sp.invoice_payload;
    if (payload.startsWith("buycoins_")) {
      const parts = payload.split("_");
      const packageId = parts[1];
      const telegramId = parts.slice(2).join("_");

      if (telegramId && packageId) {
        const { COIN_PACKAGES } = await import("./stars");
        const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
        if (pkg) {
          await db
            .update(usersTable)
            .set({ coins: sql`${usersTable.coins} + ${pkg.coins}` })
            .where(eq(usersTable.telegramId, telegramId));

          req.log.info({ telegramId, packageId, coinsGranted: pkg.coins }, "Coins granted after Stars payment");

          await sendTelegramRequest("sendMessage", {
            chat_id: message.chat.id,
            text: `🎉 <b>${pkg.coins} Coin</b> hesabına eklendi!\n\n⭐ ${pkg.stars} Star harcadın\n🪙 ${pkg.coins} Coin kazandın\n\nOyuna dön ve harca! 🚀`,
            parse_mode: "HTML",
          });
        }
      }
    }
    return;
  }

  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();
  const firstName = message.from?.first_name ?? "Çiftçi";
  const userId = message.from?.id;

  // ── /myid — show user their Telegram ID ──────────────────────────────────
  if (text === "/myid") {
    await sendTelegramRequest("sendMessage", {
      chat_id: chatId,
      text: `🪪 <b>Telegram ID'niz:</b> <code>${userId}</code>\n\nBu numarayı admin paneli için kullanabilirsiniz.`,
      parse_mode: "HTML",
    });
    return;
  }

  // ── Admin commands — only allowed for ADMIN_TELEGRAM_IDS ─────────────────
  if (text.startsWith("/addbalance") || text.startsWith("/addcoins")) {
    if (!isAdmin(userId)) {
      await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text: "⛔ Bu komuta erişim yetkiniz yok.",
      });
      return;
    }

    const parts = text.split(" ");
    const command = parts[0];
    const targetId = parts[1];
    const amount = parseFloat(parts[2]);

    if (!targetId || isNaN(amount) || amount <= 0) {
      await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text: `❌ Kullanım:\n<code>${command} &lt;telegramId&gt; &lt;miktar&gt;</code>\n\nÖrnek: <code>${command} 123456789 100</code>`,
        parse_mode: "HTML",
      });
      return;
    }

    const targetUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.telegramId, targetId),
    });

    if (!targetUser) {
      await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text: `❌ Kullanıcı bulunamadı: <code>${targetId}</code>`,
        parse_mode: "HTML",
      });
      return;
    }

    if (command === "/addbalance") {
      await db
        .update(usersTable)
        .set({ balance: sql`${usersTable.balance} + ${amount}` })
        .where(eq(usersTable.telegramId, targetId));

      await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text: `✅ <b>${targetUser.firstName}</b> (<code>${targetId}</code>) kullanıcısına <b>${amount} TL</b> bakiye eklendi!`,
        parse_mode: "HTML",
      });

      await sendTelegramRequest("sendMessage", {
        chat_id: Number(targetId),
        text: `🎁 <b>Admin tarafından hediye!</b>\n\nBakiyenize <b>${amount} TL</b> eklendi! 🎉\n\nOyuna girin ve kullanın! 🌾`,
        parse_mode: "HTML",
      }).catch(() => {});
    } else {
      await db
        .update(usersTable)
        .set({ coins: sql`${usersTable.coins} + ${amount}` })
        .where(eq(usersTable.telegramId, targetId));

      await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text: `✅ <b>${targetUser.firstName}</b> (<code>${targetId}</code>) kullanıcısına <b>${amount} Coin</b> eklendi!`,
        parse_mode: "HTML",
      });

      await sendTelegramRequest("sendMessage", {
        chat_id: Number(targetId),
        text: `🎁 <b>Admin tarafından hediye!</b>\n\nHesabınıza <b>${amount} Coin</b> eklendi! 🪙\n\nOyuna girin ve harcayın! 🌾`,
        parse_mode: "HTML",
      }).catch(() => {});
    }

    return;
  }

  // ── /adminhelp — show admin commands ─────────────────────────────────────
  if (text === "/adminhelp" && isAdmin(userId)) {
    await sendTelegramRequest("sendMessage", {
      chat_id: chatId,
      text: `🛠️ <b>Admin Komutları</b>\n\n` +
        `/addbalance &lt;telegramId&gt; &lt;miktar&gt;\n  → Kullanıcıya TL bakiye ekle\n\n` +
        `/addcoins &lt;telegramId&gt; &lt;miktar&gt;\n  → Kullanıcıya Coin ekle\n\n` +
        `/myid\n  → Kendi Telegram ID'ni göster\n\n` +
        `📌 Kullanıcıların ID'sini öğrenmek için onlara /myid komutunu kullandırın.`,
      parse_mode: "HTML",
    });
    return;
  }

  // ── /start — welcome photo + message with buttons ─────────────────────────
  if (text === "/start" || text.startsWith("/start ")) {
    const gameUrl = getGameUrl();

    if (!gameUrl) {
      req.log.warn("Game URL could not be determined — REPLIT_DOMAINS not set");
      await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Oyun URL'si henüz ayarlanmadı. Lütfen daha sonra tekrar dene.",
      });
      return;
    }

    const startParam = text.replace("/start", "").trim();
    const refParam = startParam.startsWith("ref_") ? startParam : "";

    const appUrl = refParam
      ? `${gameUrl}?startapp=${refParam}`
      : gameUrl;

    const botUsername = getBotUsername();
    const inviteUrl = userId
      ? `https://t.me/${botUsername}?start=ref_${userId}`
      : `https://t.me/${botUsername}`;

    const rawChannel = process.env.ANNOUNCEMENT_CHANNEL ?? "sarinoyunciftligi";
    // Strip leading @ so the URL is always well-formed
    const announcementChannel = rawChannel.replace(/^@/, "");
    const bannerUrl = getBannerUrl();

    const caption = `🌾 <b>Merhaba ${firstName}!</b>\n\nSarı'nın Çiftliği'ne hoş geldin! 🐄🐔🌾\n\n` +
      `✨ <b>Neler yapabilirsin?</b>\n` +
      `🌾 Çiftliğini büyüt, mahsul yetiştir\n` +
      `🐄 Hayvanlardan ürün topla ve sat\n` +
      `🪙 Her arkadaş davetinde <b>50 Coin</b> kazan\n` +
      `🎡 Her gün çarkı çevir, ödül kazan\n` +
      `💸 Kazandığını gerçek paraya çevir\n\n` +
      `👇 <b>Oyuna girmek için aşağıdaki butona bas!</b>`;

    const reply_markup = {
      inline_keyboard: [
        [{ text: "🌾 Oyuna Giriş Yap", web_app: { url: appUrl } }],
        [{ text: "📢 Kanalımıza Katıl", url: `https://t.me/${announcementChannel}` }],
        [{ text: "👥 Arkadaş Davet Et, Coin Kazan", url: `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent("Benimle Sarı'nın Çiftliği'ni oyna! Davet bonusu kazan 🌾🪙")}` }],
      ],
    };

    if (cachedBannerFileId || bannerUrl) {
      // Use cached file_id for instant send; fall back to URL on first run
      const photoVal = cachedBannerFileId ?? bannerUrl;
      const photoRes = await sendTelegramRequest("sendPhoto", {
        chat_id: chatId,
        photo: photoVal,
        caption,
        parse_mode: "HTML",
        reply_markup,
      }) as { result?: { photo?: Array<{ file_id: string }> } } | null;

      // Cache file_id from Telegram's response for future sends
      if (!cachedBannerFileId && photoRes?.result?.photo) {
        const photos = photoRes.result.photo;
        const largest = photos[photos.length - 1];
        if (largest?.file_id) {
          cachedBannerFileId = largest.file_id;
        }
      }
    } else {
      await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text: caption,
        parse_mode: "HTML",
        reply_markup,
      });
    }

    return;
  }
});

// GET /telegram/set-webhook
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
    res.status(500).json({ error: "Could not determine host domain" });
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

// GET /telegram/webhook-info
router.get("/telegram/webhook-info", async (req, res): Promise<void> => {
  const result = await sendTelegramRequest("getWebhookInfo", {});
  res.json(result);
});

export default router;
