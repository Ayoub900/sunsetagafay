import { NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'

const MIME: Record<string, string> = {
  webp: 'image/webp',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  svg:  'image/svg+xml',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params

  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.includes('..')) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }

  const file = join(process.cwd(), 'public', 'uploads', name)

  try {
    await stat(file)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ext  = name.split('.').pop()?.toLowerCase() ?? ''
  const type = MIME[ext] ?? 'application/octet-stream'
  const buf  = await readFile(file)

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type':  type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
