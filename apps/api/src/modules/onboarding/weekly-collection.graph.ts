import { StateGraph } from '@langchain/langgraph'
import { OnboardingAnnotation } from './onboarding.state.js'
import { askWeeklyKickoffNode } from './nodes/ask-weekly-kickoff.js'
import { collectWeeklyKickoffReplyNode } from './nodes/collect-weekly-kickoff-reply.js'
import { askChildSelectionNode } from './nodes/ask-child-selection.js'
import { collectChildSelectionNode } from './nodes/collect-child-selection.js'
import { askPhotoNode } from './nodes/ask-photo.js'
import { collectPhotoNode } from './nodes/collect-photo.js'
import { askStyleChoiceNode } from './nodes/ask-style-choice.js'
import { collectStyleChoiceNode } from './nodes/collect-style-choice.js'
import { askStoryNode } from './nodes/ask-story.js'
import { collectMomentNode } from './nodes/collect-moment.js'
import { collectChallengeNode } from './nodes/collect-challenge.js'
import { triggerGenerationNode } from './nodes/trigger-generation.js'
import { checkpointer } from './checkpointer.js'

// Reentrada semanal pra assinantes: reaproveita o mesmo trecho do grafo de
// onboarding (ask_child_selection → trigger_generation), pulando
// ask_consent/collect_consent porque a autorização já foi dada uma vez e
// fica salva em children.image_consent.
const graph = new StateGraph(OnboardingAnnotation)
  .addNode('ask_weekly_kickoff',            askWeeklyKickoffNode)
  .addNode('collect_weekly_kickoff_reply',  collectWeeklyKickoffReplyNode)
  .addNode('ask_child_selection',           askChildSelectionNode)
  .addNode('collect_child_selection',       collectChildSelectionNode)
  .addNode('ask_photo',                     askPhotoNode)
  .addNode('collect_photo',                 collectPhotoNode)
  .addNode('ask_style_choice',              askStyleChoiceNode)
  .addNode('collect_style_choice',          collectStyleChoiceNode)
  .addNode('ask_story',                     askStoryNode)
  .addNode('collect_moment',                collectMomentNode)
  .addNode('collect_challenge',             collectChallengeNode)
  .addNode('trigger_generation',            triggerGenerationNode)

  .addEdge('__start__',                    'ask_weekly_kickoff')
  .addEdge('ask_weekly_kickoff',           'collect_weekly_kickoff_reply')
  .addEdge('collect_weekly_kickoff_reply', 'ask_child_selection')

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

  .addEdge('ask_story',            'collect_moment')
  .addEdge('collect_moment',       'collect_challenge')
  .addConditionalEdges('collect_challenge', (state) =>
    state.storyQueueIndex < state.featuredChildIndices.length ? 'collect_moment' : 'trigger_generation')
  .addEdge('trigger_generation',   '__end__')

export const weeklyCollectionGraph = graph.compile({ checkpointer })
