import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getAdminSession } from '@/lib/auth'
import { getClientIp, rateLimit, tooManyRequestsResponse } from '@/lib/rate-limit'
import sharp from 'sharp'

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

export async function POST(req: NextRequest) {
  const ok = await getAdminSession()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = getClientIp(req.headers)
  const rl = rateLimit(`upload:${ip}`, 30, 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 })
  }
  if (file.type && !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  const bytes = await file.arrayBuffer()
  const buf   = Buffer.from(bytes)

  let processed: Buffer
  try {
    processed = await sharp(buf)
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
  }

  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
  const dir  = join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, name), processed)

  return NextResponse.json({ url: `/uploads/${name}` })
}
