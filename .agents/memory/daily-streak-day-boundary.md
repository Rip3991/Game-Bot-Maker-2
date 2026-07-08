---
name: Daily streak calendar-day comparison
description: Why daily-login streak logic must compare calendar-day boundaries, not "hours since last login" rolling windows.
---

`usersTable.streakCount` (in `artifacts/api-server/src/routes/users.ts`, `POST /users/init`) increments/resets by comparing UTC calendar days via a `utcDayStart()` helper (`diffDays === 0` no change, `=== 1` increment, `>= 2` reset to 1).

**Why:** An earlier version compared `hoursSince last login >= 24/48`. `lastLoginAt` is overwritten on every app open, so a user opening the app more than once in a day kept resetting the anchor timestamp — a legitimate next-day login could land <24h after that later same-day open and silently fail to increment, breaking the streak for active players.

**How to apply:** Any future "N days in a row" feature (not just login streak) must diff calendar-day boundaries of two timestamps, not a rolling hour count, whenever the anchor timestamp can be updated more than once per day.
