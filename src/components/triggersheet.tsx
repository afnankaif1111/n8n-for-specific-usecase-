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
  TrendingUp,
  Clock,
  Zap,
  Briefcase,
  Flame,
  Plus,
  Check,
  SlidersHorizontal,
  Sparkles,
  DollarSign,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import type { TriggerKind } from '@/components/createworkflow'

export interface TriggerConfig {
  asset?: string
  price?: string
  condition?: 'above' | 'below'
  timer?: string
  [key: string]: unknown
}

export interface TriggerDefinition {
  kind: TriggerKind
  title: string
  subtitle: string
  description: string
  icon: typeof Zap
  defaultLabel: string
  color: string
  badgeColor: string
  presets: string[]
}

export const TRIGGER_OPTIONS: TriggerDefinition[] = [
  {
    kind: 'price',
    title: 'Forex Rate Trigger',
    subtitle: 'Market & Spot Rates',
    description: 'Fires when currency pair exchange rate crosses above or below target threshold.',
    icon: TrendingUp,
    defaultLabel: 'EUR/USD Rate > 1.0920',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    presets: ['EUR/USD > 1.0920', 'GBP/USD < 1.2850', 'USD/JPY Breakout > 155.50', 'XAU/USD (Gold) > 2,650'],
  },
  {
    kind: 'timer',
    title: 'FX Session & Timer',
    subtitle: 'Trading Sessions & Schedule',
    description: 'Triggers on Forex market session opens (London, New York, Tokyo) or recurring intervals.',
    icon: Clock,
    defaultLabel: 'London / NY Overlap Session',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    presets: ['London Open (08:00 GMT)', 'London / NY Overlap (13:00 GMT)', 'Tokyo Asian Open (00:00 GMT)', 'Daily 4H Candle Close'],
  },
  {
    kind: 'hyperliquid',
    title: 'MetaTrader 5 Trigger',
    subtitle: 'MT4 / MT5 Terminal Events',
    description: 'Monitors MetaTrader terminal equity, margin call health, pending order fills, and trailing stops.',
    icon: Zap,
    defaultLabel: 'MT5 Margin Level < 120% Alert',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    presets: ['Margin Level < 120%', 'Pending Order Filled', 'Trailing Stop Triggered', 'Daily Drawdown > 3%'],
  },
  {
    kind: 'backpack',
    title: 'Economic Calendar Trigger',
    subtitle: 'Macro News & Central Banks',
    description: 'Fires ahead of or upon high-impact macroeconomic events like US NFP, FOMC, CPI, and ECB rate decisions.',
    icon: Briefcase,
    defaultLabel: 'US Non-Farm Payrolls (NFP) Release',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    presets: ['US NFP Payrolls (High Impact)', 'FOMC Interest Rate Decision', 'US CPI Inflation Release', 'ECB Rate Statement'],
  },
  {
    kind: 'lighter',
    title: 'Broker Spread & Liquidity',
    subtitle: 'ECN Spread & Rollover Monitor',
    description: 'Watches ECN broker bid/ask spread spikes, rollover swap times, and market depth variations.',
    icon: Flame,
    defaultLabel: 'Spread Widening Alert (> 1.8 Pips)',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    presets: ['Spread Spike > 1.8 Pips', 'Rollover Liquidity Filter', 'Tick Volume Surge (15m)', 'Weekend Gap Warning'],
  },
]

export interface TriggerSheetProps {
  onAddTrigger: (
    kind: TriggerKind,
    label: string,
    subtitle?: string,
    config?: TriggerConfig
  ) => void
  triggerElement?: React.ReactNode
}

