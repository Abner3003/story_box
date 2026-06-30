import { StateGraph } from '@langchain/langgraph'
import { OnboardingAnnotation } from './onboarding.state.js'
import { welcomeNode } from './nodes/welcome.js'
import { showPlansNode } from './nodes/show-plans.js'
import { paymentNode } from './nodes/payment.js'
import { collectAddressNode } from './nodes/collect-address.js'
import { collectChildrenNode } from './nodes/collect-children.js'
import { awaitConsentNode } from './nodes/await-consent.js'
import { collectPhotoNode } from './nodes/collect-photo.js'
import { collectStoryNode } from './nodes/collect-story.js'
import { triggerGenerationNode } from './nodes/trigger-generation.js'
import type { OnboardingState } from './onboarding.state.js'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'


const databaseUrl = process.env.DATABASE_URL!
const checkpointer = PostgresSaver.fromConnString(databaseUrl)
await checkpointer.setup()


function routeAfterPayment(state: OnboardingState) {
  return state.plan === 'digital' ? 'collect_children' : 'collect_address'
}

function routeAfterConsent(state: OnboardingState) {
  return state.imageConsentAccepted ? 'collect_photo' : '__end__'
}

const graph = new StateGraph(OnboardingAnnotation)
  .addNode('welcome',            welcomeNode)
  .addNode('show_plans',         showPlansNode)
  .addNode('payment',            paymentNode)
  .addNode('collect_address',    collectAddressNode)
  .addNode('collect_children',   collectChildrenNode)
  .addNode('await_consent',      awaitConsentNode)
  .addNode('collect_photo',      collectPhotoNode)
  .addNode('collect_story',      collectStoryNode)
  .addNode('trigger_generation', triggerGenerationNode)
  .addEdge('__start__',          'welcome')
  .addEdge('welcome',            'show_plans')
  .addEdge('show_plans',         'payment')
  .addConditionalEdges('payment', routeAfterPayment, {
    collect_address:  'collect_address',
    collect_children: 'collect_children',
  })
  .addEdge('collect_address',    'collect_children')
  .addEdge('collect_children',   'await_consent')
  .addConditionalEdges('await_consent', routeAfterConsent, {
    collect_photo: 'collect_photo',
    __end__:       '__end__',
  })
  .addEdge('collect_photo',      'collect_story')
  .addEdge('collect_story',      'trigger_generation')
  .addEdge('trigger_generation', '__end__')

// const checkpointer = new MemorySaver()
export const onboardingGraph = graph.compile({ checkpointer })
