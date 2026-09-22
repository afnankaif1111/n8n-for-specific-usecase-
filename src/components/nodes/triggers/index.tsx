import type { NodeProps } from '@xyflow/react'
import { PriceTriggerNode } from './PriceTriggerNode'
import { TimerTriggerNode } from './TimerTriggerNode'
import { HyperliquidTriggerNode } from './HyperliquidTriggerNode'
import { BackpackTriggerNode } from './BackpackTriggerNode'
import { LighterTriggerNode } from './LighterTriggerNode'

export * from './PriceTriggerNode'
export * from './TimerTriggerNode'
export * from './HyperliquidTriggerNode'
export * from './BackpackTriggerNode'
export * from './LighterTriggerNode'

/**
 * Unified trigger dispatcher that delegates rendering to the specific individual trigger node component
 */
export function TriggerNodeDispatcher(props: NodeProps) {
  const data = props.data as { kind?: string } | undefined

  switch (data?.kind) {
    case 'price':
      return <PriceTriggerNode {...props} />
    case 'timer':
      return <TimerTriggerNode {...props} />
    case 'hyperliquid':
      return <HyperliquidTriggerNode {...props} />
    case 'backpack':
      return <BackpackTriggerNode {...props} />
    case 'lighter':
      return <LighterTriggerNode {...props} />
    default:
      return <PriceTriggerNode {...props} />
  }
}

/**
 * React Flow nodeTypes mapping for triggers
 */
export const triggerNodeTypes = {
  trigger: TriggerNodeDispatcher,
  'trigger-price': PriceTriggerNode,
  'trigger-timer': TimerTriggerNode,
  'trigger-hyperliquid': HyperliquidTriggerNode,
  'trigger-backpack': BackpackTriggerNode,
  'trigger-lighter': LighterTriggerNode,
}
