---
name: Farm game real-money economy
description: How the farm-game's in-game currency, real TL balance, and withdrawal system relate — relevant for any future economy/monetization balancing work.
---

Current flow (verified 2026-07-10, corrects an earlier stale note): harvesting
crops/animals fills `storage`; `sellProducts()` in `use-game-engine.ts` converts
storage into `coins` (NOT `balance`/TL directly) at `SECTIONS[].sellPrice` per
unit. Coins are only turned into withdrawable TL through the explicit
`COIN_TO_TL_RATE` converter (`/stars/convert-coins-to-tl`, saved to
`usersTable.balance`). Direct TL sources are separate and smaller: task
rewards (`tasks.ts` `reward.tl`), referral TL (`REFERRAL_TL`/
`SECOND_TIER_REFERRAL_TL` in `users.ts`), and `WELCOME_BONUS`.

**Why:** This matters for any "difficulty/economy balance" request — tuning
`SECTIONS.sellPrice` changes coin-earning speed, which only translates to real
payout velocity through the conversion rate. Tuning `COIN_TO_TL_RATE` (or its
`MIN_COIN_CONVERT` floor) and withdrawal minimums (`withdraw.ts`
`ALLOWED_WITHDRAW_AMOUNTS`) are the direct real-money levers.

**How to apply:** When asked to tighten/loosen the economy, treat these as
independent levers and change all of them together for a coherent pass: (1)
coin-earning rate (`sellPrice`, spin `coinsEarned`, task `coins`, referral
coins), (2) direct TL rewards (task `tl`, referral TL, `WELCOME_BONUS`), (3)
`COIN_TO_TL_RATE`/`MIN_COIN_CONVERT`, (4) `ALLOWED_WITHDRAW_AMOUNTS`. Every
number is duplicated in a client-side display constant/string (i18n.ts,
WithdrawModal.tsx, SpinPage.tsx, InvitePage.tsx, MascotTutorial.tsx,
WelcomePage.tsx, telegram.ts bot copy) — grep for the old literal values across
the whole repo after changing a constant, not just the source of truth file,
or the UI will advertise stale numbers.
