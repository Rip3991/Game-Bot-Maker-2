---
name: Farm game currency prop/label consistency
description: Root cause pattern for "purchases don't deduct balance" bugs in the farm game shop UI.
---

The shop UI (FarmPlot, PurchaseSheet in GameView.tsx) once took a `balance` prop (TL) for
cost/afford comparisons and labeled costs "TL", while the actual purchase actions
(unlockSection/buyUnit/replantPlot in use-game-engine.ts) always spent `coins`, never `balance`.
Since TL was never touched, the displayed balance never appeared to decrease when buying,
even though the purchase logic itself worked correctly.

**Why:** the game has two separate currencies (Coin = in-game, TL = real-money/withdrawable)
that share visual space in the UI; a copy-paste or prop-naming slip silently pairs the wrong
currency with a given screen, and since both are "numbers going down after a click" it isn't
caught by casual testing.

**How to apply:** whenever adding/editing any purchase, cost, or reward UI in this game, verify
the prop name, the state field it reads, and the visible label/emoji (🪙 Coin vs TL) all agree,
and trace forward to which state field the action handler actually mutates. Don't trust the
label text alone.
