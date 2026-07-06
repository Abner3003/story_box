import type { Child, FamilyMember } from '@storybox/db'
import { generateStyledPortrait } from './style-preview.js'
import {
  downloadChildPhoto,
  uploadChildStyledReference,
  saveChildStyledReference,
  uploadFamilyMemberStyledReference,
  saveFamilyMemberStyledReference,
} from '../modules/onboarding/onboarding.repository.js'
import type { ReferenceImage } from './illustration.js'

// Resolve a foto de referência de um personagem pra usar na geração de
// ilustração: se já existe um retrato estilizado guardado (e ele é do MESMO
// estilo do livro atual), reusa — senão gera um novo a partir da foto crua
// e guarda pra não precisar gerar de novo nas próximas páginas/livros.
export async function resolveChildReference(child: Child, styleId: string): Promise<ReferenceImage | null> {
  const profile = child.visual_profile
  if (profile?.styled_reference_path && profile.styled_reference_style === styleId) {
    return downloadChildPhoto(profile.styled_reference_path)
  }

  if (!child.photo_storage_path || !profile) return null

  const rawPhoto = await downloadChildPhoto(child.photo_storage_path)
  const styledBase64 = await generateStyledPortrait(rawPhoto.base64, rawPhoto.mimeType, styleId)
  const path = await uploadChildStyledReference(child.id, styleId, styledBase64)
  await saveChildStyledReference(child.id, profile, path, styleId)

  return { base64: styledBase64, mimeType: 'image/png' }
}

export async function resolveFamilyMemberReference(member: FamilyMember, styleId: string): Promise<ReferenceImage | null> {
  const profile = member.visual_profile
  if (profile?.styled_reference_path && profile.styled_reference_style === styleId) {
    return downloadChildPhoto(profile.styled_reference_path)
  }

  if (!member.photo_storage_path || !profile) return null

  const rawPhoto = await downloadChildPhoto(member.photo_storage_path)
  const styledBase64 = await generateStyledPortrait(rawPhoto.base64, rawPhoto.mimeType, styleId)
  const path = await uploadFamilyMemberStyledReference(member.id, styleId, styledBase64)
  await saveFamilyMemberStyledReference(member.id, profile, path, styleId)

  return { base64: styledBase64, mimeType: 'image/png' }
}
