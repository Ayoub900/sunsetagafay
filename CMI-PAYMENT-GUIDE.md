# CMI Payment — The Complete Guide

This is the deep-dive companion to [CMI-PAYMENT.md](CMI-PAYMENT.md) (quick ops
reference). It explains **how the integration works, why each rule exists, how
to test it, and what the keys look like**. The security audit lives in
[CMI-SECURITY-AUDIT.md](CMI-SECURITY-AUDIT.md).

Source of truth: the CMI **“Online payment integration V2.0”** PDF in
`PackageIntegrationEcomSAHAMPAY_V2.0/…/1.Docs/En/CmiOnlinePaymentIntegration.V2.0.pdf`
and the certification workbook in `…/4.TestsCertification/`. Everything below
cites the behavior that PDF mandates.

---

## 1. The big picture

CMI’s **Hosted Payment Page** model means the card form lives on CMI’s servers,
never ours. Our site only (a) sends a *signed* description of what to charge,
and (b) *verifies* the signed result. Card numbers never touch our
infrastructure — that is what keeps us out of PCI-DSS scope.

```
Customer                     Our server (Next.js)                CMI platform
   │  1. reserve wizard          │                                   │
   ├────── POST /api/payment/initiate                                │
   │           │ loads reservation, computes amount FROM DB,         │
   │           │ creates Order (PENDING, oid), signs fields (hash)   │
   │◄── auto-submitting HTML form ──┐                                │
   ├───────────── browser POSTs signed form ───────────────────────► │
   │                             │                    3-D Secure + card entry
   │                             │                                   │
   │                             │◄─ 2. host-to-host CALLBACK ───────┤  ← authoritative
   │                             │   verify hash, check amount,      │
   │                             │   PENDING→PAID, reply             │
   │                             │   "ACTION=POSTAUTH" ─────────────►│  ← capture request
   │◄── 3. browser redirected to okUrl/failUrl (display only) ───────┤
   ├────── lands on /reserve/confirmation or /reserve/payment-failed │
```

Three separate channels carry the result, and they are **not equal**:

| Channel | Who sends it | Trust level | What it may do |
| --- | --- | --- | --- |
| Callback (`/api/payment/callback`) | CMI server → our server | **Authoritative** (hash-verified) | The ONLY thing that can set an order to `PAID` |
| okUrl (`/api/payment/ok`) | Customer’s browser | Verified but secondary | Display; fallback flag `UNDER_RECONCILIATION` |
| failUrl (`/api/payment/fail`) | Customer’s browser | Verified but secondary | Display; offer retry |

**Why can’t the browser return be trusted for payment?** Because it passes
through the customer’s machine. Even with a valid hash it can be *replayed,
delayed, or simply never happen* (customer closes the tab). The PDF is explicit:
status updates belong to the server-to-server callback; the redirect exists so
the human sees a page.

---

## 2. Where everything lives

| File | Role |
| --- | --- |
| `lib/cmi/hash.ts` | The ver3 hash — sign AND verify. One function, no duplicates. |
| `lib/cmi/config.ts` | Reads env vars, validates them (https, no “SKS”). |
| `lib/cmi/params.ts` | Builds the exact field set POSTed to CMI. |
| `lib/cmi/form.ts` | Renders the auto-submitting HTML form. |
| `lib/cmi/orders.ts` | Order lifecycle: create/reuse, atomic transitions, idempotent callback storage, fulfillment. |
| `lib/cmi/util.ts` | Money in integer centimes, `oid`/`rnd` generation. |
| `lib/cmi/observability.ts` | Logging + alert hooks, with redaction. |
| `app/api/payment/initiate/route.ts` | Browser → signed CMI form. |
| `app/api/payment/callback/route.ts` | CMI → us. The authority. |
| `app/api/payment/ok/route.ts`, `fail/route.ts` | Browser returns. |
| `app/api/payment/reconcile/route.ts` | Cron sweep for stuck orders. |
| `app/[lang]/reserve/confirmation`, `payment-failed` | Customer-facing result pages. |
| `app/admin/(protected)/payments` | Admin reconciliation list. |
| `prisma/schema.prisma` → `Order`, `PaymentCallback` | Data model. |
| `public/payment/*.png` | Official security logos from the kit. |

