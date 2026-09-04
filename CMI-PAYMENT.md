# CMI (SAHAMPAY) Online Payment Integration

Hosted Payment Page model (`storetype=3d_pay_hosting`, `trantype=PreAuth`),
implemented to the CMI **“Online payment integration V2.0”** specification. All
signing and verification happen server-side; no secret ever reaches the client.

> **Companion docs:** [CMI-PAYMENT-GUIDE.md](CMI-PAYMENT-GUIDE.md) — the full
> deep-dive (how it works, why each rule exists, key formats, testing incl.
> test cards, certification walkthrough). [CMI-SECURITY-AUDIT.md](CMI-SECURITY-AUDIT.md)
> — threat model, findings (all fixed), residual operational risks.

## What it does

The reservation flow (`/[lang]/reserve`) collects dates → room → guest details,
creates a `PENDING` reservation, then hands off to a **Payment** step. From
there the browser POSTs to `/api/payment/initiate`, which recomputes the amount
from the database, creates/loads the `Order`, signs the request, and returns an
auto-submitting form that redirects to the CMI Hosted Payment Page.

Order status is decided **only** by the authoritative host-to-host callback.

**Day passes and transfers are sold the same way — and card payment is the only
way to book them.** Their pages (`/[lang]/day-pass/[slug]`,
`/[lang]/transfers/[transfer]`) collect the guest's details, POST them to
`/api/service-booking` (which validates and prices them from the DB and stores a
`PENDING` `ServiceBooking`), then show a review step that POSTs
`serviceBookingId` to the same `/api/payment/initiate`. There is no enquiry path
and nothing is “held”: the listing and detail CTAs lead to the payment flow, and
a booking is only `Confirmed` once the callback settles it. One `Order` model,
one callback, one confirmation page serve all three products; an `Order` carries
either a `reservationId` (a stay) or a `serviceBookingId` (a pass or a
transfer), never both.

## Environment variables

Set these in `.env.local` (never commit real values; `.env*` is gitignored):

| Variable | Purpose |
| --- | --- |
| `CMI_CLIENT_ID` | Merchant client id from CMI (e.g. `830010013`). |
| `CMI_STORE_KEY` | **Store key** — signs every request/callback. Must **not** contain `SKS`. |
| `CMI_GATEWAY_URL` | Test: `https://test-sahampay.cmi.co.ma/fim/est3dgate` · Prod: `https://sahampay.cmi.co.ma/fim/est3dgate` |
| `CMI_BASE_URL` | Public **https** base URL of the site; used to build `okUrl`/`failUrl`/`callbackUrl`/`shopurl`. Must be reachable from the internet, including in test. |
| `CRON_SECRET` | Shared secret for the reconciliation sweep endpoint. |
| `RESEND_API_KEY` | Resend API key. **Unset = no emails are sent** (logged as `[email][skipped]`), everything else still works. |
| `EMAIL_FROM` | Sender, e.g. `Sunset Agafay <reservations@sunsetagafay.com>`. Must be on a domain verified in Resend. |
| `EMAIL_ADMIN_TO` | Where paid-booking notifications go. Default `info@sunsetagafay.com`. |
| `EMAIL_REPLY_TO` | Reply-To on guest email. Defaults to `EMAIL_ADMIN_TO`. |

### Where the store key is set

In the CMI back office: **Administration → Changer les clés du magasin**. Copy
that value into `CMI_STORE_KEY`. It is the shared secret behind every `hash`;
keep it out of the client, logs, and version control.

## Endpoints

| Route | Method | Role |
| --- | --- | --- |
| `/api/service-booking` | POST | Validate + price a day pass / transfer booking and persist it `PENDING`. Returns the booking id the review step pays with. |
| `/api/payment/initiate` | POST | Create/load the order (server-computed amount) for a `reservationId` **or** a `serviceBookingId`, sign, return the auto-submit CMI form. Reuses the same `oid` on retry. |
| `/api/payment/callback` | POST | **Authoritative.** Verifies hash + amount, atomically sets `PAID`, replies exactly `ACTION=POSTAUTH` / `APPROVED` / `FAILURE`. |
| `/api/payment/ok` | POST | Browser return after success. Display/fallback only; sets `UNDER_RECONCILIATION` if the callback hasn’t finalized yet, then redirects to the confirmation page. |
| `/api/payment/fail` | POST | Browser return after failure. Never changes status; redirects to the retry page. |
| `/api/payment/reconcile` | GET/POST | Cron sweep (needs `CRON_SECRET`). Surfaces stale `PENDING` + `UNDER_RECONCILIATION`; `?expire=true` cancels `PENDING` older than 24h. |

Give CMI these URLs (built from `CMI_BASE_URL`):
`…/api/payment/ok`, `…/api/payment/fail`, `…/api/payment/callback`.

## Money & currency

- Amounts are stored and compared as **integer minor units (MAD centimes)** and
  only formatted to a decimal string (`"12000.00"`) at the CMI boundary. No
  floating-point comparison anywhere, including the callback amount check.
