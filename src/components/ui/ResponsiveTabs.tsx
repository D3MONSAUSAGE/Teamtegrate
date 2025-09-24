import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const ResponsiveTabs = TabsPrimitive.Root

const ResponsiveTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg p-1 text-muted-foreground",
        isMobile 
          ? "w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide bg-muted/50 backdrop-blur-sm border border-border/20 gap-1 h-11" 
          : "h-10 bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
})
ResponsiveTabsList.displayName = TabsPrimitive.List.displayName

const ResponsiveTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isMobile 
          ? "px-3 py-2 text-sm snap-center flex-shrink-0 min-w-[80px] h-9 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" 
          : "px-3 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
})
ResponsiveTabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const ResponsiveTabsContent = React.forwardRef<
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
ResponsiveTabsContent.displayName = TabsPrimitive.Content.displayName

export { ResponsiveTabs, ResponsiveTabsList, ResponsiveTabsTrigger, ResponsiveTabsContent }