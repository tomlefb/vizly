# vizly-cron — daily renewal reminder trigger
#
# This image is intentionally minimal: it just makes a single HTTP POST
# to the Vizly Next.js cron endpoint and exits. The actual logic
# (querying users, filtering, sending emails) lives in the main Vizly
# app at /api/cron/renewal-reminder. This service is just the trigger.
#
# Used by Railway service `vizly-cron` with cron schedule `0 8 * * *`
# (8h00 UTC daily). See the Bloc 7 instructions in the sprint notes for
# Railway dashboard config (env vars, source root directory, schedule).

FROM alpine:3.20

RUN apk add --no-cache curl ca-certificates

# The container start command runs at each cron fire. It:
#  1. POSTs to the Vizly cron endpoint with the auth header
#  2. Prints HTTP code + duration to stdout (Railway captures it as logs)
#  3. Exits 0 on 2xx (curl -f) or 22 on HTTP errors (Railway marks failure)
#
# Required env vars (set in the Railway service config):
#   - CRON_SECRET    : shared with the Vizly main service for X-Cron-Secret auth
#   - VIZLY_API_URL  : base URL, e.g. https://vizly.fr
CMD ["sh", "-c", "curl -fSsw 'HTTP %{http_code} in %{time_total}s\\n' -X POST -H \"X-Cron-Secret: $CRON_SECRET\" \"$VIZLY_API_URL/api/cron/renewal-reminder\""]