---

## 3. The payment request, field by field

Built in `lib/cmi/params.ts`. Every value is **trimmed once** before hashing so
the bytes hashed are byte-identical to the bytes posted (the PDF explicitly
warns that stray leading/trailing spaces are a classic hash-mismatch cause).

| Field | Value | Why |
| --- | --- | --- |
| `clientid` | `830010013` | Your merchant id. |
| `storetype` | `3d_pay_hosting` | Selects the Hosted Payment Page model. |
| `trantype` | `PreAuth` | Two-phase: authorize now (funds blocked), capture on our callback answer. See §6. |
| `amount` | `"11600.00"` | MAD, decimal string, **no currency symbol**. Computed from the DB only. |
| `currency` | `504` | ISO-4217 numeric for MAD. CMI settles in MAD, always. |
| `oid` | e.g. `SAMROUCMPUB0135DC1CED5` | Our order id. Alphanumeric, ≤64 chars, **no special characters** (`°`, `€`, parentheses break it). See §5 for lifecycle. |
| `okUrl` / `failUrl` | `https://…/api/payment/ok` / `…/fail` | Where the browser lands after. |
| `callbackUrl` | `https://…/api/payment/callback` | Where the authoritative result is POSTed. Must be public, even in test. |
| `CallbackResponse` | `true` | Turns the host-to-host callback on. |
| `shopurl` | site root | Where “Cancel” on the CMI page returns to. |
| `lang` | `ar` \| `fr` \| `en` | Language of CMI’s payment page. |
| `email`, `BillToName` | customer’s | **Mandatory** — certification checks they are present. |
| `tel` | customer’s phone | Optional, sent when present. |
| `rnd` | 20 alphanumeric chars | Random nonce mixed into the hash so two otherwise-identical requests hash differently. |
| `hashAlgorithm` | `ver3` | Selects the hash scheme below. |
| `encoding` | `utf-8` | “Strongly recommended” by the PDF; guarantees accented characters survive. |
| `sessiontimeout` | `2700` | Max allowed (30–2700s); gives 3-D Secure room. |
| `AutoRedirect` | `true` | Auto-return the customer to okUrl instead of waiting for a click. |
| `amountCur` / `symbolCur` | `"1160.00"` / `EUR` | Display-only foreign-currency figure (the site shows €). `symbolCur` takes ISO codes (“EUR”), per the PDF examples. |
| `hash` | computed last | Signature over everything above. |

Things we deliberately **never** send: `total` (the PDF forbids it), any price
component readable from the browser, the store key (obviously).

**Why must the server compute the amount?** The initiate endpoint accepts only
a `reservationId`. Price, nights, and identity are re-derived from MongoDB
(`Suite.rateMadCents × nights`). If the browser could post an amount, any
customer could pay 1 MAD for a suite by editing a hidden field. The hash does
NOT protect against this — we would happily sign whatever we were told to sign.
The signature proves the request *came from us*; only server-side pricing
proves it is *correct*.

### The auto-submit form

`lib/cmi/form.ts` renders every field as `<input type="hidden">` and submits
via JS on load. Rule from the PDF: **anything with a `name` attribute in that
form becomes part of the POST, and therefore of the hash**. That is why the
noscript submit button has no `name` — a named button would add a field CMI
hashes but we didn’t, and every payment would fail with a hash error.

---

## 4. The hash (ver3) — how and why

The store key is a shared secret between us and CMI. Both sides compute
`hash = f(all_fields, storeKey)` and compare. A tampered field (say, the
amount) changes the hash; not knowing the key, the tamperer cannot fix it.

