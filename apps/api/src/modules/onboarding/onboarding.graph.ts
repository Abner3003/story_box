import { StateGraph } from '@langchain/langgraph'
import { OnboardingAnnotation } from './onboarding.state.js'
import { welcomeNode } from './nodes/welcome.js'
import { collectNameNode } from './nodes/collect-name.js'
import { askPurchaseTypeNode } from './nodes/ask-purchase-type.js'
import { collectPurchaseTypeNode } from './nodes/collect-purchase-type.js'
import { showPlansNode } from './nodes/show-plans.js'
import { collectPlanChoiceNode } from './nodes/collect-plan-choice.js'
import { collectEmailNode } from './nodes/collect-email.js'
import { collectCpfNode } from './nodes/collect-cpf.js'
import { paymentNode } from './nodes/payment.js'
import { collectPaymentConfirmationNode } from './nodes/collect-payment-confirmation.js'
import { askAddressNode } from './nodes/ask-address.js'
import { collectZipNode } from './nodes/collect-zip.js'
import { collectNumberNode } from './nodes/collect-number.js'
import { collectComplementNode } from './nodes/collect-complement.js'
import { askChildrenNode } from './nodes/ask-children.js'
import { collectChildNameNode } from './nodes/collect-child-name.js'
import { collectChildBirthNode } from './nodes/collect-child-birth.js'
import { askChildRegistrationPhotoNode } from './nodes/ask-child-registration-photo.js'
import { collectChildRegistrationPhotoNode } from './nodes/collect-child-registration-photo.js'
import { collectMoreChildrenNode } from './nodes/collect-more-children.js'
import { askChildSelectionNode } from './nodes/ask-child-selection.js'
import { collectChildSelectionNode } from './nodes/collect-child-selection.js'
import { askConsentNode } from './nodes/ask-consent.js'
import { collectConsentNode } from './nodes/collect-consent.js'
import { askFamilyMembersNode } from './nodes/ask-family-members.js'
import { collectFamilyMemberInfoNode } from './nodes/collect-family-member-info.js'
import { collectFamilyMemberPhotoNode } from './nodes/collect-family-member-photo.js'
import { askPhotoNode } from './nodes/ask-photo.js'
import { collectPhotoNode } from './nodes/collect-photo.js'
import { askStoryNode } from './nodes/ask-story.js'
import { collectMomentPhotoNode } from './nodes/collect-moment-photo.js'
import { collectMomentNode } from './nodes/collect-moment.js'
import { collectChallengeNode } from './nodes/collect-challenge.js'
import { collectThemeNode } from './nodes/collect-theme.js'
import { triggerGenerationNode } from './nodes/trigger-generation.js'
import type { OnboardingState } from './onboarding.state.js'
import { checkpointer } from './checkpointer.js'

function routeAfterPayment(state: OnboardingState) {
  return state.plan === 'digital' ? 'ask_consent' : 'ask_address'
}

function editRoute(state: OnboardingState): string | null {
  if (state.editIntent === 'plan') return 'show_plans'
  if (state.editIntent === 'address') return 'ask_address'
  if (state.editIntent === 'child') return 'ask_children'
  return null
}

