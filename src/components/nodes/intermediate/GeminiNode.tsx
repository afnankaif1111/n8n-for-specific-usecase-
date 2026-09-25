import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Sparkles, Key, Check, ChevronDown, ChevronUp, Bot } from 'lucide-react'

export interface GeminiNodeData extends Record<string, unknown> {
  label: string
  intermediateKind?: 'gemini'
  model?: 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | string
  credentialTitle?: string
  credentialKey?: string
  promptTask?: string
  temperature?: number | string
  subtitle?: string
}

export function GeminiNode(props: NodeProps) {
  const data = props.data as unknown as GeminiNodeData

  const [model, setModel] = useState<string>(data.model || 'gemini-2.0-flash')
  const [credentialKey, setCredentialKey] = useState<string>(data.credentialKey || 'AIzaSyBv9xK72m8L10qPz-demo')
  const [credentialTitle] = useState<string>(data.credentialTitle || 'Google Gemini API Key')
  const [showConfig, setShowConfig] = useState(false)
  const [promptTask, setPromptTask] = useState<string>(
    data.promptTask || 'Analyze FX volatility, economic sentiment & validate trade setup'
  )

  const maskedKey =
    credentialKey.length > 8
      ? `${credentialKey.slice(0, 6)}••••••••${credentialKey.slice(-4)}`
      : '••••••••••••'

  return (
    <div className="min-w-[240px] max-w-[280px] rounded-xl border-2 border-indigo-500/40 bg-card p-3 shadow-md hover:border-indigo-500/80 transition-all text-left">
      {/* Target Handle strictly on the LEFT side */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!h-3 !w-3 !rounded-full !bg-indigo-500 !border-2 !border-background hover:scale-125 transition-transform"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-500/30 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 text-indigo-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
              Intermediate AI
            </div>
            <div className="text-xs font-bold leading-none text-foreground">
              Google Gemini
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          {model.replace('gemini-', '')}
        </span>
      </div>

      {/* Node Content */}
      <div className="pt-2 space-y-2">
        <div className="text-xs font-semibold text-foreground line-clamp-1">
          {data.label || 'Gemini: Market Sentiment Reasoner'}
        </div>

        {/* Credentials Box */}
        <div className="p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] font-medium text-foreground">
              <Key className="h-3 w-3 text-indigo-500" />
              <span>{credentialTitle}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active</span>
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground bg-card/60 px-1.5 py-0.5 rounded border border-border/50">
            <span>{maskedKey}</span>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              {showConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Inline Configuration Expander */}
        {showConfig ? (
          <div className="p-2 rounded-lg bg-muted/60 border border-border space-y-2 text-[11px] animate-in fade-in-50 duration-150">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                Model:
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-xs rounded border border-border bg-background px-1.5 py-1 text-foreground"
              >
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                API Key:
              </label>
              <input
                type="password"
                value={credentialKey}
                onChange={(e) => setCredentialKey(e.target.value)}
                className="w-full text-xs rounded border border-border bg-background px-1.5 py-1 font-mono text-foreground"
                placeholder="AIzaSy..."
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                Reasoning Prompt:
              </label>
              <textarea
                value={promptTask}
                onChange={(e) => setPromptTask(e.target.value)}
                rows={2}
                className="w-full text-xs rounded border border-border bg-background p-1 text-foreground resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground line-clamp-2 italic bg-muted/30 p-1.5 rounded border border-border/40">
            "{promptTask}"
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
          <span className="flex items-center gap-1">
            <Bot className="h-3 w-3 text-indigo-500" />
            Temp: {data.temperature ?? 0.2}
          </span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" />
            Input: Left ➔ Output: Right
          </span>
        </div>
      </div>

      {/* Source Handle strictly on the RIGHT side */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!h-3 !w-3 !rounded-full !bg-indigo-500 !border-2 !border-background hover:scale-125 transition-transform"
      />
    </div>
  )
}