The algorithm (all in `lib/cmi/hash.ts`, verified against the PDF §4.1.4
worked example byte-for-byte in `hash.test.ts`):

1. Take every parameter **except** `hash` and `encoding` (case-insensitive).
2. Sort names alphabetically, case-insensitive, numeric-aware (PHP
   `natcasesort`).
3. For each value: escape `\` → `\\` first, then `|` → `\|`. Empty values stay
   as empty slots — `a=1, b="", c=2` gives `1||2`.
4. Anti-XSS rule: any character right after the string `document` becomes `.`
   (`documentabc` → `document.bc`). CMI’s WAF rewrites such values on their
   side, so we must hash what *they* will see, or the hashes diverge.
5. Join with `|`, append `|` + the escaped store key.
6. `hash = base64( raw_bytes( sha512_hex( plaintext ) ) )` — the PHP idiom
   `base64_encode(pack('H*', hash('sha512', $plaintext)))`. Result is always
   **88 base64 chars** ending in `=`.

Worked example straight from the PDF (storeKey `ABCD1234`):

```
plaintext:
95.93|billToCompany|name|http://…/GateResponseControl.jsp|100200127|504||http://…/GenericVer3ResponseHandler|ver3|en|http://…/GenericVer3ResponseHandler|87954458746|3d_pay_hosting|PreAuth|ABCD1234
         ↑ note the empty slot: email was sent empty and still occupies a position
