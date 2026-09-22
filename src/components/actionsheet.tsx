import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Flame,
  Zap,
  Briefcase,
  Play,
  Bell,
  Plus,
  Check,
  SlidersHorizontal,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Coins,
  Percent,
} from 'lucide-react'
export type ActionKind = 'lighter' | 'hyperliquid' | 'backpack' | 'trade' | 'notification'

export interface ActionConfig {
  actionType?: 'market' | 'limit' | 'cancel' | 'liquidity' | string
  pair?: string
  side?: 'buy' | 'sell' | string
  amount?: string
  price?: string
  slippage?: string
  [key: string]: unknown
}

export interface ActionDefinition {
  kind: ActionKind
  title: string
  subtitle: string
  description: string
  icon: typeof Flame
  defaultLabel: string
  color: string
  badgeColor: string
  presets: string[]
}

export const ACTION_OPTIONS: ActionDefinition[] = [
  {
    kind: 'lighter',
    title: 'Lighter DEX Action',
    subtitle: 'Orderbook & Liquidity Execution',
    description: 'Dispatches high-frequency limit, market, or cancellation orders directly on Lighter DEX.',
    icon: Flame,
    defaultLabel: 'Lighter: Market Buy ETH-PERP',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    presets: ['Lighter Market Buy', 'Lighter Limit Bid', 'Cancel All Open Orders', 'Rebalance Liquidity'],
  },
  {
    kind: 'hyperliquid',
    title: 'Hyperliquid Perp Action',
    subtitle: 'Perpetuals DEX Order',
    description: 'Executes perpetual futures orders, adjusts leverage, and manages margin positions on Hyperliquid.',
    icon: Zap,
    defaultLabel: 'Hyperliquid: Open 5x Long',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    presets: ['Open Long 5x', 'Close 50% Position', 'Set Stop-Loss Order', 'Market Take-Profit'],
  },
  {
    kind: 'backpack',
    title: 'Backpack Spot Action',
    subtitle: 'Exchange Spot Execution',
    description: 'Executes spot order routing, token swaps, and deposit/withdrawal transfers on Backpack.',
    icon: Briefcase,
    defaultLabel: 'Backpack: Spot Swap USDC -> SOL',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    presets: ['Spot Buy SOL', 'Take Profit 100%', 'Transfer to Vault', 'DCA Order'],
  },
  {
    kind: 'trade',
    title: 'Universal Swap / Trade',
    subtitle: 'Cross-DEX Smart Router',
    description: 'Dispatches optimal trades across DEX aggregators with slippage protection and optimal routing.',
    icon: Play,
    defaultLabel: 'Execute DEX Swap Router',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    presets: ['Market Swap 1k USDC', 'Smart Rebalance', 'TWAP Order Execution', 'Emergency Unwind'],
  },
  {
    kind: 'notification',
    title: 'Dispatch Alert',
    subtitle: 'Telegram, Discord & Webhook',
    description: 'Sends instant execution receipts, PnL updates, and failure notifications to external channels.',
    icon: Bell,
    defaultLabel: 'Send Execution Webhook Alert',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    presets: ['Telegram Alert', 'Discord Webhook', 'Slack Notification', 'Console Log'],
  },
]

export interface ActionSheetProps {
  onAddAction: (
    kind: ActionKind,
    label: string,
    subtitle?: string,
    config?: ActionConfig
  ) => void
  triggerElement?: React.ReactNode
}

