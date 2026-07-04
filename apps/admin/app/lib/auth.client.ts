const ADMIN_COOKIE_KEY = 'storybox_admin_key'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function isBrowser() {
  return typeof document !== 'undefined'
}

export function getAdminApiKey() {
  if (!isBrowser()) return ''

  const match = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_COOKIE_KEY}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

export function setAdminApiKey(apiKey: string) {
  if (!isBrowser()) return

  document.cookie = [
    `${ADMIN_COOKIE_KEY}=${encodeURIComponent(apiKey)}`,
    'Path=/',
    `Max-Age=${MAX_AGE_SECONDS}`,
    'SameSite=Lax',
    location.protocol === 'https:' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export function clearAdminApiKey() {
  if (!isBrowser()) return
  document.cookie = `${ADMIN_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function hasAdminSession() {
  return Boolean(getAdminApiKey())
}

