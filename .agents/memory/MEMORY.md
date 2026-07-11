# Memory Index

- [Telegram bot token debugging](telegram-bot-token-debugging.md) — an env var/secret can show as "exists" via viewEnvVars yet be empty in the running process; verify actual length via a temp debug log, not just existence.
- [Farm game real-money economy](farm-game-economy.md) — in-game farm balance and withdrawable TL are the same DB field; economy tuning must consider real payout impact.
- [Daily streak calendar-day comparison](daily-streak-day-boundary.md) — "N days in a row" logic must diff calendar-day boundaries, not rolling hours-since, when the anchor timestamp updates more than once/day.
- [Coin/Star/TL economy margin design](coin-economy-margin-design.md) — size any Coin→TL payout against the cheapest Stars→Coin rate and zero-revenue free coins, not an average.
- [Farm game currency prop/label consistency](farm-game-currency-labels.md) — a shop screen's cost label/prop can silently point at the wrong currency (TL vs Coin) while the purchase action spends the other one.
- [video-js subagent image references](video-js-subagent-image-refs.md) — the design subagent for video-js often writes scene code referencing image files it never actually generates/copies; verify every referenced path exists before presenting.
