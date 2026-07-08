---
name: Coin/Star/TL economy margin design
description: How Coin Shop and NFT case payouts must be sized relative to Telegram Stars revenue to keep the house profitable.
---

## Rule
Any feature that lets a user convert in-game Coins into real TL (shop items, NFT
case drops, coin→TL converters) must be priced against the *worst-case* Coin
acquisition cost — the cheapest Stars→Coins package rate — not an average, since
a rational user always buys from the cheapest pack. Treat coins earned for free
(spins/tasks/referrals) as zero-revenue-backed when sizing payouts; a rate that's
safe even for 100% free-farmed coins is safe overall.

**Why:** the original Coin Shop item `tl_ultra` paid 6,000 TL for 200 Coins
(~14 Stars) while real net revenue per Star is only a few kuruş — a severe,
real-money loss on every use. A "free NFT case" coin-shop item (120 coins) also
had a 20% chance to mint rare NFTs worth 1,500–7,000+ TL, another major loss
vector, because NFT sell prices were untouched by the same margin logic.

**How to apply:** centralize the real-world assumption (net TL received per
Star after Telegram's cut) in one named constant with a comment telling the
operator to verify/update it — don't hardcode the derived rate in multiple
places. The operator did not know their exact net-per-Star figure when asked;
`artifacts/api-server/src/routes/stars.ts` has `NET_TL_PER_STAR` as the single
adjustable placeholder (0.30 TL/star) driving `COIN_TO_TL_RATE`.

## Known related gap (not yet fixed)
The *paid* NFT case system (`CASE_DEFS` in `artifacts/api-server/src/routes/nfts.ts`,
e.g. `farm_case` 75 TL) appears to have the same systemic over-payout problem at
larger scale — its expected NFT payout looks far higher than its TL price. This
was flagged to the user as a separate, bigger follow-up (would require repricing
all cases and NFT sell prices) and intentionally left out of scope.

## Also noted: no request-level auth
All `artifacts/api-server/src/routes/*.ts` money-moving endpoints (including
withdraw.ts) trust a client-supplied `telegramId` in the request body/params
with no signature/session check binding it to the actual caller. This is a
pre-existing, systemic gap across the whole API, not specific to any one route.
