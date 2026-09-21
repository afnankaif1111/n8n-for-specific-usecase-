import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FlowDemo } from '@/components/FlowDemo'
import { 
  Sparkles, 
  CheckCircle2, 
  Code2, 
  Layers, 
  Palette, 
  Moon, 
  Sun,
  ExternalLink,
  Plus,
  Minus,
  Workflow
} from 'lucide-react'

function App() {
  const [count, setCount] = useState(0)
  const [isDark, setIsDark] = useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const features = [
    {
      title: "React 19 & TypeScript",
      desc: "Type-safe React development configured with modern Vite build system.",
      icon: Code2,
    },
    {
      title: "Tailwind CSS v4",
      desc: "Fast, modern utility-first CSS using CSS variables and theme configuration.",
      icon: Palette,
    },
    {
      title: "shadcn/ui Primitives",
      desc: "Accessible and customizable components with radix & lucide icons ready to use.",
      icon: Layers,
    },
    {
      title: "Path Aliases Configured",
      desc: "Clean imports with @/* pointing to ./src/* in both Vite and TypeScript.",
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 transition-colors duration-200">
      {/* Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 mb-8 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            ui
          </div>
          <span className="font-semibold text-lg tracking-tight">React + Vite + shadcn</span>
        </div>
        <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </Button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Setup Complete & Ready to Build</span>
        </div>

        <div className="space-y-3 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Build your next app with <span className="text-primary underline decoration-primary/40">shadcn/ui</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            A fully typed, high-performance starter equipped with Vite, TypeScript, Tailwind CSS v4, and shadcn/ui.
          </p>
        </div>

        {/* Counter Showcase Card */}
        <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Interactive shadcn Button Test
          </div>
          <div className="text-5xl font-mono font-bold tracking-tight text-foreground py-2">
            {count}
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={() => setCount((c) => Math.max(0, c - 1))}
              disabled={count === 0}
            >
              <Minus className="h-4 w-4" />
              Decrement
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={() => setCount((c) => c + 1)}
            >
              <Plus className="h-4 w-4" />
              Increment
            </Button>
          </div>
        </div>

        {/* Button Variants Demonstration */}
        <div className="w-full p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4 text-left">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Installed Component: Button</h3>
            <p className="text-sm text-muted-foreground">
              Verify variants and sizes supported out of the box.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link Variant</Button>
          </div>
        </div>

        {/* React Flow Interactive Canvas */}
        <div className="w-full p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">React Flow Canvas</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Interactive node-based workflow editor powered by <code>@xyflow/react</code>. Drag nodes, zoom, or pan.
              </p>
            </div>
            <a
              href="https://reactflow.dev"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                React Flow Docs
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
          <FlowDemo />
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="p-5 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors space-y-2"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-base">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Action Links */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://ui.shadcn.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex"
          >
            <Button variant="outline" className="gap-2">
              shadcn/ui Documentation
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
          <a
            href="https://vite.dev"
            target="_blank"
            rel="noreferrer"
            className="inline-flex"
          >
            <Button variant="ghost" className="gap-2">
              Vite Documentation
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl py-6 mt-12 border-t border-border text-center text-xs text-muted-foreground">
        Add more components anytime using: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">npx shadcn@latest add [component]</code>
      </footer>
    </div>
  )
}

export default App