```

**Why never strip accents?** `é`, `ç`, Arabic text etc. must be hashed as the
exact UTF-8 bytes that are posted. “Fixing” them (transliteration, entity
encoding) is the classic integration bug — and handling them *correctly* is an
explicit certification test. That’s also why we always send `encoding=utf-8`.

**Why constant-time comparison on verify?** A naive `===` returns faster the
earlier the first mismatching character is, which leaks how much of a forged
hash is correct. `crypto.timingSafeEqual` takes the same time regardless.

### What the keys look like

| Thing | Shape | Example (fake) |
| --- | --- | --- |
| `CMI_CLIENT_ID` | ~9-digit number, assigned by CMI | `830010013` |
| `CMI_STORE_KEY` | A password **you choose** in the CMI back office → *Administration → Changer les clés du magasin*. Treat like a root password. Alphanumeric recommended (it gets escaped, but `|`/`\` in a key invite trouble). Must **not** contain the substring `SKS` (`config.ts` refuses to boot if it does). | `Kx9mQ2vTz7Rp4Wd8` |
| The `hash` field | 88 base64 chars | `wGyOK1rL…Q3kA==` |
| `oid` | ≤64 alphanumeric | `SAMROUCMPUB0135DC1CED5` |
| `rnd` | 20 alphanumeric | `lbJjfQCTTrNRfMcNe1I1` |
| `CRON_SECRET` | any long random string, only our cron knows it | `9f2c…48-hex` |

Key rules: never in git (`.env*` is ignored), never in logs (redaction in
`observability.ts`), never in the client bundle (`lib/cmi/*` is `server-only`).
If the key ever leaks, an attacker can forge *callbacks* and mark unpaid orders
as paid — rotate it in the back office and in the env immediately.

---

## 5. The `oid` lifecycle — why reuse on retry

The `oid` identifies one merchant order **forever** on the CMI side. Rules the
PDF and certification workbook enforce:

- One order = one `oid`. Never assign it to a different order.
- A **failed** attempt does not consume the oid. The customer retries with the
  **same** oid — that is how CMI groups the failed attempts and the eventual
  success under one order in the Merchant Center.
- A **successful** transaction consumes the oid permanently. CMI rejects any
  new payment request reusing it (this is certification test #6). Only then
  would a retry need a fresh oid — and in our flow a successful order is never
  re-initiated at all.

Implementation: `Order.reservationId` is unique, so one reservation maps to one
order. `createOrLoadOrderForReservation` reuses the existing order (same oid)
while it is `PENDING`, refuses to re-initiate when it is `PAID`/finalized or
`UNDER_RECONCILIATION`, and only mints a new oid for a brand-new order.

---

## 6. The callback — the heart of the integration

`POST /api/payment/callback`, `application/x-www-form-urlencoded`, no auth, no
CSRF — because CMI’s server is the caller and the hash *is* the authentication.
It must be reachable from the public internet **even during testing** (CMI’s
test platform calls it).

The response contract is unusually strict: HTTP 200, `text/plain`, and a body
that is **exactly** one of:

| Body | Meaning | When we send it |
| --- | --- | --- |
| `ACTION=POSTAUTH` | “Acknowledged — capture the funds.” | Hash valid + order found + amount matches + `ProcReturnCode == "00"`. |
| `APPROVED` | “Acknowledged — don’t capture.” | Valid callback for a **failed** attempt (`ProcReturnCode != "00"`). It’s an acknowledgement, not an approval of payment. |
| `FAILURE` | “I could not process this.” | Bad hash, unknown order, amount mismatch, or any internal error. CMI then leaves capture/void to manual back-office handling. |

No JSON, no HTML, no trailing whitespace, no framework error page — CMI parses
the raw body. A 500 error page counts as a syntax error on their side.

**Why `PreAuth` + `ACTION=POSTAUTH` instead of direct sale?** The card is
*authorized* first (funds blocked at the customer’s bank, nobody charged), and
only our explicit `ACTION=POSTAUTH` answer converts it to a capture. The block
expires after **4–7 days** — that’s the safety valve: if our site is down or
answers `FAILURE`, nobody was silently charged, and the merchant decides
manually. This also means a **slow callback handler is a real financial risk**:
if we time out, CMI treats it like `FAILURE` and automatic capture is lost.
Hence everything slow (email, guest records) runs *after* the response via
`after()`.

**Why does a failed payment return `APPROVED` and change nothing?** CMI sends a
callback for *every* attempt. A customer may fail 3D-Secure twice, then
succeed — three callbacks, same oid. If a failed attempt cancelled the order,
the eventual success would have nothing to land on. So: failed attempts are
*recorded* (in `PaymentCallback`, with `ErrCode`/`ErrMsg`) but the order stays
`PENDING`. This is also why the schema deliberately has **no `FAILED` status**.

**The amount check.** Stored `Order.amount` (integer centimes) vs the callback’s
`amount` string parsed to integer centimes — never `parseFloat` on both sides
(`0.1 + 0.2 !== 0.3`; float comparison of money is how phantom mismatches
happen). Mismatch ⇒ `FAILURE` + alert: it means the callback is not describing
the order we signed.

**Idempotency.** The same callback can be delivered more than once. Each is
persisted with a unique `fingerprint` (TransId when present, else a SHA-256 of
the payload) enforced by a **unique Mongo index** — a duplicate insert fails
with P2002 and we simply don’t fulfill twice. The status transition itself is
also atomic: `updateMany({where: {oid, amount, status: {in: [PENDING,
UNDER_RECONCILIATION]}}})` — only one caller ever “wins”, and a `PAID` order
can never be downgraded by anything.

**One quirk to know:** the PDF’s normative text says success is
`ProcReturnCode == "00"`, but its example table prints `0`. We follow the
normative `"00"` strictly. If CMI’s test platform ever sends `0`, the order
stays `PENDING`, we answer `APPROVED`, and reconciliation catches it — a safe
failure mode, and the persisted raw payload will prove what happened.

---

## 7. Browser returns and `UNDER_RECONCILIATION`

`okUrl` receives a POST with the full parameter set. We verify its hash (so we
don’t display attacker-controlled data) but the only state change it may make
is `PENDING → UNDER_RECONCILIATION` — meaning: *the customer believes they
paid, but the authoritative callback hasn’t confirmed it*. The confirmation
page then shows “payment being confirmed” and the customer is told **not** to
pay again.

Why this state exists: the callback can genuinely fail (our server rebooting,
network). The customer paid at CMI, funds are pre-authorized, but our DB says
`PENDING`. The PDF prescribes checking via the “Order Status Query” API and
capturing via the “PostAuth” API — but **does not document those APIs** in
V2.0, so per the project rule we don’t invent endpoints: these orders surface
in **Admin → Operations → Payments** and are verified/captured manually in the
CMI Merchant Center. `UNDER_RECONCILIATION` is never auto-expired, and payment
can never be re-initiated from it (a second charge is the worst outcome a
payment system can produce).

`failUrl` changes nothing, shows a clean failure page, and offers retry (same
oid). The precise decline reason (`ErrCode`/`ErrMsg`) stays in the logs —
telling a fraudster *why* a stolen card was declined is standard
fraud-prevention practice, so the customer only sees a generic message.

### The full state machine

```
                    initiate (server-priced)
                            │
                        ┌───▼────┐   callback: hash ok, amount ok, Proc=00
      failed attempts──►│PENDING ├────────────────────────────►┌──────┐
      (no state change) └───┬────┘                             │ PAID │ cmiStatus=PRE
                            │ okUrl arrives before callback    └──┬───┘
                     ┌──────▼──────────────┐  late callback       │ manual, in CMI back office
                     │UNDER_RECONCILIATION ├─────────────────►────┤
                     └─────────────────────┘ (same transition)    ▼
        stale >24h (optional sweep)                      REFUNDED / PARTIALLY_REFUNDED
      PENDING ────────────► CANCELLED                    (CANCELLED via VOID while PRE)
```

`cmiStatus` mirrors the Merchant Center: `PRE` (funds blocked) → `POST`
(captured) → possibly `RFND`/`VOID`. We set `PRE` on the success callback and
record `postAuthRequestedAt`, but **never** set `POST` just because we answered
`ACTION=POSTAUTH` — answering requests capture, it doesn’t prove capture
happened. `POST` + `postAuthConfirmedAt` are set only after confirmation in the
back office (or an official API if CMI ever provides its docs).

---

## 8. Money: MAD prices and the 1 € = 10 MAD rule

- The authoritative charge source is **`Suite.rateMadCents`** — integer MAD
  centimes per night, edited in *Admin → Suites → “Online price (MAD /
  night)”* (entered in MAD, stored ×100).
- The `€` string in `rate` stays display-only; it is also sent to CMI as
  `amountCur`/`symbolCur` so the CMI payment page can show the € figure next to
  the MAD amount actually charged.
- Current prices were seeded at **1 € = 10 MAD** per your instruction:

  | Suite | Display | MAD/night |
  | --- | --- | --- |
  | Suite Agafay | €580 | 5 800 |
  | Suite La Khoutoubia | €680 | 6 800 |
  | Suite Sunset | €890 | 8 900 |
  | Family Suite | €1,380 | 13 800 |

- To change the rate later: just edit each suite’s MAD price in the admin (it
  is a per-suite number, not a global multiplier). A suite set to `0` becomes
  non-payable online and the wizard falls back to “room held, we’ll contact
  you”.

---

## 9. How to test — from unit to certification

### Level 1 — unit tests (no network, no DB)

```
npm test
```

23 tests over the hash: the PDF §4.1.4 worked example reproduced
byte-for-byte, escaping order, empty slots, the `document` rule, accents,
constant-time compare, tamper rejection. If you ever touch `hash.ts`, this is
the tripwire.

### Level 2 — local end-to-end simulation (no CMI account needed)

Because the callback is just a signed form POST, you can *be* CMI locally:

1. Put a fake key in `.env.local` (`CMI_STORE_KEY="TESTSTOREKEY12345"`), run
   `npm run dev`.
2. Drive the wizard (or POST to `/api/book`) to get a reservation, then POST
   `reservationId`, `lang`, `acceptTerms=true` to `/api/payment/initiate` —
   you get the signed auto-submit form. Check the hidden fields.
3. Craft a callback: take the same field style CMI would send
   (`clientid`, `oid`, `amount`, `currency`, `ProcReturnCode=00`, `TransId`,
   `mdStatus`, …), compute the ver3 hash with the same fake key, POST it
   `x-www-form-urlencoded` to `/api/payment/callback`. Expect the literal body
   `ACTION=POSTAUTH` and the order flipping to `PAID`.
4. Replay the same POST → still `ACTION=POSTAUTH`, but no duplicate record and
   no second fulfillment. Tamper with `amount` → `FAILURE`. Send
   `ProcReturnCode=05` → `APPROVED`, order untouched.

This exact scenario is scripted and was run green (22 checks) during
development — the harness lives in the session scratchpad (`cmi-e2e.mjs`) and
uses an *independent* hash reimplementation so it can’t share a bug with
`lib/cmi/hash.ts`.

### Level 3 — CMI test environment (real gateway, fake cards)

Prerequisites from CMI: test merchant id, the test gateway URL (already the
default `https://test-sahampay.cmi.co.ma/fim/est3dgate`), back-office login.
Your `CMI_BASE_URL` must be **publicly reachable** (deploy to staging, or
tunnel local dev with e.g. `cloudflared`/`ngrok` — the callback comes from
CMI’s servers, not your browser).

Test cards from the kit (`4.TestsCertification/CmiTestCards.xlsx`):

| Brand | PAN | Expiry | CVV | 3-D Secure code | Behaviour |
| --- | --- | --- | --- | --- | --- |
| Visa | `4000 0000 0000 0010` | 12 / any future year | any | — | **Non**-authenticable (no 3DS step) |
| Mastercard | `5191 6301 0000 4890` | 12 / any future year | any | — | **Non**-authenticable |
| CMI | `9876 0118 0771 2000` | 12 / any future year | any | `123` | Authenticable (full 3DS) |
| CMI | `9876 0197 5067 3560` | 12 / any future year | any | `123` | Authenticable |
| CMI | `9876 0120 0337 7970` | 12 / any future year | any | `123` | Authenticable |

After each payment, check three places: the callback log
(`[cmi][callback][…]` in server output), the order in **Admin → Payments**,
and the transaction in the CMI Merchant Center (status should reach `POST` if
`ACTION=POSTAUTH` worked).

### Level 4 — the certification workbook

`CmiEMerchantCertification_V1.1.xlsx` is filled by you and emailed to
`integration.ecom@cmi.co.ma`. Its scenarios map to this implementation:

| Certification test | Where it’s handled |
| --- | --- |
| CGV page + mandatory accept checkbox | `/[lang]/terms` + the checkbox gating the Pay button (client **and** server-side check in initiate) |
| CMI/VbV/SecureCode logos on the payment page | `PaymentLogos` on the wizard’s payment step — official kit PNGs in `public/payment/` |
| Successful payment: hash check → order lookup → amount check → Proc=00 → persist TransId/acqStan/mdStatus/txstatus/CARDBRAND → `ACTION=POSTAUTH` | callback route, in that exact order; every value lands on `Order` + raw payload in `PaymentCallback` |
| Return to site shows confirmation with order detail | `/reserve/confirmation` (reads authoritative DB state) |
| Failed payment via invalid store key (error `3D-1004`) | Set a wrong `CMI_STORE_KEY`, attempt payment: CMI page shows the 3D-1004 error, our order stays `PENDING`, failUrl shows the clean failure page. The workbook wants before/after order status — both are `PENDING`, plus a `PaymentCallback` row records the attempt |
| Non-3DS card vs 3DS card distinguishable | `mdStatus` (1 = full 3DS; 2/3/4 = non-participating) and `txstatus` are persisted on the order and visible in the raw callback |
| Same oid on two transactions | Retry reuses the oid while unpaid; CMI rejects reuse after success — our flow never re-initiates a paid order at all |
| Foreign currency display | `amount` is always the MAD value; `amountCur`/`symbolCur` carry the € figure |
| Accents in name/address | Sent as UTF-8, hashed as posted — unit-tested |

### Testing the reconciliation sweep

```
curl -H "x-cron-secret: $CRON_SECRET" https://<host>/api/payment/reconcile
curl -H "x-cron-secret: $CRON_SECRET" "https://<host>/api/payment/reconcile?expire=true"
```

Returns JSON with `stalePending` (>1 h old), `underReconciliation`, and the
count auto-expired (only PENDING >24 h; `UNDER_RECONCILIATION` is never
auto-touched). Schedule it hourly (Vercel Cron, GitHub Actions, any scheduler).

---

## 10. Go-live checklist

1. `CMI_STORE_KEY` — set the **production** key from the back office
   (*Administration → Changer les clés du magasin*). No `SKS`, long, random.
2. `CMI_GATEWAY_URL` → `https://sahampay.cmi.co.ma/fim/est3dgate` (drop the
   `test-` prefix).
3. `CMI_BASE_URL` → `https://sunsetagafay.com` (must be the exact public
   origin; it builds the URLs CMI calls).
4. `npx prisma db push` on the production DB — the **unique indexes are what
   make idempotency real**. Caveat: a pre-existing duplicate
   `SiteSettings.key="default"` document blocks the full push; dedupe it or
   create the three payment indexes manually (`Order.oid`,
   `Order.reservationId`, `PaymentCallback.fingerprint`).
5. Confirm suite MAD prices in the admin (see §8).
6. Schedule the reconcile cron + wire `alertPayment` to a real channel
   (email/Slack) — it currently emits structured `[cmi][alert]` log lines.
7. Run the certification scenarios (§9 level 3–4), fill the workbook, email it
   to CMI.

---

## 11. FAQ — “why does it have to be like that?”

**Why not just mark the order paid on the okUrl? It has a valid hash.**
Because the okUrl POST comes from the customer’s browser: it can be captured
and replayed later, it can arrive for an order whose money was later voided,
and — most commonly — it can simply never arrive. The callback is
server-to-server and answerable; the redirect is scenery.

**Why is there no FAILED order status?**
A failed *attempt* is not a failed *order* — the customer usually retries.
CMI itself models it that way (failed callbacks then a success callback on the
same oid). Failures live in `PaymentCallback` as history.

**Why does the callback return 200 + `APPROVED` even for a declined payment?**
It’s an acknowledgement protocol, not a status report. `APPROVED` = “message
received, don’t capture”. Returning an error status would look like *our*
failure and cost the automatic capture on retry flows.

**Why keep the raw payload of every callback?**
The certification file asks for exact values (TransId, acqStan, mdStatus…),
disputes need evidence, and when something odd happens (like the `0` vs `"00"`
quirk) the raw bytes are the only ground truth.

**Why is the amount in centimes everywhere?**
`580.10 * 3` in floating point is `1740.3000000000002`. Integer centimes make
money arithmetic exact and make the callback comparison a plain integer
equality.

**Why can’t I put the store key in the client to build the form there?**
Anyone reading your JS bundle could then sign arbitrary amounts and forge
callbacks. The key’s entire value is that only two parties have it.

**What happens if our server is down when CMI sends the callback?**
CMI gets no/failed response → treats it as the timeout case → no automatic
capture. The pre-auth stays blocked (4–7 days). The customer lands on okUrl
eventually (or not), the order shows up in the reconciliation sweep, and you
capture manually in the Merchant Center. Money is never silently lost — but
this is why callback latency and uptime matter.
