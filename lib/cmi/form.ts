import type { CmiFields } from './params'

// Renders a self-contained HTML page whose only job is to auto-POST the CMI
// fields to the gateway. Every field with a `name` is part of the POST (and so
// of the hash); the submit button deliberately has NO name attribute.

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderAutoSubmitForm(action: string, fields: CmiFields): string {
  const inputs = Object.entries(fields)
    .map(
      ([name, value]) =>
        `    <input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(String(value))}" />`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Redirecting to secure payment…</title>
  <style>
    html,body{height:100%;margin:0}
    body{display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#1f1a14;color:#f2e8d5}
    .box{text-align:center;padding:2rem}
    .spinner{width:34px;height:34px;margin:0 auto 1.25rem;border:2px solid rgba(242,232,213,.25);border-top-color:#c97b5c;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    button{margin-top:1rem;background:#c97b5c;color:#fff;border:0;padding:.75rem 1.5rem;font-size:.9rem;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}
    p{opacity:.75;font-size:.9rem}
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner" aria-hidden="true"></div>
    <p>Redirecting you to the secure CMI payment page…</p>
    <form id="cmiForm" method="POST" action="${escapeHtml(action)}" accept-charset="UTF-8">
${inputs}
      <noscript>
        <p>JavaScript is disabled. Click the button below to continue to the secure payment page.</p>
        <button type="submit">Continue to payment</button>
      </noscript>
    </form>
  </div>
  <script>document.getElementById('cmiForm').submit();</script>
</body>
</html>`
}
