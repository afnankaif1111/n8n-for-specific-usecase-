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
    title: 'MetaTrader 5 Trade Action',
    subtitle: 'MT4 / MT5 Terminal Order',
    description: 'Dispatches market execution, limit, or stop orders directly to MetaTrader terminals.',
    icon: Flame,
    defaultLabel: 'MT5: Market Buy 1.00 Lot EUR/USD',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    presets: ['Market Buy 1.00 Lot EUR/USD', 'Limit Bid 0.50 Lot GBP/USD', 'Close All Open FX Orders', 'Set SL to Break-Even'],
  },
  {
    kind: 'hyperliquid',
    title: 'cTrader / FIX API Action',
    subtitle: 'Institutional ECN Execution',
    description: 'Executes ultra-low latency orders via cTrader Open API or institutional FIX 4.4 protocol.',
    icon: Zap,
    defaultLabel: 'cTrader: ECN Market Fill GBP/USD',
    color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    presets: ['ECN Market Fill', 'Dynamic Trailing Stop (15 pips)', 'Scale Out 50% Position', 'FIX 4.4 IOC Order'],
  },
  {
    kind: 'backpack',
    title: 'Forex Broker Order Router',
    subtitle: 'Multi-Broker Best Execution',
    description: 'Routes spot forex trades to the broker offering the lowest spread (OANDA, Pepperstone, IC Markets).',
    icon: Briefcase,
    defaultLabel: 'Broker Router: Best Spread Fill',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    presets: ['OANDA Spot Order', 'IC Markets ECN Routing', 'Pepperstone Razor Execution', 'Swap-Free Rollover Routing'],
  },
  {
    kind: 'trade',
    title: 'FX Risk & Position Manager',
    subtitle: 'Automated Equity Protection',
    description: 'Manages account risk: trail stop losses, hedge currency exposure, or emergency liquidate before news.',
    icon: Play,
    defaultLabel: 'Move SL to Break-Even (+10 Pips)',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    presets: ['Move SL to Break-Even', 'Hedge EUR/USD Exposure', 'Emergency Close All Trades', 'Lock-in 50% Profits'],
  },
  {
    kind: 'notification',
    title: 'Forex Signal / Alert',
    subtitle: 'Telegram, Discord & SMS Alerts',
    description: 'Broadcasts live forex signals, order execution receipts, and margin warnings to external channels.',
    icon: Bell,
    defaultLabel: 'Send Telegram FX Signal',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    presets: ['Telegram FX VIP Signal', 'Discord Trading Webhook', 'SMS Pip Alert', 'Email Daily PnL Summary'],
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
  const [selectedPreset, setSelectedPreset] = useState<string>('Market Buy 1.00 Lot EUR/USD')

  // Lighter/MT5 Action specific parameter states
  const [lighterOrderType, setLighterOrderType] = useState<'market' | 'limit' | 'stop' | 'cancel' | 'liquidity'>('market')
  const [lighterPair, setLighterPair] = useState('EUR/USD')
  const [lighterSide, setLighterSide] = useState<'buy' | 'sell'>('buy')
  const [lighterAmount, setLighterAmount] = useState('1.00 Lot')
  const [lighterPrice, setLighterPrice] = useState('1.09200')
  const [lighterSlippage, setLighterSlippage] = useState('0.5 pips')

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
        setLighterAmount('1.00 Lot')
        setLighterPair('EUR/USD')
        setCustomLabel('MT5: Market Buy 1.00 Lot EUR/USD')
      } else if (preset.includes('Limit Bid')) {
        setLighterOrderType('limit')
        setLighterSide('buy')
        setLighterAmount('0.50 Lot')
        setLighterPrice('1.28500')
        setLighterPair('GBP/USD')
        setCustomLabel('MT5: Limit Bid 0.50 Lot GBP/USD')
      } else if (preset.includes('Close All')) {
        setLighterOrderType('cancel')
        setCustomLabel('MT5: Close All Open FX Orders')
      } else if (preset.includes('Break-Even')) {
        setLighterOrderType('limit')
        setCustomLabel('MT5: Set SL to Break-Even')
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
        ? `MT5: Close ${lighterPair} Orders`
        : `MT5: ${lighterOrderType.toUpperCase()} ${sideText} ${lighterPair}`

      const finalLabel = customLabel.trim() || generatedLabel
      const subtitle = lighterOrderType === 'limit'
        ? `Order: ${lighterSide.toUpperCase()} ${lighterAmount} @ ${lighterPrice}`
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
      onAddAction(action.kind, 'MT5: Market Buy 1.00 Lot EUR/USD', 'Order: BUY 1.00 Lot • Slippage 0.5 pips', {
        actionType: 'market',
        pair: 'EUR/USD',
        side: 'buy',
        amount: '1.00 Lot',
        slippage: '0.5 pips',
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

            {/* MetaTrader 5 Action Specific Parameter Form */}
            {selectedKind === 'lighter' && (
              <div className="space-y-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 mt-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Zap className="h-4 w-4" />
                    <span>MetaTrader 5 Order Parameters</span>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Terminal Config
                  </span>
                </div>

                {/* 1. Order Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Action Type:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['market', 'limit', 'stop', 'close'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setLighterOrderType(type === 'close' ? 'cancel' : type)}
                        className={`text-[11px] py-1 rounded-md border font-medium capitalize transition-all cursor-pointer ${
                          (lighterOrderType === type || (type === 'close' && lighterOrderType === 'cancel'))
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
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
                      <span>Currency Pair / Symbol</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">Forex Symbol</span>
                  </div>
                  <input
                    type="text"
                    value={lighterPair}
                    onChange={(e) => setLighterPair(e.target.value)}
                    placeholder="EUR/USD"
                    className="w-full h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {/* Quick Pair Selector */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-muted-foreground mr-0.5">Quick:</span>
                    {['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'XAU/USD'].map((pair) => (
                      <button
                        key={pair}
                        type="button"
                        onClick={() => setLighterPair(pair)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          lighterPair === pair
                            ? 'bg-emerald-600 text-white border-emerald-700 font-medium'
                            : 'bg-background hover:bg-muted text-foreground border-border'
                        }`}
                      >
                        {pair}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Order Side (Buy / Sell) */}
                {lighterOrderType !== 'cancel' && (
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

                {/* 4. Order Size & Lot Amount */}
                {lighterOrderType !== 'cancel' && (
                  <div className="grid grid-cols-12 gap-2">
                    <div className={lighterOrderType === 'limit' ? 'col-span-6 space-y-1.5' : 'col-span-12 space-y-1.5'}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground">
                          Lot Size:
                        </label>
                        <div className="flex gap-1">
                          {['0.01 Lot', '0.10 Lot', '1.00 Lot'].map((lot) => (
                            <button
                              key={lot}
                              type="button"
                              onClick={() => setLighterAmount(lot)}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                            >
                              {lot.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={lighterAmount}
                        onChange={(e) => setLighterAmount(e.target.value)}
                        placeholder="1.00 Lot"
                        className="w-full h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {lighterOrderType === 'limit' && (
                      <div className="col-span-6 space-y-1.5">
                        <label className="text-xs font-medium text-foreground flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Limit Rate:</span>
                        </label>
                        <input
                          type="text"
                          value={lighterPrice}
                          onChange={(e) => setLighterPrice(e.target.value)}
                          placeholder="1.09200"
                          className="w-full h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
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
                        <span>Max Slippage (Pips)</span>
                      </label>
                      <span className="text-[10px] text-muted-foreground">Execution Guard</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={lighterSlippage}
                        onChange={(e) => setLighterSlippage(e.target.value)}
                        placeholder="0.5 pips"
                        className="w-24 h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <div className="flex items-center gap-1.5">
                        {['0.2 pips', '0.5 pips', '1.0 pip', '2.0 pips'].map((slip) => (
                          <button
                            key={slip}
                            type="button"
                            onClick={() => setLighterSlippage(slip)}
                            className={`text-[11px] px-2 py-1 rounded border transition-colors cursor-pointer ${
                              lighterSlippage === slip
                                ? 'bg-emerald-600 text-white border-emerald-700 font-medium'
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
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                      MT5 {lighterOrderType}
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
                          <> at limit price <span className="font-mono font-bold">{lighterPrice}</span></>
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