- CMI settles in **MAD (currency `504`)**. The authoritative price is
  `Suite.rateMadCents` (set per suite in the admin: *Suites → Online price
  (MAD / night)*). A suite with `rateMadCents = 0` is **not** payable online and
  the flow falls back to “room held, we’ll contact you”.
- The site also displays €; when a € rate is present the request additionally
  sends `amountCur` / `symbolCur` for display while `amount` stays MAD.

## The hash (algorithm ver3)

`lib/cmi/hash.ts` is the single source of truth for both request signing and
callback verification. Sorted (`natcasesort`) params except `hash`/`encoding`,
`\`→`\\` then `|`→`\|` escaping, the anti-XSS “document” rule, joined by `|`,
plus the escaped store key, then `base64(pack('H*', sha512_hex))`. UTF-8 bytes
hashed are byte-identical to the bytes posted; accents are never stripped.

Unit tests: `npm test` (`lib/cmi/hash.test.ts`). Covers escaping, empty slots,
`|`/`\`, the `document` rule, accented characters (é/ç/â), packing, **and the
official PDF §4.1.4 worked example** (storeKey `ABCD1234`), transcribed from
the kit PDF and reproduced byte-for-byte.

## Order state machine

`PENDING → PAID` (callback, `ProcReturnCode == "00"`, amount matches) ·
`PENDING → UNDER_RECONCILIATION` (okUrl fallback only) ·
`UNDER_RECONCILIATION → PAID` (later callback). There is deliberately **no
failed status**: failed attempts never change the order; each is recorded in
`PaymentCallback`. `PAID`/`REFUNDED`/`CANCELLED` can never be downgraded — every
transition is a single conditional `updateMany`.

`cmiStatus` mirrors the CMI Merchant Center (`PRE`/`POST`/`VOID`/`RFND`). A
successful PreAuth records `PRE` + `postAuthRequestedAt`; it is **not** promoted
to `POST` just because we returned `ACTION=POSTAUTH` — set `POST` +
`postAuthConfirmedAt` only after real capture confirmation (status API / back
office). Void, refund, and partial refund are performed in the CMI back office;
reflect them via the admin (`CANCELLED` / `REFUNDED` / `PARTIALLY_REFUNDED`).

## Idempotency & fulfillment

Callbacks persist idempotently keyed on `TransId` (or a payload fingerprint) +
channel, backed by a unique index. Business fulfillment (confirm reservation,
upsert guest, email) runs via `after()` **after** the response is sent, and only
for the winning `PENDING→PAID` transition, so a slow mailer never risks CMI’s
timeout and duplicate deliveries never fulfill twice.

## Database indexes (MongoDB)

`prisma generate` does **not** create Mongo indexes — run:

```
npx prisma db push
```

This creates the unique indexes that idempotency relies on
(`Order.oid`, `Order.bookingRef`, `PaymentCallback.fingerprint`).

### Why `Order.bookingRef` and not the foreign keys

“One order per booking” **cannot** be a unique index on `Order.reservationId`
or `Order.serviceBookingId`: MongoDB indexes a missing/null value as a value,
so a unique index on an optional field admits exactly **one** document without
it. That is invisible while every order has a reservation, and breaks on the
*second* day-pass/transfer order (`P2002` on `Order_reservationId_key`).

`bookingRef` is therefore always set — `res:<reservationId>` for a stay,
`svc:<serviceBookingId>` for a pass or transfer — and carries the unique index;
the two foreign keys are plain non-unique fields used only for navigation
(hence `Reservation.orders` / `ServiceBooking.orders` are lists holding at most
one row).

### Migration for databases created before this change

Run **once per database, before `prisma db push`** (existing orders have no
`bookingRef`, so the unique index cannot be created until they are backfilled):

```
node --env-file=.env scripts/migrate-order-booking-ref.mjs
```

It backfills `bookingRef`, drops the old `Order_reservationId_key` /
`Order_serviceBookingId_key` indexes, and creates `Order_bookingRef_key`. It is
idempotent, and `--dry-run` reports what it would do without writing. If a
pre-existing duplicate elsewhere blocks the push, create just these three
indexes manually (see the createIndexes commands used during setup).

## Reconciliation

Schedule the sweep (e.g. hourly):

```
curl -H "x-cron-secret: $CRON_SECRET" https://<host>/api/payment/reconcile
# add ?expire=true to auto-cancel PENDING older than 24h
```

Orders needing attention are listed in the admin at **Operations → Payments**.
`UNDER_RECONCILIATION` orders are verified/captured manually against the CMI
Merchant Center (or an official status API if credentials are provided — no
undocumented endpoints are invented here).

## Blocked dates

*Admin → Maison → Blocked Dates* closes a single item, every item of a type, or
the entire property for an inclusive date range (`AvailabilityBlock`). The three
scopes are interpreted in exactly one place — `blockCovers()` in
`lib/services.ts`, unit-tested in `services.test.ts` — so every entry point
agrees:

| Block | Closes |
| --- | --- |
| `serviceType: ""` | the entire property |
| `serviceType: "transfer", serviceId: ""` | every transfer |
| `serviceType: "transfer", serviceId: "<id>"` | that one transfer |

Enforcement, for the three products that are booked online:

| Where | Behaviour |
| --- | --- |
| `/api/availability` | A blocked suite is not offered; a property- or all-suites block returns nothing. |
| `/api/book` | Rejects a blocked suite/range with **409**, so a direct POST cannot slip past a closure. |
| `/api/service-booking` | Rejects a blocked day pass / transfer date with **409** `DATE_BLOCKED`; the guest sees “we are closed on that date”. |
| `/api/payment/initiate` | Re-checks **both** kinds before signing anything and refuses with **409** `DATE_BLOCKED`. This closes the window where an admin blocks a date *after* a booking was taken but before it was paid — the customer is told nothing was charged. |

The other service types (restaurants, events, experiences, treatments, sunset
parties) have no online booking, so a block on one is recorded for staff but
not enforced on the site; the picker marks them “inquiry only”.

## Emails on a settled payment

Every payment that settles sends **two** emails through Resend, from
`fulfillPaidOrder` — the same once-per-order path that confirms the booking:

| To | Content |
| --- | --- |
| The guest (`Order.customerEmail`) | Receipt / confirmation in **their** language (EN or FR): amount paid, reference, what they booked, their notes. Deliberately contains **no** payment internals (no card, transaction id, or `oid`). |
| The maison (`EMAIL_ADMIN_TO`, default `info@sunsetagafay.com`) | The same booking plus guest contact details and the payment ids (masked card, `TransId`, auth code, CMI `oid`). `Reply-To` is the guest, so replying answers them directly. |

Both cover all three products (stay, day pass, transfer). Design rules:

- **Never blocks or breaks a payment.** Sending happens after the response to
  CMI has been returned, inside `after()`, and `sendPaymentEmails` never throws.
  A missing key, a bounced address, or a Resend outage is logged
  (`[email][failed]`) and nothing else.
- **Exactly once per order.** It rides on the atomic `fulfilledAt` claim, so
  duplicate callbacks cannot produce duplicate mail.
- The two sends are independent: the maison is still told even if the guest's
  address bounces, and vice versa.
- Failed payment attempts send **nothing** — the customer sees the retry page.
- Guest-supplied values are HTML-escaped in both bodies.

Code: `lib/email/client.ts` (Resend + config), `lib/email/templates.ts` (pure
HTML/text builders, unit-tested in `templates.test.ts`), `lib/email/payment.ts`
(assembles either booking type and sends both).

To see the emails without sending any:

```
node --experimental-strip-types scripts/preview-emails.mjs
```

which writes both messages for all three products, EN and FR, to
`.email-preview/`.

## Observability

Every callback is logged with a greppable `[cmi]…` prefix and persisted.
`alertPayment()` (in `lib/cmi/observability.ts`) fires on hash failures,
`FAILURE` responses, amount mismatches, and reconciliation — wire it to email /
an admin channel in production. The store key, hash plaintext, and full card
data are never logged (`MaskedPan` as received is fine).

## Compliance (certification blockers)

- **Terms of Sale** with payment clauses at `/[lang]/terms`; a mandatory “read
  and accept” checkbox gates the Pay button (enforced client- and server-side).
- **Security logos** (CMI, Verified by Visa, Mastercard SecureCode) on the
  checkout step via `components/PaymentLogos.tsx` — the **official kit files**
  from `3.Charte/logos de securite (obligatoires)`, copied to `public/payment/`.
- Customer **name and email** are always sent in the request.

## Pricing

`Suite.rateMadCents` is seeded at **1 € = 10 MAD** from each suite's `€` display
rate (e.g. €580 → 5 800 MAD/night). Adjust per suite anytime in
*Admin → Suites → “Online price (MAD / night)”*.

Day passes and transfers work the same way, and start at **0 (not payable
online)** until a price is entered:

| Item | Field(s) | Admin location | Total charged |
| --- | --- | --- | --- |
| Day pass | `priceMadCents`, `childPriceMadCents` | *Day Passes → Online payment* | `adults × price + children × childPrice` |
| Transfer | `priceMadCents` | *Transfers → Online payment* | flat per vehicle/trip — passengers do not multiply it |

A price of `0` means the item **cannot be booked at all**: the day-pass page
shows a “contact us to reserve” line and the transfer page falls back to its
enquiry CTA, because there is no amount to charge. Treat `0` as a
misconfiguration, not a mode.

Existing databases are priced in one step (idempotent, `--dry-run` available):

```
node --env-file=.env scripts/set-service-mad-prices.mjs
```

It reads each item's own € display price at **1 € = 10 MAD** (the conversion the
suites use), skips anything already priced, and sets the child price equal to
the adult price — so **children are charged the full adult price until you enter
a reduced child price** in the admin. `/api/seed` sets the same values for fresh
databases.

Bookings are listed in the admin at **Maison → Passes & Transfers**; a booking
turns `Confirmed` only when its order is settled by the callback.

Unlike suites, services send **no `amountCur`/`symbolCur`** to CMI: their `price`
strings are marketing copy (“From €180”, “55,00”) rather than an exact
convertible amount, so the review step and the CMI page both quote MAD only.
