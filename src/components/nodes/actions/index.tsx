import type { NodeProps } from '@xyflow/react'
import { LighterActionNode } from './LighterActionNode'
import { HyperliquidActionNode } from './HyperliquidActionNode'
import { BackpackActionNode } from './BackpackActionNode'
import { TradeActionNode } from './TradeActionNode'
import { NotificationActionNode } from './NotificationActionNode'

export * from './LighterActionNode'
export * from './HyperliquidActionNode'
export * from './BackpackActionNode'
export * from './TradeActionNode'
export * from './NotificationActionNode'

/**
 * Unified action dispatcher that delegates rendering to the specific individual action node component
 */
export function ActionNodeDispatcher(props: NodeProps) {
  const data = props.data as { actionKind?: string; kind?: string } | undefined
  const kind = data?.actionKind || data?.kind

  switch (kind) {
    case 'mt5':
    case 'lighter':
      return <LighterActionNode {...props} />
    case 'ctrader':
    case 'hyperliquid':
      return <HyperliquidActionNode {...props} />
    case 'broker':
    case 'backpack':
      return <BackpackActionNode {...props} />
    case 'trade':
      return <TradeActionNode {...props} />
    case 'notification':
      return <NotificationActionNode {...props} />
    default:
      return <TradeActionNode {...props} />
  }
}

/**
 * React Flow nodeTypes mapping for actions
 */
export const actionNodeTypes = {
  action: ActionNodeDispatcher,
  'action-mt5': LighterActionNode,
  'action-ctrader': HyperliquidActionNode,
  'action-broker': BackpackActionNode,
  'action-lighter': LighterActionNode,
  'action-hyperliquid': HyperliquidActionNode,
  'action-backpack': BackpackActionNode,
  'action-trade': TradeActionNode,
  'action-notification': NotificationActionNode,
}
