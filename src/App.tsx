import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CreateWorkflow } from '@/components/createworkflow'
import { Moon, Sun, DollarSign } from 'lucide-react'

export function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    // Default to dark mode
    return true
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark((prev) => !prev)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Navigation Header with Light/Dark Mode Toggle */}
      <header className="w-full border-b border-border bg-card/60 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
            <DollarSign className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight leading-none text-foreground">
                ForexFlow Builder
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                FX Automated
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Currency Pairs, Economic Events &amp; MetaTrader/cTrader Execution
            </span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="gap-2 h-8 text-xs font-medium cursor-pointer"
        >
          {isDark ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-indigo-400" />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </Button>
      </header>

      {/* Main Workflow MVP Canvas */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-3 sm:p-5">
        <CreateWorkflow isDark={isDark} />
      </main>
    </div>
  )
}

export default App
