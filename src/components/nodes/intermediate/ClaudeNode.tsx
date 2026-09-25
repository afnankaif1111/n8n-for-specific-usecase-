import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Brain, Key, Check, ChevronDown, ChevronUp, Sliders } from 'lucide-react'

export interface ClaudeNodeData extends Record<string, unknown> {
  label: string
  intermediateKind?: 'claude'
  model?: 'claude-3-5-sonnet' | 'claude-3-5-haiku' | 'claude-3-opus' | string
  credentialTitle?: string
  credentialKey?: string
  promptTask?: string
  maxTokens?: number | string
  subtitle?: string
}

export function ClaudeNode(props: NodeProps) {
  const data = props.data as unknown as ClaudeNodeData

  const [model, setModel] = useState<string>(data.model || 'claude-3-5-sonnet')
  const [credentialKey, setCredentialKey] = useState<string>(data.credentialKey || 'sk-ant-api03-x88NmKwL20-demo')
  const [credentialTitle] = useState<string>(data.credentialTitle || 'Anthropic API Key')
  const [showConfig, setShowConfig] = useState(false)
  const [promptTask, setPromptTask] = useState<string>(
    data.promptTask || 'Assess multi-timeframe price action, support/resistance & execute risk filter'
  )

  const maskedKey =
    credentialKey.length > 8
      ? `${credentialKey.slice(0, 9)}••••••••${credentialKey.slice(-4)}`
      : '••••••••••••'

  return (
    <div className="min-w-[240px] max-w-[280px] rounded-xl border-2 border-amber-500/40 bg-card p-3 shadow-md hover:border-amber-500/80 transition-all text-left">
      {/* Target Handle strictly on the LEFT side */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!h-3 !w-3 !rounded-full !bg-amber-500 !border-2 !border-background hover:scale-125 transition-transform"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              Intermediate AI
            </div>
            <div className="text-xs font-bold leading-none text-foreground">
              Anthropic Claude
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          {model.replace('claude-', '')}
        </span>
      </div>

      {/* Node Content */}
      <div className="pt-2 space-y-2">
        <div className="text-xs font-semibold text-foreground line-clamp-1">
          {data.label || 'Claude: Risk & Trend Evaluator'}
        </div>

        {/* Credentials Box */}
        <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] font-medium text-foreground">
              <Key className="h-3 w-3 text-amber-500" />
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
              className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
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
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
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
                placeholder="sk-ant-..."
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                System Prompt / Instruction:
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
            <Sliders className="h-3 w-3 text-amber-500" />
            Tokens: {data.maxTokens ?? 2048}
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
        className="!h-3 !w-3 !rounded-full !bg-amber-500 !border-2 !border-background hover:scale-125 transition-transform"
      />
    </div>
  )
}
