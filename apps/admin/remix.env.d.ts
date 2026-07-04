/// <reference types="@remix-run/cloudflare" />
/// <reference types="vite/client" />

declare module '@remix-run/cloudflare' {
  interface AppLoadContext {
    cloudflare?: {
      env?: {
        API_PUBLIC_URL?: string
        PUBLIC_API_URL?: string
        ADMIN_API_KEY?: string
        ADMIN_REVIEWER_NAME?: string
      }
    }
  }
}
