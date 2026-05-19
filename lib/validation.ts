// Standard input validation helpers.
// Throws ValidationError on bad input; route handlers should catch and 400/422.

export class ValidationError extends Error {
  status: number
  constructor(message: string, status = 422) {
    super(message)
    this.name = 'ValidationError'
    this.status = status
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get('content-type') ?? ''
  if (!ct.toLowerCase().includes('application/json')) {
    throw new ValidationError('Content-Type must be application/json', 415)
  }
  let parsed: unknown
  try {
    parsed = await req.json()
  } catch {
    throw new ValidationError('Invalid JSON body', 400)
  }
  if (!isRecord(parsed)) throw new ValidationError('Body must be a JSON object', 400)
  return parsed
}

type StrOpts = {
  field:     string
  required?: boolean
  min?:      number
  max?:      number
  pattern?:  RegExp
}

// Strip C0/DEL control characters except tab (\u0009) and newline (\u000A).
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F]/g

export function str(v: unknown, opts: StrOpts): string {
  if (v === undefined || v === null || v === '') {
    if (opts.required) throw new ValidationError(`${opts.field} is required`)
    return ''
  }
  if (typeof v !== 'string') throw new ValidationError(`${opts.field} must be a string`)
  const cleaned = v.replace(CONTROL_CHARS, '').trim()
  if (opts.required && cleaned.length === 0) throw new ValidationError(`${opts.field} is required`)
  if (opts.min !== undefined && cleaned.length < opts.min) throw new ValidationError(`${opts.field} is too short`)
  if (opts.max !== undefined && cleaned.length > opts.max) throw new ValidationError(`${opts.field} is too long`)
  if (opts.pattern && cleaned && !opts.pattern.test(cleaned)) throw new ValidationError(`${opts.field} has an invalid format`)
  return cleaned
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function email(v: unknown, field = 'email'): string {
  const s = str(v, { field, required: true, max: 254 }).toLowerCase()
  if (!EMAIL_RE.test(s)) throw new ValidationError('Invalid email address')
  return s
}

export function phone(v: unknown, opts: { required?: boolean; field?: string } = {}): string {
  const field = opts.field ?? 'phone'
  // Permissive on format — international phones vary wildly (extensions, letters, etc.)
  return str(v, { field, required: opts.required, max: 32 })
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isoDate(v: unknown, field: string): string {
  const s = str(v, { field, required: true, max: 10 })
  if (!ISO_DATE_RE.test(s)) throw new ValidationError(`${field} must be in YYYY-MM-DD format`)
  const d = new Date(`${s}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    throw new ValidationError(`${field} is not a valid date`)
  }
  return s
}

type IntOpts = { field: string; min: number; max: number; default?: number }

export function intInRange(v: unknown, opts: IntOpts): number {
  if (v === undefined || v === null || v === '') {
    if (opts.default !== undefined) return opts.default
    throw new ValidationError(`${opts.field} is required`)
  }
  const n = typeof v === 'number' ? v : Number.parseInt(String(v), 10)
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new ValidationError(`${opts.field} must be an integer`)
  if (n < opts.min || n > opts.max) {
    throw new ValidationError(`${opts.field} must be between ${opts.min} and ${opts.max}`)
  }
  return n
}
