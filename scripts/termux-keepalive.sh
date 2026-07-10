#!/data/data/com.termux/files/usr/bin/bash
#
# Render.com "Always Free" keep-alive pinger for Termux (Android).
#
# Render's free web services spin down after ~15 minutes of no traffic and take
# 30-60s to wake back up on the next request. This script pings the app's
# health check endpoint every few minutes so it never goes to sleep.
#
# SETUP (on your Android phone):
#   1. Install Termux from F-Droid (the Play Store build is outdated/broken).
#   2. In Termux:  pkg update && pkg install curl cronie termux-services
#   3. Copy this file to Termux, e.g.:  ~/termux-keepalive.sh
#   4. Edit RENDER_URL below to match your Render service's public URL.
#   5. chmod +x ~/termux-keepalive.sh
#
# RUNNING IT (pick one):
#   A) Simple, must keep Termux session open (use `termux-wake-lock` first so
#      Android doesn't kill it, and disable battery optimization for Termux):
#         termux-wake-lock
#         ~/termux-keepalive.sh          # loops forever, Ctrl+C to stop
#
#   B) Cron-based, survives Termux app restarts better:
#         sv-enable crond                     # enable the cron service once
#         crontab -e
#         # add this line (pings every 5 minutes):
#         */5 * * * * curl -fsS https://YOUR-APP.onrender.com/api/healthz >/dev/null 2>&1
#
# NOTE: Android will still eventually kill background processes to save
# battery unless you disable battery optimization for Termux (Settings >
# Apps > Termux > Battery > Unrestricted) and keep the phone charged/on Wi-Fi.
# This is inherently less reliable than Render's paid "Always On" plan or
# hosting the bot on Replit directly — use it only if staying on the Render
# free tier is a hard requirement.

set -u

# ── Configure this ──
RENDER_URL="https://game-bot-maker-2.onrender.com/api/healthz"
INTERVAL_SECONDS=240   # 4 minutes — safely under Render's ~15min idle timeout

echo "Pinging $RENDER_URL every ${INTERVAL_SECONDS}s to keep it awake. Ctrl+C to stop."

while true; do
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  if curl -fsS -m 20 "$RENDER_URL" >/dev/null 2>&1; then
    echo "[$timestamp] ping OK"
  else
    echo "[$timestamp] ping FAILED (service may be waking up or down)"
  fi
  sleep "$INTERVAL_SECONDS"
done
