import { StateGraph } from '@langchain/langgraph'
import { OnboardingAnnotation } from './onboarding.state.js'
import { askMenuNode } from './nodes/ask-menu.js'
import { collectMenuChoiceNode } from './nodes/collect-menu-choice.js'
import { sendHelpNode } from './nodes/send-help.js'
import { askAddressNode } from './nodes/ask-address.js'
import { collectZipNode } from './nodes/collect-zip.js'
import { collectNumberNode } from './nodes/collect-number.js'
import { collectComplementNode } from './nodes/collect-complement.js'
import { checkpointer } from './checkpointer.js'

// Menu de conta pra assinante já ativo, sem onboarding/coleta semanal
// pendente. Reaproveita os nodes de endereço do onboarding (ViaCEP,
// número, complemento) — a persistência de verdade em delivery_addresses
// já foi movida pra dentro de collect-complement.ts.
const graph = new StateGraph(OnboardingAnnotation)
  .addNode('ask_menu',            askMenuNode)
  .addNode('collect_menu_choice', collectMenuChoiceNode)
  .addNode('send_help',           sendHelpNode)
  .addNode('ask_address',         askAddressNode)
  .addNode('collect_zip',         collectZipNode)
  .addNode('collect_number',      collectNumberNode)
  .addNode('collect_complement',  collectComplementNode)

  .addEdge('__start__',           'ask_menu')
  .addEdge('ask_menu',            'collect_menu_choice')
  .addConditionalEdges('collect_menu_choice', (state) => {
    if (state.menuChoiceInvalid) return 'collect_menu_choice'
    return state.menuChoice === 'address' ? 'ask_address' : 'send_help'
  })
  .addEdge('send_help',           '__end__')

  .addEdge('ask_address',         'collect_zip')
  .addConditionalEdges('collect_zip', (state) => state.zipInvalid ? 'collect_zip' : 'collect_number')
  .addEdge('collect_number',      'collect_complement')
  .addEdge('collect_complement',  '__end__')

export const accountGraph = graph.compile({ checkpointer })
