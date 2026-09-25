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
  Sparkles,
  Bot,
  Brain,
  GitBranch,
  Key,
  Plus,
  Check,
  Cpu,
  Layers,
  Flame,
} from 'lucide-react'
import type { IntermediateKind } from '@/components/nodes/intermediate'

export interface IntermediateConfig {
  model?: string
  credentialTitle?: string
  credentialKey?: string
  promptTask?: string
  temperature?: number | string
  maxTokens?: number | string
  conditionRule?: string
  subtitle?: string
  [key: string]: unknown
}

export interface IntermediateDefinition {
  kind: IntermediateKind
  title: string
  subtitle: string
  description: string
  icon: typeof Sparkles
  defaultLabel: string
  color: string
  badgeColor: string
  defaultModel: string
  availableModels: string[]
  credentialName: string
  defaultKey: string
  presets: { label: string; prompt: string }[]
}

export const INTERMEDIATE_OPTIONS: IntermediateDefinition[] = [
  {
    kind: 'smart-ict',
    title: 'Smart ICT Engine',
    subtitle: 'Institutional FVG & OB Studio',
    description: 'Sub-canvas studio for FVG, Order Blocks, Liquidity Sweeps, MSS & OTE linked to a compiled C++20 confluence engine.',
    icon: Flame,
    defaultLabel: 'Smart ICT Confluence Engine',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    defaultModel: 'C++20 Confluence SIMD',
    availableModels: ['C++20 FastMath Engine', 'C++20 SIMD AVX-512', 'C++20 HFT Microsecond'],
    credentialName: 'Compiler Engine (C++ Linker)',
    defaultKey: 'libict_confluence.so',
    presets: [
      {
        label: 'Institutional Liquidity & FVG Confluence',
        prompt: 'Prioritize unmitigated Order Blocks, Fair Value Gaps >= 2.5 pips, and liquidity sweep confirmation.',
      },
      {
        label: 'Silver Bullet 15m Scalping Setup',
        prompt: 'Strict London & NY Killzone alignment with Market Structure Shift (MSS) displacement and FVG retest.',
      },
      {
        label: 'Optimal Trade Entry (OTE 0.705) Matrix',
        prompt: 'Demand deep discount retracement into 0.62-0.79 Fib zone before authorizing MT5 market order.',
      },
    ],
  },
  {
    kind: 'gemini',
    title: 'Google Gemini AI',
    subtitle: 'DeepMind Multimodal Intelligence',
    description: 'High-speed reasoning on market sentiment, economic events, and currency pair trends.',
    icon: Sparkles,
    defaultLabel: 'Gemini: Market Sentiment Reasoner',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    defaultModel: 'gemini-2.0-flash',
    availableModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    credentialName: 'Google Gemini API Key',
    defaultKey: 'AIzaSyBv9xK72m8L10qPz-demo',
    presets: [
      {
        label: 'Forex Macro News Sentiment Scanner',
        prompt: 'Analyze current central bank speeches and high-impact economic news releases to determine EUR/USD sentiment.',
      },
      {
        label: 'Economic Data Surprise Reasoner',
        prompt: 'Evaluate US Non-Farm Payrolls and CPI deviations from consensus and assess market volatility impact.',
      },
      {
        label: 'Volatility & Liquidity Guard',
        prompt: 'Examine current spread vs average daily range to guard against false breakouts before market entry.',
      },
      {
        label: 'Multi-Currency Correlation Analysis',
        prompt: 'Analyze USD index (DXY) momentum against EUR, GBP, and JPY to avoid correlated risk exposure.',
      },
    ],
  },
  {
    kind: 'chatgpt',
    title: 'OpenAI ChatGPT',
    subtitle: 'GPT-4o Reasoning Engine',
    description: 'Validates trade setup, calculates position sizing, and checks order parameter hygiene.',
    icon: Bot,
    defaultLabel: 'ChatGPT: Trade Signal Validator',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    defaultModel: 'gpt-4o',
    availableModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
    credentialName: 'OpenAI API Key',
    defaultKey: 'sk-proj-a9Xk27LmPo81WqBv44demo',
    presets: [
      {
        label: 'Cross-Check MT5 Order vs Support/Resistance',
        prompt: 'Compare incoming trigger price action against major daily pivot levels and flag risky counter-trend orders.',
      },
      {
        label: 'Slippage & Spread Risk Calculator',
        prompt: 'Compute dynamic maximum slippage and ensure risk-to-reward ratio is at least 1:2.0 before order dispatch.',
      },
      {
        label: 'Trading Session Momentum Filter',
        prompt: 'Evaluate whether London or New York session volume supports continuation for this currency pair.',
      },
      {
        label: 'Position Sizing & Kelly Criterion Evaluator',
        prompt: 'Calculate exact lot size based on account balance and 1.5% maximum allowable risk per trade.',
      },
    ],
  },
  {
    kind: 'claude',
    title: 'Anthropic Claude',
    subtitle: 'Claude 3.5 Sonnet Deep Analysis',
    description: 'Examines multi-timeframe price structures, trend exhaustion, and institutional liquidity pools.',
    icon: Brain,
    defaultLabel: 'Claude: Risk & Trend Evaluator',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    defaultModel: 'claude-3-5-sonnet',
    availableModels: ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus'],
    credentialName: 'Anthropic API Key',
    defaultKey: 'sk-ant-api03-x88NmKwL20-demo',
    presets: [
      {
        label: 'Multi-Timeframe Trend Confirmation',
        prompt: 'Confirm 4H market structure alignment with 15m entry signals before authorizing MetaTrader 5 execution.',
      },
      {
        label: 'Institutional Order Flow Cross-Check',
        prompt: 'Verify Fair Value Gaps (FVG) and premium/discount market pricing for EUR/USD and GBP/USD setups.',
      },
      {
        label: 'False Breakout Trap Filter',
        prompt: 'Detect Asian session range sweeps and reject market orders that exhibit characteristics of liquidity traps.',
      },
      {
        label: 'Macro Central Bank Policy Analyzer',
        prompt: 'Evaluate interest rate differentials between Federal Reserve and ECB/BoE to confirm long-term carry bias.',
      },
    ],
  },
  {
    kind: 'condition',
    title: 'Risk & Margin Check',
    subtitle: 'Deterministic Logic Filter',
    description: 'Rule-based conditional check evaluating free margin, spread thresholds, and equity drawdown.',
    icon: GitBranch,
    defaultLabel: 'Risk Check (Spread < 1.2 Pips)',
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    defaultModel: 'Rule Engine',
    availableModels: ['Spread & Margin Rule', 'Drawdown Cap Rule', 'Session Filter Rule'],
    credentialName: 'Not Required (Internal Rule)',
    defaultKey: '',
    presets: [
      {
        label: 'Spread < 1.2 Pips & Free Margin Check',
        prompt: 'Ensure Account Free Margin > $2,000 and current broker spread <= 1.2 pips before forwarding to order.',
      },
      {
        label: 'Daily Drawdown < 3% Rule',
        prompt: 'Halt execution if day equity loss exceeds 3% of starting daily balance.',
      },
      {
        label: 'ECN Broker Slippage Cap',
        prompt: 'Allow trade execution only when broker liquidity depth supports zero requotes.',
      },
    ],
  },
]