export function ActionSheet({ onAddAction, triggerElement }: ActionSheetProps) {
  const [open, setOpen] = useState(false)
  const [selectedKind, setSelectedKind] = useState<ActionKind>('lighter')
  const [customLabel, setCustomLabel] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('Lighter Market Buy')

  // Lighter Action specific parameter states
  const [lighterOrderType, setLighterOrderType] = useState<'market' | 'limit' | 'cancel' | 'liquidity'>('market')
  const [lighterPair, setLighterPair] = useState('ETH-PERP')
  const [lighterSide, setLighterSide] = useState<'buy' | 'sell'>('buy')
  const [lighterAmount, setLighterAmount] = useState('0.5 ETH')
  const [lighterPrice, setLighterPrice] = useState('2,650')
  const [lighterSlippage, setLighterSlippage] = useState('0.5%')

  const activeAction = ACTION_OPTIONS.find((a) => a.kind === selectedKind) ?? ACTION_OPTIONS[0]

  const handleSelectKind = (kind: ActionKind) => {
    setSelectedKind(kind)
    const action = ACTION_OPTIONS.find((a) => a.kind === kind)
    if (action) {
      setCustomLabel(action.defaultLabel)
      setSelectedPreset(action.presets[0] ?? '')
    }
  }

  const handleApplyPreset = (preset: string) => {
    setSelectedPreset(preset)
    if (selectedKind === 'lighter') {
      if (preset.includes('Market Buy')) {
        setLighterOrderType('market')
        setLighterSide('buy')
        setLighterAmount('0.5 ETH')
        setLighterPair('ETH-PERP')
        setCustomLabel('Lighter: Market Buy ETH-PERP')
      } else if (preset.includes('Limit Bid')) {
        setLighterOrderType('limit')
        setLighterSide('buy')
        setLighterAmount('1.0 ETH')
        setLighterPrice('2,650')
        setLighterPair('ETH-PERP')
        setCustomLabel('Lighter: Limit Bid $2,650')
      } else if (preset.includes('Cancel')) {
        setLighterOrderType('cancel')
        setCustomLabel('Lighter: Cancel All Open Orders')
      } else if (preset.includes('Liquidity')) {
        setLighterOrderType('liquidity')
        setLighterAmount('2,000 USDC')
        setCustomLabel('Lighter: Rebalance Liquidity Pool')
      } else {
        setCustomLabel(`${activeAction.title}: ${preset}`)
      }
    } else {
      setCustomLabel(`${activeAction.title}: ${preset}`)
    }
  }

  const handleConfirmAdd = () => {
    if (selectedKind === 'lighter') {
      const isBuy = lighterSide === 'buy'
      const sideText = isBuy ? 'Buy' : 'Sell'
      const generatedLabel = lighterOrderType === 'cancel'
        ? `Lighter: Cancel ${lighterPair} Orders`
        : `Lighter: ${lighterOrderType.toUpperCase()} ${sideText} ${lighterPair}`

      const finalLabel = customLabel.trim() || generatedLabel
      const subtitle = lighterOrderType === 'limit'
        ? `Order: ${lighterSide.toUpperCase()} ${lighterAmount} @ $${lighterPrice}`
        : `Order: ${lighterSide.toUpperCase()} ${lighterAmount} • Slippage ${lighterSlippage}`

      onAddAction(selectedKind, finalLabel, subtitle, {
        actionType: lighterOrderType,
        pair: lighterPair,
        side: lighterSide,
        amount: lighterAmount,
        price: lighterOrderType === 'limit' ? lighterPrice : undefined,
        slippage: lighterSlippage,
      })
    } else {
      const finalLabel = customLabel.trim() || activeAction.defaultLabel
      onAddAction(selectedKind, finalLabel, activeAction.description)
    }
    setOpen(false)
  }

  const handleQuickAdd = (action: ActionDefinition) => {
    if (action.kind === 'lighter') {
      onAddAction(action.kind, 'Lighter: Market Buy ETH-PERP', 'Order: BUY 0.5 ETH • Slippage 0.5%', {
        actionType: 'market',
        pair: 'ETH-PERP',
        side: 'buy',
        amount: '0.5 ETH',
        slippage: '0.5%',
      })
    } else {
      onAddAction(action.kind, action.defaultLabel, action.description)
    }
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {triggerElement || (
          <Button size="sm" variant="default" className="gap-2 h-8 text-xs font-semibold cursor-pointer bg-orange-600 hover:bg-orange-700 text-white">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Action</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col gap-0 bg-background border-l border-border"
      >
        {/* Header */}
        <SheetHeader className="p-5 border-b border-border/70 bg-card/40 text-left">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-foreground">
                Action Node Catalog
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Select an execution action (including Lighter DEX) to add to your workflow.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left">
          {/* List of Action Kinds */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              1. Choose Action Execution Kind
            </div>

            <div className="space-y-2">
              {ACTION_OPTIONS.map((action) => {
                const Icon = action.icon
                const isSelected = action.kind === selectedKind

                return (
                  <div
                    key={action.kind}
                    onClick={() => handleSelectKind(action.kind)}
                    className={`relative p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/5 shadow-xs'
                        : 'border-border bg-card hover:bg-muted/50 hover:border-orange-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${action.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {action.title}
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${action.badgeColor}`}>
                              {action.kind}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            {action.description}
                          </p>
                        </div>
                      </div>

                      {/* Quick Add Button */}
                      <Button
                        size="xs"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickAdd(action)
                        }}
                        className="shrink-0 text-[11px] h-6 px-2 gap-1 cursor-pointer"
                        title="Add immediately to canvas"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Configuration & Presets for Selected Action */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>2. Customize {activeAction.title}</span>
              </div>
            </div>

            {/* Presets Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {activeAction.presets.map((preset) => {
                  const isPresetActive = selectedPreset === preset
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                        isPresetActive
                          ? 'bg-orange-600 text-white border-orange-600 font-medium'
                          : 'bg-muted/60 text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      {preset}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Lighter Action Specific Parameter Form */}
            {selectedKind === 'lighter' && (
              <div className="space-y-3.5 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3.5 mt-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-orange-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                    <Flame className="h-4 w-4" />
                    <span>Lighter DEX Execution Parameters</span>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    Order Config
                  </span>
                </div>

                {/* 1. Order Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Action Type:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['market', 'limit', 'cancel', 'liquidity'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setLighterOrderType(type)}
                        className={`text-[11px] py-1 rounded-md border font-medium capitalize transition-all cursor-pointer ${
                          lighterOrderType === type
                            ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                            : 'bg-card text-muted-foreground hover:text-foreground border-border'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Trading Pair Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Lighter Market / Pair</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">Orderbook contract</span>
                  </div>
                  <input
                    type="text"
                    value={lighterPair}
                    onChange={(e) => setLighterPair(e.target.value)}
                    placeholder="ETH-PERP"
                    className="w-full h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  {/* Quick Pair Selector */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-muted-foreground mr-0.5">Quick:</span>
                    {['ETH-PERP', 'WBTC-PERP', 'SOL-PERP', 'USDC-PERP'].map((pair) => (
                      <button
                        key={pair}
                        type="button"
                        onClick={() => setLighterPair(pair)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          lighterPair === pair
                            ? 'bg-orange-500 text-white border-orange-600 font-medium'
                            : 'bg-background hover:bg-muted text-foreground border-border'
                        }`}
                      >
                        {pair}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Order Side (Buy / Sell) */}
                {lighterOrderType !== 'cancel' && lighterOrderType !== 'liquidity' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Execution Side:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLighterSide('buy')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          lighterSide === 'buy'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-card text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        <span>Buy / Long</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLighterSide('sell')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          lighterSide === 'sell'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                            : 'bg-card text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        <ArrowDownRight className="h-4 w-4" />
                        <span>Sell / Short</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Order Size & Amount */}
                {lighterOrderType !== 'cancel' && (
                  <div className="grid grid-cols-12 gap-2">
                    <div className={lighterOrderType === 'limit' ? 'col-span-6 space-y-1.5' : 'col-span-12 space-y-1.5'}>
                      <label className="text-xs font-medium text-foreground">
                        Order Amount / Size:
                      </label>
                      <input
                        type="text"
                        value={lighterAmount}
                        onChange={(e) => setLighterAmount(e.target.value)}
                        placeholder="0.5 ETH"
                        className="w-full h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>

                    {lighterOrderType === 'limit' && (
                      <div className="col-span-6 space-y-1.5">
                        <label className="text-xs font-medium text-foreground flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Limit Price:</span>
                        </label>
                        <input
                          type="text"
                          value={lighterPrice}
                          onChange={(e) => setLighterPrice(e.target.value)}
                          placeholder="2,650"
                          className="w-full h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Slippage Tolerance */}
                {lighterOrderType === 'market' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Max Slippage Tolerance</span>
                      </label>
                      <span className="text-[10px] text-muted-foreground">Protection</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={lighterSlippage}
                        onChange={(e) => setLighterSlippage(e.target.value)}
                        placeholder="0.5%"
                        className="w-24 h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                      />
                      <div className="flex items-center gap-1.5">
                        {['0.1%', '0.5%', '1.0%', '2.0%'].map((slip) => (
                          <button
                            key={slip}
                            type="button"
                            onClick={() => setLighterSlippage(slip)}
                            className={`text-[11px] px-2 py-1 rounded border transition-colors cursor-pointer ${
                              lighterSlippage === slip
                                ? 'bg-orange-500 text-white border-orange-600 font-medium'
                                : 'bg-background hover:bg-muted text-foreground border-border'
                            }`}
                          >
                            {slip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Summary / Preview */}
                <div className="rounded-lg bg-card/80 border border-border/80 p-2.5 text-xs text-muted-foreground">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground pb-0.5">
                    Action Execution Preview
                  </div>
                  <div className="text-foreground text-xs font-medium leading-relaxed">
                    Dispatch{' '}
                    <span className="text-orange-600 dark:text-orange-400 font-bold uppercase">
                      Lighter {lighterOrderType}
                    </span>{' '}
                    order on{' '}
                    <span className="font-mono font-bold text-foreground">
                      {lighterPair}
                    </span>
                    {lighterOrderType !== 'cancel' && (
                      <>
                        {' '}for{' '}
                        <span className="font-mono font-bold text-primary">
                          {lighterAmount}
                        </span>{' '}
                        ({lighterSide.toUpperCase()})
                        {lighterOrderType === 'limit' && (
                          <> at limit price <span className="font-mono font-bold">${lighterPrice}</span></>
                        )}
                        {lighterOrderType === 'market' && (
                          <> with max <span className="font-mono">{lighterSlippage}</span> slippage</>
                        )}
                      </>
                    )}
                    .
                  </div>
                </div>
              </div>
            )}

            {/* Custom Label Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Node Display Label:
              </label>
              <input
                type="text"
                value={customLabel || activeAction.defaultLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder={activeAction.defaultLabel}
                className="w-full h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-card/40 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-8 text-xs cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleConfirmAdd}
            className="h-8 text-xs gap-1.5 px-4 cursor-pointer bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Check className="h-3.5 w-3.5" />
            Add to Workflow Canvas
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
