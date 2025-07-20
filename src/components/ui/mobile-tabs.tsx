
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const MobileTabs = TabsPrimitive.Root

const MobileTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl p-1 text-muted-foreground",
        isMobile 
          ? "h-11 bg-muted/50 backdrop-blur-sm border border-border/20" 
          : "h-16 bg-muted/30 backdrop-blur-sm border border-border/30",
        "w-full grid grid-cols-3 mb-6",
        className
      )}
      {...props}
    />
  )
})
MobileTabsList.displayName = TabsPrimitive.List.displayName

const MobileTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    icon: React.ReactNode
    count?: number
    label: string
    activeColor: string
  }
>(({ className, icon, count, label, activeColor, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isMobile 
          ? "h-9 px-2 text-xs gap-1 data-[state=active]:shadow-sm" 
          : "h-12 px-3 py-1.5 text-sm gap-3 data-[state=active]:shadow-lg hover:scale-105",
        `data-[state=active]:${activeColor} data-[state=active]:text-white`,
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      <div className={cn(
        "flex items-center gap-1",
        isMobile ? "flex-col" : "flex-row gap-3"
      )}>
        <div className={cn(
          "p-1 rounded-md",
          isMobile ? "p-0.5" : "p-1.5",
          activeColor.includes('blue') ? "bg-blue-100 dark:bg-blue-900/30" :
          activeColor.includes('amber') ? "bg-amber-100 dark:bg-amber-900/30" :
          "bg-green-100 dark:bg-green-900/30"
        )}>
          <div className={cn(
            isMobile ? "h-3 w-3" : "h-4 w-4",
            activeColor.includes('blue') ? "text-blue-600 dark:text-blue-400" :
            activeColor.includes('amber') ? "text-amber-600 dark:text-amber-400" :
            "text-green-600 dark:text-green-400"
          )}>
            {icon}
          </div>
        </div>
        
        {!isMobile && (
          <span className="font-semibold">{label}</span>
        )}
        
        {count !== undefined && count > 0 && (
          <div className={cn(
            "text-sm font-bold min-w-[20px] text-center rounded-full",
            isMobile 
              ? "bg-muted text-muted-foreground px-1 py-0 text-[10px]" 
              : "px-3 py-1 shadow-sm",
            !isMobile && activeColor.includes('blue') ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-200" :
            !isMobile && activeColor.includes('amber') ? "bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-800 dark:text-amber-200" :
            !isMobile ? "bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-800 dark:text-green-200" : ""
          )}>
            {count}
          </div>
        )}
      </div>
    </TabsPrimitive.Trigger>
  )
})
MobileTabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const MobileTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-fade-in",
      className
    )}
    {...props}
  />
))
MobileTabsContent.displayName = TabsPrimitive.Content.displayName

export { MobileTabs, MobileTabsList, MobileTabsTrigger, MobileTabsContent }
