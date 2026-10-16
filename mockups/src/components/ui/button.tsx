import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* shadcn/button (21st.dev · 1323, MIT). Cinco variantes e nenhuma outra (11.1): primario em laranja, oficial em
   grafite, secundario com borda, discreto sem fundo, perigo em vermelho. Os nomes do shadcn continuam como apelido.
   11ª rodada (04/10/2026), a PONTE VISUAL para o sistema Turmma × Duolingo (sistema-turmma-duolingo.md, 3.1): mesma
   altura e largura de antes, mas canto de 12 em vez de pílula, peso 700, borda de 2 px no secundário e o DEGRAU no
   primário e no oficial por box-shadow 0 4px 0 (some no :active, com a face descendo 4 px). Sem caixa alta: as telas
   densas continuam lendo igual. O botão completo, com caixa alta e degrau de camadas, é o `Botao` de components/duo.
   12ª rodada: o degrau também no secundário e no perigo (tudo que aperta tem degrau), letra de 14 ou mais, e o
   destructive vira o vermelho cheio da família (texto tinta), só para a confirmação. */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-[15px] font-bold transition-[background-color,border-color,color,opacity,filter,translate,box-shadow] duration-100 ease-estado disabled:pointer-events-none disabled:bg-borda disabled:text-apagado disabled:border-transparent disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-laranja text-sobre-cor shadow-[0_4px_0_var(--color-laranja-degrau)] hover:brightness-[1.06] active:translate-y-[4px] active:shadow-none",
        primario: "bg-laranja text-sobre-cor shadow-[0_4px_0_var(--color-laranja-degrau)] hover:brightness-[1.06] active:translate-y-[4px] active:shadow-none",
        oficial: "bg-grafite text-white shadow-[0_4px_0_var(--color-grafite-degrau)] hover:brightness-[1.15] active:translate-y-[4px] active:shadow-none",
        secundario: "border-2 border-borda bg-white text-tinta shadow-[0_4px_0_var(--color-borda)] hover:bg-fundo-suave active:translate-y-[4px] active:shadow-none",
        outline: "border-2 border-borda bg-white text-tinta shadow-[0_4px_0_var(--color-borda)] hover:bg-fundo-suave active:translate-y-[4px] active:shadow-none",
        secondary: "border-2 border-borda bg-white text-tinta shadow-[0_4px_0_var(--color-borda)] hover:bg-fundo-suave active:translate-y-[4px] active:shadow-none",
        discreto: "text-azul-texto hover:bg-fundo-suave",
        ghost: "text-sutil hover:bg-fundo-suave hover:text-tinta",
        perigo: "border-2 border-vermelho-borda bg-white text-vermelho-texto shadow-[0_4px_0_var(--color-vermelho-borda)] hover:bg-vermelho-claro active:translate-y-[4px] active:shadow-none",
        destructive: "bg-vermelho text-sobre-cor shadow-[0_4px_0_var(--color-vermelho-degrau)] hover:brightness-[1.06] active:translate-y-[4px] active:shadow-none",
        link: "text-azul-texto underline underline-offset-4 hover:text-tinta",
      },
      size: {
        default: "h-11 px-5 md:h-10",
        sm: "h-9 px-3.5 text-[14px]",
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
