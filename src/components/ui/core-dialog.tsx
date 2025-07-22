
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const CoreDialog = DialogPrimitive.Root
const CoreDialogTrigger = DialogPrimitive.Trigger
const CoreDialogPortal = DialogPrimitive.Portal
const CoreDialogClose = DialogPrimitive.Close

const CoreDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
CoreDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const coreDialogVariants = cva(
  [
    // Base styles - flexbox layout foundation
    "fixed z-50 flex flex-col bg-background shadow-2xl",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:duration-200 data-[state=open]:duration-300",
    "focus:outline-none"
  ],
  {
    variants: {
      variant: {
        modal: [
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-[95vw] max-w-lg max-h-[90vh]",
          "rounded-2xl border border-border",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        ],
        sheet: [
          "bottom-0 left-0 right-0 top-[15vh]",
          "rounded-t-3xl border-t border-border",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "sm:left-1/2 sm:right-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:w-full sm:max-w-2xl sm:max-h-[90vh] sm:rounded-2xl sm:border"
        ],
        fullscreen: [
          "inset-0 rounded-none border-0",
          "w-screen h-screen max-w-none max-h-none",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        ],
        compact: [
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-[90vw] max-w-md max-h-[80vh]",
          "rounded-xl border border-border",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        ]
      }
    },
    defaultVariants: {
      variant: "modal"
    }
  }
)

interface CoreDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof coreDialogVariants> {
  showCloseButton?: boolean
}

const CoreDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  CoreDialogContentProps
>(({ className, children, variant = "modal", showCloseButton = true, ...props }, ref) => (
  <CoreDialogPortal>
    <CoreDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(coreDialogVariants({ variant }), className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </CoreDialogPortal>
))
CoreDialogContent.displayName = DialogPrimitive.Content.displayName

const CoreDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { showBorder?: boolean }
>(({ className, showBorder = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-2 px-6 py-6 flex-shrink-0",
      showBorder && "border-b border-border/30",
      className
    )}
    {...props}
  />
))
CoreDialogHeader.displayName = "CoreDialogHeader"

const CoreDialogBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex-1 overflow-y-auto overflow-x-hidden px-6 py-6",
      "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20",
      className
    )}
    style={{
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'thin'
    }}
    {...props}
  />
))
CoreDialogBody.displayName = "CoreDialogBody"

const CoreDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { showBorder?: boolean }
>(({ className, showBorder = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 py-6 flex-shrink-0",
      showBorder && "border-t border-border/30",
      className
    )}
    {...props}
  />
))
CoreDialogFooter.displayName = "CoreDialogFooter"

const CoreDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CoreDialogTitle.displayName = DialogPrimitive.Title.displayName

const CoreDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-base text-muted-foreground", className)}
    {...props}
  />
))
CoreDialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  CoreDialog,
  CoreDialogPortal,
  CoreDialogOverlay,
  CoreDialogClose,
  CoreDialogTrigger,
  CoreDialogContent,
  CoreDialogHeader,
  CoreDialogBody,
  CoreDialogFooter,
  CoreDialogTitle,
  CoreDialogDescription,
}
