import { StateGraph } from '@langchain/langgraph'
import { OnboardingAnnotation } from './onboarding.state.js'
import { askWeeklyKickoffNode } from './nodes/ask-weekly-kickoff.js'
import { collectWeeklyKickoffReplyNode } from './nodes/collect-weekly-kickoff-reply.js'
import { askChildSelectionNode } from './nodes/ask-child-selection.js'
import { collectChildSelectionNode } from './nodes/collect-child-selection.js'
import { askPhotoNode } from './nodes/ask-photo.js'
import { collectPhotoNode } from './nodes/collect-photo.js'
import { askStoryNode } from './nodes/ask-story.js'
import { collectMomentPhotoNode } from './nodes/collect-moment-photo.js'
import { collectMomentNode } from './nodes/collect-moment.js'
import { collectChallengeNode } from './nodes/collect-challenge.js'
import { collectThemeNode } from './nodes/collect-theme.js'
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
  .addNode('ask_story',                     askStoryNode)
  .addNode('collect_moment_photo',          collectMomentPhotoNode)
  .addNode('collect_moment',                collectMomentNode)
  .addNode('collect_challenge',             collectChallengeNode)
  .addNode('collect_theme',                 collectThemeNode)
  .addNode('trigger_generation',            triggerGenerationNode)

  .addEdge('__start__',                    'ask_weekly_kickoff')
  .addEdge('ask_weekly_kickoff',           'collect_weekly_kickoff_reply')
  .addEdge('collect_weekly_kickoff_reply', 'ask_child_selection')

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

export const weeklyCollectionGraph = graph.compile({ checkpointer })
