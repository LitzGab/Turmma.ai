"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

/* 12ª rodada (04/10/2026), a PONTE VISUAL para o sistema Turmma × Duolingo: borda de 2 px, canto de 12 a 16, nenhuma
   sombra borrada (degrau sólido no que flutua), foco azul de 3 px e letra de 14 ou mais. As props não mudam. */

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-azul-degrau data-[state=checked]:bg-azul data-[state=unchecked]:border-borda data-[state=unchecked]:bg-borda",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block size-6 rounded-full bg-white ring-0 transition-transform data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px]",
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
