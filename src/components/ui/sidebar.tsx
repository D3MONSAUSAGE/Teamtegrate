
import * as React from "react"
import { useState, createContext, useContext, useMemo, useCallback } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"

const SIDEBAR_WIDTH = 250
const SIDEBAR_WIDTH_COLLAPSED = 64
const SIDEBAR_WIDTH_MOBILE = "80%"

type SidebarContextType = {
  open: boolean
  isHoverExpanded: boolean
  isMobile: boolean
  state: "open" | "closed"
  setOpen: (open: boolean) => void
  setOpenMobile: (open: boolean) => void
  setHoverExpanded: (expanded: boolean) => void
  toggleOpen: () => void
  openMobile: boolean
}

const SidebarContext = createContext<SidebarContextType>({
  open: true,
  isHoverExpanded: false,
  isMobile: false,
  state: "open",
  setOpen: () => { },
  setOpenMobile: () => { },
  setHoverExpanded: () => { },
  toggleOpen: () => { },
  openMobile: false,
})

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

const useSidebar = () => useContext(SidebarContext)

const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen)
  const [openMobile, setOpenMobile] = useState(false)
  const [isHoverExpanded, setHoverExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleOpen = useCallback(() => {
    setOpen((prevOpen) => !prevOpen)
  }, [])

  const state = useMemo(() => (open ? "open" : "closed") as "open" | "closed", [open])

  const value = useMemo(
    () => ({
      open,
      isHoverExpanded,
      isMobile,
      state,
      setOpen,
      setOpenMobile,
      setHoverExpanded,
      toggleOpen,
      openMobile,
    }),
    [
      open,
      isHoverExpanded,
      isMobile,
      state,
      setOpen,
      setOpenMobile,
      setHoverExpanded,
      toggleOpen,
      openMobile,
    ]
  )

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof sidebarVariants> {
  collapsible?: "none" | "icon"
}

const sidebarVariants = cva(
  "group relative flex h-screen flex-col overflow-hidden border-r border-sidebar-border/60 data-[state=open]:w-[--sidebar-width] data-[state=closed]:w-[--sidebar-width-collapsed] transition-all data-[state=open]:duration-300 data-[state=closed]:duration-300",
  {
    variants: {
      variant: {
        sidebar: "",
      },
    },
    defaultVariants: {
      variant: "sidebar",
    },
  }
)

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      variant,
      collapsible = "icon",
      ...props
    },
    ref
  ) => {
    const {
      open,
      setOpen,
      setHoverExpanded,
      isMobile,
    } = useSidebar()

    const isCollapsed = !isMobile && !open

    // Hide sidebar completely on mobile - drawer handles mobile display
    if (isMobile) {
      return null
    }

    return (
      <div
        ref={ref}
        data-state={open ? "open" : "closed"}
        className={cn(sidebarVariants({ variant, className }))}
        style={
          {
            "--sidebar-width": `${SIDEBAR_WIDTH}px`,
            "--sidebar-width-collapsed": `${SIDEBAR_WIDTH_COLLAPSED}px`,
          } as React.CSSProperties
        }
        onMouseEnter={() => {
          if (collapsible === "icon" && isCollapsed) {
            setHoverExpanded(true)
          }
        }}
        onMouseLeave={() => {
          if (collapsible === "icon") {
            setHoverExpanded(false)
          }
        }}
      >
        {props.children}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex shrink-0 items-center justify-between", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex shrink-0 items-center justify-between", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleOpen, isMobile, openMobile, setOpenMobile } = useSidebar()
  
  const handleClick = () => {
    if (isMobile) {
      // On mobile, toggle the mobile drawer state
      setOpenMobile(!openMobile)
    } else {
      // On desktop, toggle the sidebar collapse/expand state
      toggleOpen()
    }
  }
  
  return (
    <button
      ref={ref}
      className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 px-3", className)}
      onClick={handleClick}
      {...props}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
  }
>(({ side = "left", className, ...props }, ref) => {
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar"
          data-mobile="true"
          className={cn(
            "bg-sidebar-background text-sidebar-foreground border-sidebar-border/60 p-0 [&>button]:hidden",
            className
          )}
          side={side}
        >
          <div className="flex h-full w-full flex-col bg-sidebar-background">
            {props.children}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      ref={ref}
      data-sidebar="sidebar"
      className="flex h-full w-full flex-col bg-sidebar-background text-sidebar-foreground"
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

export {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  SidebarInset,
}
