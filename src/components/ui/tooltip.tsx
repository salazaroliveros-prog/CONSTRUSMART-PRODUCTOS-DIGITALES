import * as React from "react"
import { cn } from "@/lib/utils"

// Simple CSS-only tooltip implementation (no Radix dependency)
const TooltipProvider: React.FC<{ children: React.ReactNode; delayDuration?: number }> = ({ children }) => <>{children}</>

const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>

const TooltipTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => <button ref={ref} className={cn(className)} {...props} />
)
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm", className)} {...props} />
  )
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }