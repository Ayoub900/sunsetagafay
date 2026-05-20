// Single source of truth for the maison's public contact details.
// Fill these in when the real values are operational — every component that
// surfaces phone/email reads from here and gracefully hides empty values.

export const CONTACT_PHONE = '+212 662 361 819'
export const CONTACT_EMAIL = 'info@sunsetagafay.com'
export const PRESS_EMAIL   = 'info@sunsetagafay.com'
export const EVENTS_EMAIL  = 'info@sunsetagafay.com'
export const CONTACT_WEB   = 'www.sunsetagafay.com'

// tel: link target (strips spaces and non-digit separators)
export const contactPhoneHref = CONTACT_PHONE.replace(/[^\d+]/g, '')

export const hasPhone  = CONTACT_PHONE.length > 0
export const hasEmail  = CONTACT_EMAIL.length > 0
export const hasPress  = PRESS_EMAIL.length > 0
export const hasEvents = EVENTS_EMAIL.length > 0
export const hasWeb    = CONTACT_WEB.length > 0
