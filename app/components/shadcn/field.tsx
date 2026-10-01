// shadcn/ui — Field, FieldGroup, FieldLabel (form layout helpers)
import * as React from 'react'
import { cn } from '~/lib/cn'

const FieldGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-3', className)}
      {...props}
    />
  ),
)
FieldGroup.displayName = 'FieldGroup'

const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
  ),
)
Field.displayName = 'Field'

const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-[7px] text-[#aaa] font-["Press_Start_2P"]', className)}
    {...props}
  />
))
FieldLabel.displayName = 'FieldLabel'

export { FieldGroup, Field, FieldLabel }
