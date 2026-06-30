import type { GrantConsentBody } from './consent.models.js'
import { getChildWithSubscriber, grantImageConsent, revokeImageConsent } from './consent.repository.js'

export async function processConsent(body: GrantConsentBody): Promise<void> {
  // TODO: validar JWT token e extrair childId/subscriberId
  const childId = extractChildIdFromToken(body.token)

  const child = await getChildWithSubscriber(childId)
  if (!child) throw new Error('Child not found')

  if (body.accepted) {
    await grantImageConsent(childId)
  } else {
    await revokeImageConsent(childId)
  }
}

export async function getConsentStatus(childId: string) {
  const child = await getChildWithSubscriber(childId)
  if (!child) throw new Error('Child not found')
  return { childId, imageConsent: child.image_consent, consentAt: child.image_consent_at }
}

function extractChildIdFromToken(token: string): string {
  // TODO: implementar verificação JWT real
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
  return payload.childId as string
}
