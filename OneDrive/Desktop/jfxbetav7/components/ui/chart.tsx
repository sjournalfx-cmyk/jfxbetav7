"use client"

import * as React from "react"
import {
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { cn } from "../../lib/utils"

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
>

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactElement
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  ChartContainerProps
>(({ config, children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("flex justify-center", className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

export const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const styles = Object.entries(config)
    .map(([key, value]) => {
      if (value.color) {
        return `--color-${key}: ${value.color};`
      }
      return null
    })
    .join("\n")

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart="${id}"] { ${styles} }`,
      }}
    />
  )
}

export const ChartTooltip = Tooltip

export const ChartTooltipContent = ({
  active,
  payload,
  hideLabel,
}: any) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-xl border bg-white dark:bg-zinc-950 p-3 shadow-2xl text-xs dark:border-zinc-800 border-slate-200 min-w-[120px] animate-in fade-in zoom-in duration-200">
      {!hideLabel && (
        <div className="font-black uppercase tracking-widest opacity-40 mb-2 border-b dark:border-white/10 border-black/5 pb-2">
          {payload[0].name}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div 
            className="h-2 w-2 rounded-full" 
            style={{ backgroundColor: payload[0].payload.fill || payload[0].color }} 
          />
          <span className="font-bold dark:text-zinc-400 text-slate-500 uppercase tracking-tight">Value</span>
        </div>
        <span className="font-black dark:text-white text-slate-900">{payload[0].value.toLocaleString()}</span>
      </div>
    </div>
  )
}
