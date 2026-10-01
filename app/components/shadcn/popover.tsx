import * as React from 'react'
import { cn } from '~/lib/cn'

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLDivElement | null>
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Popover({ open: controlledOpen, onOpenChange, children }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(newOpen)
      }
      if (!isControlled) {
        setUncontrolledOpen(newOpen)
      }
    },
    [isControlled, onOpenChange],
  )

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block w-full">{children}</div>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
  children: React.ReactNode
}

export const PopoverTrigger = React.forwardRef<HTMLDivElement, PopoverTriggerProps>(
  ({ asChild, children, className, onClick, ...props }, ref) => {
    const context = React.useContext(PopoverContext)
    if (!context) throw new Error('PopoverTrigger must be used within a Popover')

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      context.setOpen(!context.open)
      onClick?.(e)
    }

    if (asChild && React.isValidElement(children)) {
      return (
        <div ref={context.triggerRef} className="w-full">
          {React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
              children.props.onClick?.(e)
              handleClick(e as any)
            },
          })}
        </div>
      )
    }

    return (
      <div
        ref={context.triggerRef}
        onClick={handleClick}
        className={cn('cursor-pointer', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
PopoverTrigger.displayName = 'PopoverTrigger'

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ align = 'start', className, children, ...props }, ref) => {
    const context = React.useContext(PopoverContext)
    if (!context) throw new Error('PopoverContent must be used within a Popover')

    const contentRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (!context?.open) return
        const target = e.target as Node
        if (
          contentRef.current &&
          !contentRef.current.contains(target) &&
          context.triggerRef.current &&
          !context.triggerRef.current.contains(target)
        ) {
          context.setOpen(false)
        }
      }

      if (context.open) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [context])

    if (!context.open) return null

    return (
      <div
        ref={contentRef}
        className={cn(
          'absolute z-50 mt-1 rounded-md border bg-popover p-4 text-popover-foreground shadow-2xl outline-none animate-in fade-in-0 zoom-in-95',
          align === 'start' && 'left-0',
          align === 'end' && 'right-0',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          className,
        )}
        style={{ top: '100%' }}
        {...props}
      >
        {children}
      </div>
    )
  },
)
PopoverContent.displayName = 'PopoverContent'

export const PopoverAnchor = ({ children }: { children: React.ReactNode }) => <>{children}</>
