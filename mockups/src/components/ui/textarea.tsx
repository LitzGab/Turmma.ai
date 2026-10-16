import * as React from "react"

import { cn } from "@/lib/utils"

/* 12ª rodada (04/10/2026), a PONTE VISUAL para o sistema Turmma × Duolingo: borda de 2 px, canto de 12 a 16, nenhuma
   sombra borrada (degrau sólido no que flutua), foco azul de 3 px e letra de 14 ou mais. As props não mudam. */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[88px] w-full rounded-[12px] border-2 border-borda bg-campo px-3.5 py-2.5 text-[15px] font-medium leading-[22px] text-tinta transition-colors duration-150 placeholder:text-sutil hover:border-borda-forte focus-visible:border-azul-borda focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-fundo-suave disabled:text-sutil",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
