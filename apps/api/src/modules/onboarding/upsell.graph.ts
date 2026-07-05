import { StateGraph } from '@langchain/langgraph'
import { OnboardingAnnotation } from './onboarding.state.js'
import { askUpsellNode } from './nodes/ask-upsell.js'
import { askPurchaseTypeNode } from './nodes/ask-purchase-type.js'
import { collectPurchaseTypeNode } from './nodes/collect-purchase-type.js'
import { showPlansNode } from './nodes/show-plans.js'
import { collectPlanChoiceNode } from './nodes/collect-plan-choice.js'
import { paymentNode } from './nodes/payment.js'
import { collectPaymentConfirmationNode } from './nodes/collect-payment-confirmation.js'
import { askChildSelectionNode } from './nodes/ask-child-selection.js'
import { collectChildSelectionNode } from './nodes/collect-child-selection.js'
import { askPhotoNode } from './nodes/ask-photo.js'
import { collectPhotoNode } from './nodes/collect-photo.js'
import { askStyleChoiceNode } from './nodes/ask-style-choice.js'
import { collectStyleChoiceNode } from './nodes/collect-style-choice.js'
import { askStoryNode } from './nodes/ask-story.js'
import { collectMomentPhotoNode } from './nodes/collect-moment-photo.js'
import { collectMomentNode } from './nodes/collect-moment.js'
import { collectChallengeNode } from './nodes/collect-challenge.js'
import { collectThemeNode } from './nodes/collect-theme.js'
import { triggerGenerationNode } from './nodes/trigger-generation.js'
import { checkpointer } from './checkpointer.js'

// CTA de upsell pra quem comprou um livro impresso único (não recorrente):
// convida a conhecer os planos de assinatura e, se topar, reaproveita o
// mesmo trecho compra→pagamento→coleta do onboarding, pulando nome/
// endereço/filhos/consentimento porque já estão salvos.
const graph = new StateGraph(OnboardingAnnotation)
  .addNode('ask_upsell',          askUpsellNode)
  .addNode('ask_purchase_type',   askPurchaseTypeNode)
  .addNode('collect_purchase_type', collectPurchaseTypeNode)
  .addNode('show_plans',          showPlansNode)
  .addNode('collect_plan_choice', collectPlanChoiceNode)
  .addNode('payment',             paymentNode)
  .addNode('collect_payment_confirmation', collectPaymentConfirmationNode)
  .addNode('ask_child_selection', askChildSelectionNode)
  .addNode('collect_child_selection', collectChildSelectionNode)
  .addNode('ask_photo',           askPhotoNode)
  .addNode('collect_photo',       collectPhotoNode)
  .addNode('ask_style_choice',    askStyleChoiceNode)
  .addNode('collect_style_choice', collectStyleChoiceNode)
  .addNode('ask_story',           askStoryNode)
  .addNode('collect_moment_photo', collectMomentPhotoNode)
  .addNode('collect_moment',      collectMomentNode)
  .addNode('collect_challenge',   collectChallengeNode)
  .addNode('collect_theme',       collectThemeNode)
  .addNode('trigger_generation',  triggerGenerationNode)

  .addEdge('__start__',           'ask_upsell')
  .addEdge('ask_upsell',          'ask_purchase_type')

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
  .addConditionalEdges('collect_photo', (state) =>
    state.photoInvalid ? 'collect_photo' : 'ask_style_choice')

  .addEdge('ask_style_choice',     'collect_style_choice')
  .addConditionalEdges('collect_style_choice', (state) => {
    if (state.styleChoiceInvalid) return 'collect_style_choice'
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

export const upsellGraph = graph.compile({ checkpointer })
