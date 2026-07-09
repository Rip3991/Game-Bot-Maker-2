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

## Fixed: paid NFT case over-payout (2026-07-09)
The paid NFT case system (`CASE_DEFS` in `artifacts/api-server/src/routes/nfts.ts`)
had the same systemic over-payout problem at a much larger scale: `farm_case`
(75 TL) had an expected NFT payout of ~2,500 TL (~33x price); other cases were
32x-97x. Root cause: `NFT_DEFS.sellPrice`/`coinBonus` were priced as flavor/
collector values with no relation to case prices, and those raw values fed
directly into real TL payouts (`/nfts/sell`, case-open credit) and coin bonuses
(convertible to TL via `COIN_TO_TL_RATE`).

Fix: added a per-rarity `RARITY_SELL_PRICE_DIVISOR` (common:1.6, rare:20,
epic:150, special:50, legendary:800) and a `scaledSellPrice()` helper applied at
every point a real payout or player-facing price is derived from `NFT_DEFS`
(serialize, sell, case-open, cases listing incl. pool preview, market
prices/history). `coinBonus` is scaled by the same divisor. Raw `NFT_DEFS`
values are left untouched — they're the "display" numbers; scaling always
happens at the read site. Also retuned `CASE_DEFS.drops` to weight commons more
heavily. `sellPriceWeight()` (used only for within-rarity item selection, not
payout) intentionally still uses raw sellPrice — this is fine since it's
relative weighting, not an actual paid amount.

**Why this matters for future edits:** any NEW code path that reads
`NFT_DEFS[...].sellPrice` or `.coinBonus` directly (bypassing `scaledSellPrice`)
will silently reintroduce the old inflated real-money payout. Always scale at
the read site before crediting balance/coins or returning a price to the client.

## Follow-up: drop-rate ordering must match rarity value order (2026-07-09)
After the payout-scaling fix above, the user separately flagged that
`CASE_DEFS.drops` odds weren't consistently ordered by rarity value — e.g.
`epic_case` had `epic` odds (0.52) higher than `special` (0.10), and
`legend_case` had `epic` (0.35) higher than `special` (0.30), even though
`special` NFTs are worth less than `epic` (real value order, confirmed by
avg raw `sellPrice`: common ~123 < rare ~4691 < special ~14580 < epic ~71158 <
legendary ~471525). A higher-value rarity appearing more often than a
lower-value one undermines the whole payout fix.

**Rule:** within every case's `drops`, probabilities must strictly decrease in
value order `common > rare > special > epic > legendary` — never let a
later (more valuable) tier have equal or higher odds than an earlier one. Re-run
the EV/price check (weighted by `scaledSellPrice`, converting coin-priced cases
to TL via `COIN_TO_TL_RATE`) after any change to confirm both the ordering and
the ratio still hold.

## Also noted: no request-level auth
All `artifacts/api-server/src/routes/*.ts` money-moving endpoints (including
withdraw.ts) trust a client-supplied `telegramId` in the request body/params
with no signature/session check binding it to the actual caller. This is a
pre-existing, systemic gap across the whole API, not specific to any one route.
