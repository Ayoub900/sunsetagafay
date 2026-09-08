#!/bin/sh
# Reconciliation sweep — the cron half of /api/payment/reconcile.
#
# Surfaces orders that need a human to check them against the CMI Merchant
# Center (PENDING older than 1h, anything UNDER_RECONCILIATION) and cancels
# PENDING orders older than 24h. Without this running, a payment whose callback
# never arrived sits UNDER_RECONCILIATION forever and nobody finds out.
#
# Install on the server (hourly, at :05):
#
#   chmod +x /var/www/sunsetagafay/scripts/reconcile-cron.sh
#   crontab -e
#   5 * * * * /var/www/sunsetagafay/scripts/reconcile-cron.sh >> /var/log/sunset-reconcile.log 2>&1
#
# Reads CRON_SECRET from the app's .env. Calls the app directly on localhost, so
# the secret never crosses the public internet and nginx is bypassed.
#
# Override the defaults with environment variables if the layout differs:
#   APP_DIR=/srv/app RECONCILE_URL=http://127.0.0.1:4000 ./scripts/reconcile-cron.sh

set -eu

APP_DIR="${APP_DIR:-$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)}"
BASE="${RECONCILE_URL:-http://127.0.0.1:3000}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"

stamp() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
fail() { echo "$(stamp) [reconcile] ERROR: $1" >&2; exit 1; }

[ -r "$ENV_FILE" ] || fail "cannot read $ENV_FILE"

# Pull CRON_SECRET out of .env without sourcing the file (it contains values
# with characters a shell would happily interpret).
SECRET=$(sed -n 's/^[[:space:]]*CRON_SECRET[[:space:]]*=[[:space:]]*//p' "$ENV_FILE" \
  | head -n 1 | sed 's/^"//; s/"$//; s/^'\''//; s/'\''$//')
[ -n "$SECRET" ] || fail "CRON_SECRET is not set in $ENV_FILE"

BODY_FILE=$(mktemp)
trap 'rm -f "$BODY_FILE"' EXIT

CODE=$(curl -sS -m 60 -o "$BODY_FILE" -w '%{http_code}' \
  -X POST "$BASE/api/payment/reconcile?expire=true" \
  -H "x-cron-secret: $SECRET") || fail "request to $BASE failed"

[ "$CODE" = "200" ] || fail "HTTP $CODE — $(cat "$BODY_FILE")"

# One line per run, counts only. The endpoint's full response lists customer
# emails, which must not accumulate in a log file — read the detail by calling
# the endpoint directly when a count is non-zero. A quiet run still logs, so
# silence in this file means the cron itself stopped.
counts=$(tr -d ' \n' < "$BODY_FILE" \
  | sed -n 's/.*"counts":{"stalePending":\([0-9]*\),"underReconciliation":\([0-9]*\),"expired":\([0-9]*\)}.*/stale=\1 under_reconciliation=\2 expired=\3/p')
[ -n "$counts" ] || fail "unexpected response shape from $BASE"

echo "$(stamp) [reconcile] $counts"

# Anything under reconciliation is money that may have moved without the order
# knowing. Exit non-zero so cron's own mail (or your monitoring) raises it.
case "$counts" in
  *under_reconciliation=0*) ;;
  *) echo "$(stamp) [reconcile] orders need checking against the CMI Merchant Center" >&2
     exit 2 ;;
esac
