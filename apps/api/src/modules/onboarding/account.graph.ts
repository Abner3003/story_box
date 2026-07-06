import { StateGraph } from '@langchain/langgraph'
import { OnboardingAnnotation } from './onboarding.state.js'
import { askMenuNode } from './nodes/ask-menu.js'
import { collectMenuChoiceNode } from './nodes/collect-menu-choice.js'
import { sendHelpNode } from './nodes/send-help.js'
import { askAddressNode } from './nodes/ask-address.js'
import { collectZipNode } from './nodes/collect-zip.js'
import { collectNumberNode } from './nodes/collect-number.js'
import { collectComplementNode } from './nodes/collect-complement.js'
import { askPurchaseTypeNode } from './nodes/ask-purchase-type.js'
import { collectPurchaseTypeNode } from './nodes/collect-purchase-type.js'
import { showPlansNode } from './nodes/show-plans.js'
import { collectPlanChoiceNode } from './nodes/collect-plan-choice.js'
import { paymentNode } from './nodes/payment.js'
import { collectPaymentConfirmationNode } from './nodes/collect-payment-confirmation.js'
import { askChildSelectionNode } from './nodes/ask-child-selection.js'
import { collectChildSelectionNode } from './nodes/collect-child-selection.js'
import { listFamilyMembersNode } from './nodes/list-family-members.js'
import { collectFamilyListChoiceNode } from './nodes/collect-family-list-choice.js'
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
import { checkpointer } from './checkpointer.js'

// Menu de conta pra assinante já ativo, sem onboarding/coleta semanal
// pendente. Reaproveita os nodes de endereço do onboarding (ViaCEP,
// número, complemento) — a persistência de verdade em delivery_addresses
// já foi movida pra dentro de collect-complement.ts. A opção "gerar outro
// livro" reaproveita o mesmo trecho compra→pagamento→coleta do onboarding,
// pulando nome/endereço/filhos/consentimento porque já estão salvos
// (seedados em account.service.ts).
const graph = new StateGraph(OnboardingAnnotation)
  .addNode('ask_menu',            askMenuNode)
  .addNode('collect_menu_choice', collectMenuChoiceNode)
  .addNode('send_help',           sendHelpNode)
  .addNode('ask_address',         askAddressNode)
  .addNode('collect_zip',         collectZipNode)
  .addNode('collect_number',      collectNumberNode)
  .addNode('collect_complement',  collectComplementNode)
  .addNode('ask_purchase_type',   askPurchaseTypeNode)
  .addNode('collect_purchase_type', collectPurchaseTypeNode)
  .addNode('show_plans',          showPlansNode)
  .addNode('collect_plan_choice', collectPlanChoiceNode)
  .addNode('payment',             paymentNode)
  .addNode('collect_payment_confirmation', collectPaymentConfirmationNode)
  .addNode('ask_child_selection', askChildSelectionNode)
  .addNode('collect_child_selection', collectChildSelectionNode)
  .addNode('list_family_members', listFamilyMembersNode)
  .addNode('collect_family_list_choice', collectFamilyListChoiceNode)
  .addNode('ask_family_members',  askFamilyMembersNode)
  .addNode('collect_family_member_info', collectFamilyMemberInfoNode)
  .addNode('collect_family_member_photo', collectFamilyMemberPhotoNode)
  .addNode('ask_photo',           askPhotoNode)
  .addNode('collect_photo',       collectPhotoNode)
  .addNode('ask_story',           askStoryNode)
  .addNode('collect_moment_photo', collectMomentPhotoNode)
  .addNode('collect_moment',      collectMomentNode)
  .addNode('collect_challenge',   collectChallengeNode)
  .addNode('collect_theme',       collectThemeNode)
  .addNode('trigger_generation',  triggerGenerationNode)

  .addEdge('__start__',           'ask_menu')
  .addEdge('ask_menu',            'collect_menu_choice')
  .addConditionalEdges('collect_menu_choice', (state) => {
    if (state.menuChoiceInvalid) return 'collect_menu_choice'
    if (state.menuChoice === 'address') return 'ask_address'
    if (state.menuChoice === 'new_book') return 'ask_purchase_type'
    if (state.menuChoice === 'family') return 'list_family_members'
    return 'send_help'
  })
  .addEdge('send_help',           '__end__')

  .addEdge('list_family_members', 'collect_family_list_choice')
  .addConditionalEdges('collect_family_list_choice', (state) =>
    state.familyListAddChosen ? 'ask_family_members' : '__end__')

  .addEdge('ask_family_members',  'collect_family_member_info')
  .addConditionalEdges('collect_family_member_info', (state) => {
    if (state.familyMemberInfoInvalid) return 'collect_family_member_info'
    return state.familyMembersDone ? '__end__' : 'collect_family_member_photo'
  })
  .addConditionalEdges('collect_family_member_photo', (state) =>
    state.familyMemberPhotoInvalid ? 'collect_family_member_photo' : 'collect_family_member_info')

  .addEdge('ask_address',         'collect_zip')
  .addConditionalEdges('collect_zip', (state) => state.zipInvalid ? 'collect_zip' : 'collect_number')
  .addEdge('collect_number',      'collect_complement')
  .addEdge('collect_complement',  '__end__')

  .addEdge('ask_purchase_type',   'collect_purchase_type')
  .addConditionalEdges('collect_purchase_type', (state) =>
    state.purchaseTypeInvalid ? 'collect_purchase_type' : 'show_plans')
  .addEdge('show_plans',          'collect_plan_choice')
  .addConditionalEdges('collect_plan_choice', (state) =>
    state.planChoiceInvalid ? 'collect_plan_choice' : 'payment')

  .addConditionalEdges('payment', (state) => state.simulate ? 'ask_child_selection' : 'collect_payment_confirmation')
  .addConditionalEdges('collect_payment_confirmation', (state) =>
    state.paymentConfirmed ? 'ask_child_selection' : 'collect_payment_confirmation')

  .addConditionalEdges('ask_child_selection', (state) =>
    state.children.length > 1 ? 'collect_child_selection' : 'ask_photo')
  .addConditionalEdges('collect_child_selection', (state) =>
    state.childSelectionInvalid ? 'collect_child_selection' : 'ask_photo')

  .addEdge('ask_photo',            'collect_photo')
  .addConditionalEdges('collect_photo', (state) => {
    if (state.photoInvalid) return 'collect_photo'
    return state.photoQueueIndex < state.featuredChildIndices.length ? 'collect_photo' : 'ask_story'
  })

  .addEdge('ask_story',            'collect_moment_photo')
  .addConditionalEdges('collect_moment_photo', (state) =>
    state.momentPhotoInvalid ? 'collect_moment_photo' : 'collect_moment')
  .addEdge('collect_moment',       'collect_challenge')
  .addEdge('collect_challenge',    'collect_theme')
  .addConditionalEdges('collect_theme', (state) =>
    state.storyQueueIndex < state.featuredChildIndices.length ? 'collect_moment_photo' : 'trigger_generation')
  .addEdge('trigger_generation',   '__end__')

export const accountGraph = graph.compile({ checkpointer })
