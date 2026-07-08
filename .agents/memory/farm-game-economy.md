---
name: Farm game real-money economy
description: How the farm-game's in-game currency, real TL balance, and withdrawal system relate — relevant for any future economy/monetization balancing work.
---

The idle farm game's in-game spendable currency (`state.balance` in the game engine, used to buy/upgrade farm sections) is saved directly into `usersTable.balance` on the server — the exact same field used for real-money TL withdrawals. There is no separate "coin → TL" exchange step for that balance; selling farm products adds straight to withdrawable TL.

**Why:** This matters for any "difficulty/economy balance" request — increasing sell prices or automation (auto-sell) directly increases how fast users can accumulate real cash, not just game progress. `usersTable.coins` is a separate field used for cosmetic/task/referral rewards and is not withdrawable.

**How to apply:** Before tuning `SECTIONS` rates/prices in `use-game-engine.ts` for "make it harder/easier to earn," remember it changes real payout velocity. Prefer tuning active-earning channels (tasks, referrals, streak bonuses in `users.ts`/`tasks.ts`) or withdrawal gating (`withdraw.ts`) over touching farm sell-price curves, since existing players' saved balances/expectations would be affected by curve changes.