export function TriggerSheet({ onAddTrigger, triggerElement }: TriggerSheetProps) {
  const [open, setOpen] = useState(false)
  const [selectedKind, setSelectedKind] = useState<TriggerKind>('price')
  const [customLabel, setCustomLabel] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('EUR/USD > 1.0920')

  // Price Trigger specific input parameters
  const [priceAsset, setPriceAsset] = useState('EUR/USD')
  const [priceTarget, setPriceTarget] = useState('1.09200')
  const [priceCondition, setPriceCondition] = useState<'above' | 'below'>('above')
  const [priceTimer, setPriceTimer] = useState('15s')

  const activeTrigger = TRIGGER_OPTIONS.find((t) => t.kind === selectedKind) ?? TRIGGER_OPTIONS[0]

  const handleSelectKind = (kind: TriggerKind) => {
    setSelectedKind(kind)
    const trigger = TRIGGER_OPTIONS.find((t) => t.kind === kind)
    if (trigger) {
      setCustomLabel(trigger.defaultLabel)
      setSelectedPreset(trigger.presets[0] ?? '')
    }
  }

  const handleApplyPreset = (preset: string) => {
    setSelectedPreset(preset)
    if (selectedKind === 'price') {
      if (preset.includes('EUR')) {
        setPriceAsset('EUR/USD')
        setPriceCondition('above')
        setPriceTarget('1.09200')
        setPriceTimer('15s')
        setCustomLabel('EUR/USD Rate > 1.0920')
      } else if (preset.includes('GBP')) {
        setPriceAsset('GBP/USD')
        setPriceCondition('below')
        setPriceTarget('1.28500')
        setPriceTimer('30s')
        setCustomLabel('GBP/USD Rate < 1.2850')
      } else if (preset.includes('JPY')) {
        setPriceAsset('USD/JPY')
        setPriceCondition('above')
        setPriceTarget('155.500')
        setPriceTimer('10s')
        setCustomLabel('USD/JPY Breakout > 155.50')
      } else if (preset.includes('XAU')) {
        setPriceAsset('XAU/USD')
        setPriceCondition('above')
        setPriceTarget('2,650.00')
        setPriceTimer('15s')
        setCustomLabel('XAU/USD Gold Breakout > 2,650')
      } else {
        setCustomLabel(`${activeTrigger.title}: ${preset}`)
      }
    } else {
      setCustomLabel(`${activeTrigger.title}: ${preset}`)
    }
  }

  const handleConfirmAdd = () => {
    if (selectedKind === 'price') {
      const conditionSymbol = priceCondition === 'above' ? '>' : '<'
      const generatedLabel = `${priceAsset || 'EUR/USD'} ${conditionSymbol} ${priceTarget || '1.09200'}`
      const finalLabel = customLabel.trim() || generatedLabel
      const formattedTimer = priceTimer ? `Every ${priceTimer.replace(/^Every\s+/i, '')}` : 'Every 15s'
      const subtitle = `Polls ${priceTimer || '15s'} • Condition: ${priceCondition}`

      onAddTrigger(selectedKind, finalLabel, subtitle, {
        asset: priceAsset || 'EUR/USD',
        price: priceTarget || '1.09200',
        condition: priceCondition,
        timer: formattedTimer,
      })
    } else {
      const finalLabel = customLabel.trim() || activeTrigger.defaultLabel
      onAddTrigger(selectedKind, finalLabel, activeTrigger.description)
    }
    setOpen(false)
  }

  const handleQuickAdd = (trigger: TriggerDefinition) => {
    if (trigger.kind === 'price') {
      onAddTrigger(trigger.kind, 'EUR/USD Rate > 1.0920', 'Polls 15s • Condition: above', {
        asset: 'EUR/USD',
        price: '1.09200',
        condition: 'above',
        timer: 'Every 15s',
      })
    } else {
      onAddTrigger(trigger.kind, trigger.defaultLabel, trigger.description)
    }
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {triggerElement || (
          <Button size="sm" className="gap-2 h-8 text-xs font-semibold cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Trigger</span>
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
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-foreground">
                Trigger Node Catalog
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Select a trigger kind and add it to your active workflow.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left">
          {/* List of 5 Trigger Kinds */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              1. Choose Trigger Kind (5 Available)
            </div>

            <div className="space-y-2">
              {TRIGGER_OPTIONS.map((trigger) => {
                const Icon = trigger.icon
                const isSelected = trigger.kind === selectedKind

                return (
                  <div
                    key={trigger.kind}
                    onClick={() => handleSelectKind(trigger.kind)}
                    className={`relative p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border bg-card hover:bg-muted/50 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${trigger.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {trigger.title}
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${trigger.badgeColor}`}>
                              {trigger.kind}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            {trigger.description}
                          </p>
                        </div>
                      </div>

                      {/* Quick Add Button */}
                      <Button
                        size="xs"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickAdd(trigger)
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

          {/* Configuration & Presets for Selected Trigger */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>2. Customize {activeTrigger.title}</span>
              </div>
            </div>

            {/* Presets Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {activeTrigger.presets.map((preset) => {
                  const isPresetActive = selectedPreset === preset
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                        isPresetActive
                          ? 'bg-primary text-primary-foreground border-primary font-medium'
                          : 'bg-muted/60 text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      {preset}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price Trigger Specific Parameter Form */}
            {selectedKind === 'price' && (
              <div className="space-y-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 mt-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>Price Trigger Parameters</span>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Active Config
                  </span>
                </div>

                {/* 1. Asset Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Currency Pair / Asset</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">e.g. EUR/USD, GBP/USD</span>
                  </div>
                  <input
                    type="text"
                    value={priceAsset}
                    onChange={(e) => setPriceAsset(e.target.value)}
                    placeholder="EUR/USD"
                    className="w-full h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  {/* Quick Asset Selector */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-muted-foreground mr-0.5">Quick:</span>
                    {['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'XAU/USD'].map((pair) => (
                      <button
                        key={pair}
                        type="button"
                        onClick={() => setPriceAsset(pair)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          priceAsset === pair
                            ? 'bg-amber-500 text-white border-amber-600 font-medium'
                            : 'bg-background hover:bg-muted text-foreground border-border'
                        }`}
                      >
                        {pair}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Price Target & Condition */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Target Rate & Condition</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">Exchange Rate</span>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    {/* Condition Toggle: Above / Below */}
                    <div className="col-span-5 flex rounded-lg border border-border bg-card p-0.5">
                      <button
                        type="button"
                        onClick={() => setPriceCondition('above')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                          priceCondition === 'above'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span>&gt; Above</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceCondition('below')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                          priceCondition === 'below'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <ArrowDownRight className="h-3.5 w-3.5" />
                        <span>&lt; Below</span>
                      </button>
                    </div>

                    {/* Price Input */}
                    <div className="col-span-7 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground font-mono">
                        FX
                      </span>
                      <input
                        type="text"
                        value={priceTarget}
                        onChange={(e) => setPriceTarget(e.target.value)}
                        placeholder="1.09200"
                        className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Evaluation Timer / Polling Frequency */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Evaluation Frequency (Timer)</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">Poll interval</span>
                  </div>

                  <input
                    type="text"
                    value={priceTimer}
                    onChange={(e) => setPriceTimer(e.target.value)}
                    placeholder="e.g. 15s or 1m"
                    className="w-full h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
                  />

                  {/* Quick Frequency Options */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-muted-foreground mr-0.5">Intervals:</span>
                    {['5s', '15s', '30s', '1m', '5m'].map((interval) => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setPriceTimer(interval)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          priceTimer === interval || priceTimer === `Every ${interval}`
                            ? 'bg-amber-500 text-white border-amber-600 font-medium'
                            : 'bg-background hover:bg-muted text-foreground border-border'
                        }`}
                      >
                        {interval}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary / Preview Badge */}
                <div className="rounded-lg bg-card/80 border border-border/80 p-2.5 text-xs text-muted-foreground">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground pb-0.5">
                    Trigger Preview
                  </div>
                  <div className="text-foreground text-xs font-medium leading-relaxed">
                    Fires when{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                      {priceAsset || 'EUR/USD'}
                    </span>{' '}
                    is {priceCondition === 'above' ? 'greater than' : 'less than'}{' '}
                    <span className="font-mono font-bold text-foreground">
                      {priceTarget || '1.09200'}
                    </span>
                    , evaluated{' '}
                    <span className="font-mono font-bold text-primary">
                      {priceTimer.startsWith('Every ') ? priceTimer : `Every ${priceTimer}`}
                    </span>
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
                value={customLabel || activeTrigger.defaultLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder={activeTrigger.defaultLabel}
                className="w-full h-8 px-3 rounded-lg border border-border bg-card text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
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
            className="h-8 text-xs gap-1.5 px-4 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            Add to Workflow Canvas
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