export interface IntermediateSheetProps {
  onAddIntermediate: (
    kind: IntermediateKind,
    label: string,
    subtitle?: string,
    config?: IntermediateConfig
  ) => void
  triggerElement?: React.ReactNode
}

export function IntermediateSheet({ onAddIntermediate, triggerElement }: IntermediateSheetProps) {
  const [open, setOpen] = useState(false)
  const [selectedKind, setSelectedKind] = useState<IntermediateKind>('gemini')
  const [customLabel, setCustomLabel] = useState('')
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0)

  // Config parameters
  const [model, setModel] = useState('gemini-2.0-flash')
  const [apiKey, setApiKey] = useState('AIzaSyBv9xK72m8L10qPz-demo')
  const [promptTask, setPromptTask] = useState(
    'Analyze current central bank speeches and high-impact economic news releases to determine EUR/USD sentiment.'
  )
  const [temperature, setTemperature] = useState('0.2')

  const activeOption = INTERMEDIATE_OPTIONS.find((o) => o.kind === selectedKind) ?? INTERMEDIATE_OPTIONS[0]

  const handleSelectKind = (kind: IntermediateKind) => {
    setSelectedKind(kind)
    const opt = INTERMEDIATE_OPTIONS.find((o) => o.kind === kind)
    if (opt) {
      setCustomLabel(opt.defaultLabel)
      setModel(opt.defaultModel)
      setApiKey(opt.defaultKey)
      setSelectedPresetIdx(0)
      setPromptTask(opt.presets[0]?.prompt || '')
      if (kind === 'chatgpt') setTemperature('0.3')
      else if (kind === 'claude') setTemperature('0.2')
      else if (kind === 'gemini') setTemperature('0.2')
    }
  }

  const handleApplyPreset = (idx: number) => {
    setSelectedPresetIdx(idx)
    const preset = activeOption.presets[idx]
    if (preset) {
      setCustomLabel(preset.label)
      setPromptTask(preset.prompt)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const label = customLabel.trim() || activeOption.defaultLabel
    const subtitle = activeOption.kind === 'condition' ? 'Rule logic pass check' : `${model} • Side Handles`

    const config: IntermediateConfig = {
      model,
      credentialTitle: activeOption.credentialName,
      credentialKey: apiKey,
      promptTask,
      temperature: Number.parseFloat(temperature) || 0.2,
      subtitle,
    }

    onAddIntermediate(selectedKind, label, subtitle, config)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {triggerElement || (
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-sm font-medium h-8 text-xs cursor-pointer border-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>+ Add AI / Intermediate</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6 space-y-6 text-left">
        <SheetHeader className="text-left space-y-1 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-foreground">
                Add Intermediate AI / Logic Node
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Intermediate nodes process incoming trigger data with AI reasoning (Gemini, ChatGPT, Claude) or logic rules before executing actions. Connection points are on the <strong>Left (input)</strong> and <strong>Right (output)</strong> sides.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Node Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Select Intermediate Node Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {INTERMEDIATE_OPTIONS.map((opt) => {
                const IconComponent = opt.icon
                const isSelected = selectedKind === opt.kind

                return (
                  <button
                    key={opt.kind}
                    type="button"
                    onClick={() => handleSelectKind(opt.kind)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500 shadow-sm'
                        : 'border-border bg-card/50 hover:bg-muted/50 hover:border-border/80'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}

                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${opt.color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-foreground">{opt.title}</span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {opt.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Model and Credentials Setup */}
          <div className="p-3.5 rounded-xl border border-border bg-card/80 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-semibold text-foreground">
                  Credentials &amp; Model Configuration
                </span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${activeOption.badgeColor}`}>
                Side Connection Points
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Selected Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-indigo-500"
                >
                  {activeOption.availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Temperature
                </label>
                <input
                  type="text"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground font-mono focus:ring-1 focus:ring-indigo-500"
                  placeholder="0.2"
                />
              </div>
            </div>

            {activeOption.kind !== 'condition' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>{activeOption.credentialName}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified &amp; Saved
                  </span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-foreground focus:ring-1 focus:ring-indigo-500"
                  placeholder={`Enter ${activeOption.credentialName}...`}
                />
              </div>
            )}
          </div>

          {/* Preset Prompts Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>Task &amp; Prompt Presets</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                (Click to auto-fill)
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeOption.presets.map((preset, idx) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(idx)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    selectedPresetIdx === idx
                      ? 'border-indigo-500 bg-indigo-500/10 text-foreground font-medium'
                      : 'border-border bg-card hover:bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <div className="font-semibold text-foreground text-[11px] mb-0.5">
                    {preset.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">
                    {preset.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Node Display Label */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground block">
              Node Display Name
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder={activeOption.defaultLabel}
              className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Prompt / Instruction textarea */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground block">
              Reasoning Prompt / Evaluation Rule
            </label>
            <textarea
              rows={3}
              value={promptTask}
              onChange={(e) => setPromptTask(e.target.value)}
              className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground resize-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Describe the reasoning instruction for this node..."
            />
          </div>

          {/* Connection Handles Indicator Notice */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              <span>
                Connection Handles: <strong>Left (Input)</strong> ➔ <strong>Right (Output)</strong>
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Side Alignment Ready
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Node to Canvas
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