const graph = new StateGraph(OnboardingAnnotation)
  .addNode('welcome',                     welcomeNode)
  .addNode('collect_name',                collectNameNode)
  .addNode('ask_purchase_type',           askPurchaseTypeNode)
  .addNode('collect_purchase_type',       collectPurchaseTypeNode)
  .addNode('show_plans',                  showPlansNode)
  .addNode('collect_plan_choice',         collectPlanChoiceNode)
  .addNode('collect_email',               collectEmailNode)
  .addNode('collect_cpf',                 collectCpfNode)
  .addNode('payment',                     paymentNode)
  .addNode('collect_payment_confirmation', collectPaymentConfirmationNode)
  .addNode('ask_address',                 askAddressNode)
  .addNode('collect_zip',                 collectZipNode)
  .addNode('collect_number',              collectNumberNode)
  .addNode('collect_complement',          collectComplementNode)
  .addNode('ask_children',                askChildrenNode)
  .addNode('collect_child_name',          collectChildNameNode)
  .addNode('collect_child_birth',         collectChildBirthNode)
  .addNode('ask_child_registration_photo', askChildRegistrationPhotoNode)
  .addNode('collect_child_registration_photo', collectChildRegistrationPhotoNode)
  .addNode('collect_more_children',       collectMoreChildrenNode)
  .addNode('ask_child_selection',         askChildSelectionNode)
  .addNode('collect_child_selection',     collectChildSelectionNode)
  .addNode('ask_consent',                 askConsentNode)
  .addNode('collect_consent',             collectConsentNode)
  .addNode('ask_family_members',          askFamilyMembersNode)
  .addNode('collect_family_member_info',  collectFamilyMemberInfoNode)
  .addNode('collect_family_member_photo', collectFamilyMemberPhotoNode)
  .addNode('ask_photo',                   askPhotoNode)
  .addNode('collect_photo',               collectPhotoNode)
  .addNode('ask_story',                   askStoryNode)
  .addNode('collect_moment_photo',        collectMomentPhotoNode)
  .addNode('collect_moment',              collectMomentNode)
  .addNode('collect_challenge',           collectChallengeNode)
  .addNode('collect_theme',               collectThemeNode)
  .addNode('trigger_generation',          triggerGenerationNode)

  .addEdge('__start__',            'welcome')
  .addEdge('welcome',              'collect_name')
  .addEdge('collect_name',         'ask_purchase_type')
  .addEdge('ask_purchase_type',    'collect_purchase_type')
  .addConditionalEdges('collect_purchase_type', (state) => state.purchaseTypeInvalid ? 'retry' : 'ok', {
    retry: 'collect_purchase_type',
    ok:    'show_plans',
  })
  .addEdge('show_plans',           'collect_plan_choice')
  .addConditionalEdges('collect_plan_choice', (state) => state.planChoiceInvalid ? 'retry' : 'ok', {
    retry: 'collect_plan_choice',
    ok:    'collect_email',
  })
  .addConditionalEdges('collect_email', (state) =>
    editRoute(state) ?? (state.emailInvalid ? 'collect_email' : 'collect_cpf'))
  .addConditionalEdges('collect_cpf', (state) =>
    editRoute(state) ?? (state.cpfInvalid ? 'collect_cpf' : 'payment'))

  .addConditionalEdges('payment', (state) => state.simulate ? routeAfterPayment(state) : 'collect_payment_confirmation')
  .addConditionalEdges('collect_payment_confirmation', (state) =>
    editRoute(state) ?? (state.paymentConfirmed ? routeAfterPayment(state) : 'collect_payment_confirmation'))

  .addEdge('ask_address',          'collect_zip')
  .addConditionalEdges('collect_zip', (state) =>
    editRoute(state) ?? (state.zipInvalid ? 'collect_zip' : 'collect_number'))
  .addConditionalEdges('collect_number', (state) => editRoute(state) ?? 'collect_complement')
  .addConditionalEdges('collect_complement', (state) => editRoute(state) ?? state.returnTo ?? 'ask_consent')

  .addEdge('ask_consent',          'collect_consent')
  .addConditionalEdges('collect_consent', (state) => {
    const edit = editRoute(state)
    if (edit) return edit
    if (state.consentInvalid) return 'collect_consent'
    return state.imageConsentAccepted ? 'ask_children' : '__end__'
  })

  .addEdge('ask_children',         'collect_child_name')
  .addConditionalEdges('collect_child_name', (state) => editRoute(state) ?? 'collect_child_birth')
  .addConditionalEdges('collect_child_birth', (state) => {
    const edit = editRoute(state)
    if (edit) return edit
    return state.childBirthInvalid ? 'collect_child_birth' : 'ask_child_registration_photo'
  })
  .addEdge('ask_child_registration_photo', 'collect_child_registration_photo')
  .addConditionalEdges('collect_child_registration_photo', (state) => {
    const edit = editRoute(state)
    if (edit) return edit
    if (state.childRegistrationPhotoInvalid) return 'collect_child_registration_photo'
    return state.childrenDone ? 'ask_child_selection' : 'collect_more_children'
  })
  .addConditionalEdges('collect_more_children', (state) => {
    const edit = editRoute(state)
    if (edit) return edit
    if (state.moreChildrenInvalid) return 'collect_more_children'
    return state.childrenDone ? 'ask_child_selection' : 'collect_child_birth'
  })

  .addConditionalEdges('ask_child_selection', (state) => state.children.length > 1 ? 'collect_child_selection' : 'ask_family_members')
  .addConditionalEdges('collect_child_selection', (state) =>
    editRoute(state) ?? (state.childSelectionInvalid ? 'collect_child_selection' : 'ask_family_members'))

  .addEdge('ask_family_members',  'collect_family_member_info')
  .addConditionalEdges('collect_family_member_info', (state) => {
    const edit = editRoute(state)
    if (edit) return edit
    if (state.familyMemberInfoInvalid) return 'collect_family_member_info'
    return state.familyMembersDone ? 'ask_photo' : 'collect_family_member_photo'
  })
  .addConditionalEdges('collect_family_member_photo', (state) => {
    const edit = editRoute(state)
    if (edit) return edit
    return state.familyMemberPhotoInvalid ? 'collect_family_member_photo' : 'collect_family_member_info'
  })

  .addConditionalEdges('ask_photo', (state) => {
    if (state.photoAlreadyOnFile) {
      return state.photoQueueIndex < state.featuredChildIndices.length ? 'ask_photo' : 'ask_story'
    }
    return 'collect_photo'
  })
  .addConditionalEdges('collect_photo', (state) => {
    const edit = editRoute(state)
    if (edit) return edit
    if (state.photoInvalid) return 'collect_photo'
    return state.photoQueueIndex < state.featuredChildIndices.length ? 'collect_photo' : 'ask_story'
  })

  .addEdge('ask_story',            'collect_moment_photo')
  .addConditionalEdges('collect_moment_photo', (state) => {
    const edit = editRoute(state)
    if (edit) return edit
    return state.momentPhotoInvalid ? 'collect_moment_photo' : 'collect_moment'
  })
  .addConditionalEdges('collect_moment', (state) => editRoute(state) ?? 'collect_challenge')
  .addConditionalEdges('collect_challenge', (state) => editRoute(state) ?? 'collect_theme')
  .addConditionalEdges('collect_theme', (state) => {
    const edit = editRoute(state)
    if (edit) return edit
    return state.storyQueueIndex < state.featuredChildIndices.length ? 'collect_moment_photo' : 'trigger_generation'
  })
  .addEdge('trigger_generation',   '__end__')

export const onboardingGraph = graph.compile({ checkpointer })
