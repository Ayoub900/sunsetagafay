# CMI Payment Integration — Security Audit

Date: 2026-07-17 · Scope: the CMI payment surface (`lib/cmi/*`,
`app/api/payment/*`, payment pages, related schema) plus its touchpoints with
the rest of the site. Method: line-by-line review of every payment file against
the CMI V2.0 PDF, threat-modeling each endpoint (who can call it, with what,
to what effect), and re-running the end-to-end harness after each fix.

## Verdict

No customer card data ever touches this codebase (Hosted Payment Page model),
no secrets reach the client, and order-state integrity is enforced atomically
in the database. The issues found in this audit were **hardening and race
conditions**, not exploitable payment bypasses — all are fixed (§2). Residual
risks that need an operational decision are listed in §4.

---

## 1. Threat model

| Actor | Capability | What they want |
| --- | --- | --- |
| Malicious customer | Full control of their browser: edit hidden fields, replay POSTs, call any public endpoint | Pay less / not at all, get a confirmed order without paying |
| External attacker | Can POST anything to the public endpoints (`initiate`, `callback`, `ok`, `fail`, `reconcile`) | Forge a paid order, flood the DB, extract data, deny service |
| Person with the store key | Can sign arbitrary requests and callbacks | (Catastrophic — see §4.1) |

Trust boundaries: the browser is never trusted for *anything* that affects
money; CMI is trusted **only after** hash verification; env vars and the DB
are trusted.

## 2. Findings fixed in this audit

| # | Severity | Finding | Fix |
| --- | --- | --- | --- |
| 1 | **High** (state integrity) | A payment retry reset the order to `PENDING` from *any* non-final state — including `UNDER_RECONCILIATION`, whose whole meaning is “the customer may already have paid”. A customer could then be charged a second time for the same stay (CMI would reject the same oid after a success, but not after an unconfirmed pre-auth on a failed callback). | `createOrLoadOrderForReservation` now refuses to re-initiate anything that isn’t `PENDING`; those requests are redirected to the status page, which tells the customer not to pay again. |
| 2 | **High** (race) | Retry used read-then-write: a success callback landing between the read and the `update` would have its `PAID` status overwritten back to `PENDING`. Narrow window, catastrophic effect (a paid order that looks unpaid). | The retry refresh is now a conditional `updateMany({where: {status: 'PENDING'}})`; if it matched nothing, the current state is re-read and honored. A `PAID` order is now un-downgradable from every code path. |
| 3 | Medium (DoS) | The spec-mandated public endpoints (`callback`, `ok`, `fail`) persisted every received payload to MongoDB — including unverifiable junk with unknown oids. An attacker could grow the `PaymentCallback` collection without bound and drown real alerts. | Invalid-hash payloads for **unknown** orders are now log-only; DB persistence requires a matching order. Added per-IP rate limits (120/min callback, 60/min ok/fail — far above legit traffic of one request per attempt) and a 64 KB body cap before parsing. |
| 4 | Medium (race) | Two concurrent initiates for the same reservation crashed the loser on the `reservationId` unique index (P2002 → customer-facing 500). | P2002 is caught; the loser loads and reuses the winner’s order (same oid — exactly the retry semantics). |
| 5 | Low (correctness of a guard) | `fulfillPaidOrder`’s idempotency stamp used read-then-check (a previous fix for Prisma-on-Mongo’s `null`-doesn’t-match-missing-field behavior), reintroducing a theoretical double-fulfillment TOCTOU. | Restored the atomic `updateMany` claim using `OR: [{fulfilledAt: null}, {fulfilledAt: {isSet: false}}]` — the Mongo-correct way to match “not yet set”. |
| 6 | Low (timing) | `CRON_SECRET` was compared with `===`, which leaks match-length timing. | Now compared with the same `timingSafeEqual` wrapper used for hashes. |
| 7 | Info (spec drift) | `rnd` was 32 hex chars (PDF says format (20)); `symbolCur` was `€` (PDF examples are ISO codes); `sessiontimeout` undocumented-max assumption. | `rnd` is now 20 alphanumeric chars; `symbolCur` is `EUR`; `sessiontimeout=2700` confirmed as the PDF’s documented maximum. Spec drift is a security issue here because a gateway-side rejection pushes customers into the manual-reconciliation path. |

All fixes were re-verified: `npm test` (23/23, now including the official PDF
§4.1.4 fixture) and the live end-to-end harness (22/22: signed initiate with
independently recomputed hash, success/duplicate/tampered/failed callbacks,
no-downgrade, single fulfillment).

## 3. Properties verified as sound (no action needed)

- **No client-side trust:** the browser sends only `reservationId`, `lang`,
  `acceptTerms`. Amount, currency, identity, and description are recomputed
  from the DB in `initiate`. Tampering with the wizard changes nothing.
