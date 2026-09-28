'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

async function guard() {
  const ok = await getAdminSession()
  if (!ok) throw new Error('Unauthorized')
}

const FREQUENCIES = ['once', 'daily', 'session']
const SHOW_ON = ['all', 'home']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const str = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim()

// The CTA lands in an href on the public site, so only site-relative paths and
// http(s) URLs are accepted — never javascript: or data: URLs.
function safeUrl(raw: string): string {
  if (!raw) return ''
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  try {
    const u = new URL(raw)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : ''
  } catch {
    return ''
  }
}

function parse(formData: FormData) {
  const startDate = str(formData, 'startDate')
  const endDate = str(formData, 'endDate')
  const frequency = str(formData, 'frequency')
  const showOn = str(formData, 'showOn')
  const delay = Number(formData.get('delaySeconds'))
  return {
    name:          str(formData, 'name') || str(formData, 'titleEn'),
    eyebrowEn:     str(formData, 'eyebrowEn'),
    eyebrowFr:     str(formData, 'eyebrowFr'),
    titleEn:       str(formData, 'titleEn'),
    titleFr:       str(formData, 'titleFr'),
    descriptionEn: str(formData, 'descriptionEn'),
    descriptionFr: str(formData, 'descriptionFr'),
    offerEn:       str(formData, 'offerEn'),
    offerFr:       str(formData, 'offerFr'),
    ctaLabelEn:    str(formData, 'ctaLabelEn'),
    ctaLabelFr:    str(formData, 'ctaLabelFr'),
    ctaUrl:        safeUrl(str(formData, 'ctaUrl')),
    imageUrl:      str(formData, 'imageUrl'),
    startDate:     DATE_RE.test(startDate) ? startDate : '',
    endDate:       DATE_RE.test(endDate) ? endDate : '',
    delaySeconds:  Number.isFinite(delay) ? Math.min(Math.max(Math.round(delay), 0), 60) : 2,
    frequency:     FREQUENCIES.includes(frequency) ? frequency : 'once',
    showOn:        SHOW_ON.includes(showOn) ? showOn : 'all',
    active:        formData.get('active') === 'on',
    order:         Number(formData.get('order')) || 0,
  }
}

function revalidate() {
  revalidatePath('/admin/popups')
  revalidatePath('/[lang]', 'layout')
}

export async function createPopup(formData: FormData) {
  await guard()
  await prisma.popup.create({ data: parse(formData) })
  revalidate()
  redirect('/admin/popups')
}

export async function updatePopup(id: string, formData: FormData) {
  await guard()
  await prisma.popup.update({ where: { id }, data: parse(formData) })
  revalidate()
  redirect('/admin/popups')
}

export async function deletePopup(id: string) {
  await guard()
  await prisma.popup.delete({ where: { id } })
  revalidate()
}
