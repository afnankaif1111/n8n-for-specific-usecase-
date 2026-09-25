import type { NodeProps } from '@xyflow/react'
import { GeminiNode } from './GeminiNode'
import { ChatGPTNode } from './ChatGPTNode'
import { ClaudeNode } from './ClaudeNode'
import { ConditionNode } from './ConditionNode'
import { SmartICTNode } from './SmartICTNode'

export * from './GeminiNode'
export * from './ChatGPTNode'
export * from './ClaudeNode'
export * from './ConditionNode'
export * from './SmartICTNode'

export type IntermediateKind = 'gemini' | 'chatgpt' | 'claude' | 'condition' | 'smart-ict' | 'ict'

/**
 * Unified intermediate node dispatcher that delegates rendering to the specific individual node component
 */
export function IntermediateNodeDispatcher(props: NodeProps) {
  const data = props.data as { intermediateKind?: string; kind?: string; actionKind?: string } | undefined
  const kind = (data?.intermediateKind || data?.kind || '').toLowerCase()

  switch (kind) {
    case 'smart-ict':
    case 'ict':
      return <SmartICTNode {...props} />
    case 'gemini':
    case 'google':
      return <GeminiNode {...props} />
    case 'chatgpt':
    case 'openai':
    case 'gpt':
      return <ChatGPTNode {...props} />
    case 'claude':
    case 'anthropic':
      return <ClaudeNode {...props} />
    case 'condition':
    case 'risk':
      return <ConditionNode {...props} />
    default:
      return <GeminiNode {...props} />
  }
}

/**
 * React Flow nodeTypes mapping for intermediate nodes
 */
export const intermediateNodeTypes = {
  intermediate: IntermediateNodeDispatcher,
  'intermediate-smart-ict': SmartICTNode,
  'intermediate-ict': SmartICTNode,
  'smart-ict': SmartICTNode,
  ict: SmartICTNode,
  'intermediate-gemini': GeminiNode,
  'intermediate-chatgpt': ChatGPTNode,
  'intermediate-claude': ClaudeNode,
  'intermediate-condition': ConditionNode,
  gemini: GeminiNode,
  chatgpt: ChatGPTNode,
  claude: ClaudeNode,
  condition: ConditionNode,
}