- **Hash discipline:** one shared implementation for sign + verify; verify
  covers *all* received params (case-insensitive exclusions), constant-time
  compare with length pre-check (`timingSafeEqual` never throws on shaped
  input); accents/UTF-8 preserved end-to-end; anti-XSS `document` rule applied.
  Confirmed byte-identical to the official PDF worked example.
- **State machine:** every transition is a single conditional `updateMany`.
  `PAID`/`REFUNDED`/`CANCELLED` cannot be downgraded by any request in the
  codebase; the callback alone can set `PAID`; okUrl can only set
  `UNDER_RECONCILIATION` from `PENDING`.
- **Idempotency:** unique index on `PaymentCallback.fingerprint`
  (TransId-based) + atomic paid-claim + atomic fulfillment claim ⇒ duplicate
  callback delivery cannot double-persist or double-fulfill.
- **Injection surfaces:** the auto-submit form HTML-escapes every name/value;
  result pages render CMI data through React (auto-escaped); log lines are
  `JSON.stringify`-ed (no log-line injection); Prisma parameterizes all queries
  (no NoSQL injection from param values); `lang` is whitelisted to `en|fr`
  before entering any URL or HTML.
- **Redirect safety:** all redirects are built from constant internal paths;
  attacker-controlled values only ever appear as URL-encoded query *values*
  (`oid`, `r`), never as the redirect target — no open-redirect.
- **Secrets hygiene:** `lib/cmi/config.ts` and friends are `server-only`
  (build fails if imported client-side); `.env*` is gitignored; the store key,
  hash plaintext, and full PANs are never logged (redaction list in
  `observability.ts`; `MaskedPan` as received is the only card datum stored).
- **Customer-facing opacity:** decline reasons (`ErrCode`/`ErrMsg`) are logged
  and persisted but never displayed — the failure page is generic, per
  fraud-prevention practice. Internal errors return generic pages, never stack
  traces.
- **Admin surface:** `/admin/payments` sits behind the existing proxy cookie
  gate + `(protected)` layout; the reconcile endpoint requires `CRON_SECRET`.
- **Compliance gates:** terms-acceptance is enforced server-side in `initiate`
  (the client checkbox alone is not trusted).

## 4. Residual risks & operational recommendations

1. **The store key is the crown jewel.** Anyone holding it can forge a valid
   *success callback* and flip a `PENDING` order to `PAID` without paying
   (amount must still match, so they can’t change prices — but they can get a
   free stay). Mitigations in place: server-only module, no logging, env-only.
   Recommended: restrict who can read production env vars, rotate the key on
   staff changes, and reconcile `PAID` orders against the Merchant Center
   before honoring high-value stays (the admin Payments page shows both).
2. **In-memory rate limiter.** `lib/rate-limit.ts` is per-process. Under a
   multi-instance/serverless deployment each instance has its own counters, so
   the effective limit multiplies. Acceptable for current single-instance
   hosting; move to a shared store (Redis/Upstash) if you scale out.
3. **Alerts are log lines.** `alertPayment` emits structured
   `[cmi][alert][KIND]` lines but nobody is paged. Before go-live, wire it to
   email/Slack — hash-verification failures and amount mismatches are
   attack signals that deserve eyes. (Hook point: `lib/cmi/observability.ts`.)
4. **Mongo indexes must exist in production.** Idempotency and oid-uniqueness
   are enforced by unique indexes that only `prisma db push` (or manual
   `createIndexes`) creates. The push is currently blocked by a pre-existing
   duplicate `SiteSettings.key="default"` document — dedupe it before or
   during deployment. Without the indexes the code still works, but duplicate
   callbacks would create duplicate rows (fulfillment remains single-shot via
   the atomic claim).
5. **PII retention.** `Order` and `PaymentCallback.raw` store customer name,
   email, phone, and masked PAN indefinitely — appropriate for accounting and
   disputes, but define a retention window (e.g. purge raw payloads after the
   dispute horizon) for data-protection hygiene (Loi 09-08/GDPR-adjacent).
6. **Site-wide headers.** The app sets no CSP/HSTS headers. Not a
   payment-specific hole (no card data here), but HSTS in particular matters
   because the entire scheme rides on HTTPS. Configure at the host/`next.config`
   level.
7. **Test-key hygiene.** `.env.local` currently holds the fake
   `TESTSTOREKEY12345`. Fine for dev; just never let a test key reach the
   production environment — `config.ts` cannot tell a weak real key from a
   strong one (it only rejects `SKS`).
8. **`ProcReturnCode` `"00"` vs `0`.** We are strict-normative; if CMI’s
   platform ever sends `0`, success callbacks would be acknowledged without
   capture and land in reconciliation. Watch for this during certification
   (the persisted raw payloads make it diagnosable in seconds).
