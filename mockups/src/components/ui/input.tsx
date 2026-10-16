import * as React from "react"

import { cn } from "@/lib/utils"

/* 12ª rodada (04/10/2026), a PONTE VISUAL para o sistema Turmma × Duolingo: borda de 2 px, canto de 12 a 16, nenhuma
   sombra borrada (degrau sólido no que flutua), foco azul de 3 px e letra de 14 ou mais. As props não mudam. */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[12px] border-2 border-borda bg-campo px-3.5 py-2 text-[15px] font-medium text-tinta transition-colors duration-150 file:border-0 file:bg-transparent file:text-[15px] file:font-bold file:text-tinta placeholder:text-sutil hover:border-borda-forte focus-visible:border-azul-borda focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-fundo-suave disabled:text-sutil",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
