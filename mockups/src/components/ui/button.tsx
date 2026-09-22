import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* shadcn/button (21st.dev · 1323, MIT), no desenho do ChatGPT: PÍLULA, 14 px em peso 500.
   Cinco variantes e nenhuma outra (11.1): primario em laranja, oficial em preto, secundario com borda fina,
   discreto sem fundo, perigo em vermelho. Os nomes do shadcn continuam como apelido para as outras peças. */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,border-color,color,opacity] duration-150 ease-estado disabled:pointer-events-none disabled:bg-realce-suave disabled:text-inativo disabled:border-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-caramelo text-tinta hover:bg-caramelo-claro active:bg-caramelo-fundo",
        primario: "bg-caramelo text-tinta hover:bg-caramelo-claro active:bg-caramelo-fundo",
        oficial: "bg-noite text-white hover:bg-noite-alto",
        secundario: "border border-borda-campo bg-superficie text-tinta hover:bg-realce-suave",
        outline: "border border-borda-campo bg-superficie text-tinta hover:bg-realce-suave",
        secondary: "border border-borda-campo bg-superficie text-tinta hover:bg-realce-suave",
        discreto: "text-sutil hover:bg-realce-suave hover:text-tinta",
        ghost: "text-sutil hover:bg-realce-suave hover:text-tinta",
        perigo: "text-erro hover:bg-erro-cx",
        destructive: "bg-erro text-white hover:bg-[#912018]",
        link: "text-tinta underline underline-offset-4 hover:text-sutil",
      },
      size: {
        default: "h-11 px-5 md:h-10",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-12 px-7 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
