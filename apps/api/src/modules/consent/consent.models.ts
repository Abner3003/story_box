export interface ConsentTokenPayload {
  subscriberId: string
  childId: string
  iat: number
  exp: number
}

export interface GrantConsentBody {
  token: string
  accepted: boolean
}
