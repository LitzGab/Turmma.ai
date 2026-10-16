import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* O BOTÃO 3D (11ª rodada, 04/10/2026; sistema-turmma-duolingo.md, seção 3.1).

   Referências do 21st.dev, registradas e NÃO copiadas: tom_ui/pop-button (a API de cor por variante) e
   yashsehgal/3d-button (o `cva` com degrau). A API segue o padrão `cva` do ui/button.tsx (shadcn/button, 21st.dev ·
   1323, MIT). As medidas são as do Duolingo.

   Anatomia (a classe `.degrau`, no index.css): a caixa externa leva o degrau como ::before PARADO, na cor --lado;
   a face é um <span class="face"> que fica em cima e DESCE ao apertar, cobrindo o degrau. O layout não mexe.
   · primario: laranja, texto tinta — criar, pedir, exportar
   · oficial: grafite, texto branco — aprovar, confirmar, marcar como visto
   · secundario: branco com borda de 2 px — a alternativa
   · perigo: branco com borda vermelha — recusar com motivo, revogar
   · perigoCheio: vermelho cheio, texto tinta — SÓ na confirmação, dentro de um diálogo
   · fantasma: sem fundo, texto azul — VER TUDO, COMO FUNCIONA
   Desligado: face cinza, texto apagado e SEM degrau ("sem degrau = não aperta"). No máximo um cheio por tela (R4).
   A caixa alta vem do CSS: o texto vai escrito normal, para o leitor de tela ler direito. */

const botaoVariantes = cva(
  [
    'degrau group/botao inline-flex shrink-0 select-none align-middle font-bold uppercase leading-none tracking-[.04em]',
    '[&>.face]:w-full [&>.face]:whitespace-nowrap',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variante: {
        primario: '[--face:var(--color-laranja)] [--lado:var(--color-laranja-degrau)] text-sobre-cor',
        oficial: '[--face:var(--color-grafite)] [--lado:var(--color-grafite-degrau)] text-white',
        secundario: 'degrau-branco [--face:var(--color-white)] [--lado:var(--color-borda)] text-apoio hover:text-tinta [&>.face]:border-2 [&>.face]:border-borda',
        perigo: 'degrau-branco [--face:var(--color-white)] [--lado:var(--color-vermelho-borda)] text-vermelho-texto [&>.face]:border-2 [&>.face]:border-vermelho-borda',
        /** o vermelho cheio: só na confirmação, dentro de um diálogo (Revogar, Apagar) */
        perigoCheio: '[--face:var(--color-vermelho)] [--lado:var(--color-vermelho-degrau)] text-sobre-cor',
        fantasma: '[--altura-degrau:0px] [--face:transparent] [--lado:transparent] text-azul-texto [&:hover>.face]:bg-fundo-suave [&:disabled>.face]:bg-transparent [&[aria-disabled=true]>.face]:bg-transparent',
      },
      tamanho: {
        g: '[--altura-degrau:4px] rounded-[12px] text-[15px] [&>.face]:h-[46px] [&>.face]:px-4 [&_svg]:size-5',
        m: '[--altura-degrau:4px] rounded-[12px] text-[14px] [&>.face]:h-[38px] [&>.face]:px-3.5 [&_svg]:size-[18px]',
        p: '[--altura-degrau:3px] rounded-[10px] text-[13px] [&>.face]:h-[32px] [&>.face]:px-3 [&>.face]:gap-1.5 [&_svg]:size-4',
      },
      largura: {
        auto: '',
        cheia: 'flex w-full',
      },
    },
    compoundVariants: [
      // o fantasma não tem degrau em tamanho nenhum
      { variante: 'fantasma', tamanho: ['g', 'm', 'p'], className: '[--altura-degrau:0px]' },
    ],
    defaultVariants: { variante: 'primario', tamanho: 'g', largura: 'auto' },
  },
)

export type VarianteBotao = NonNullable<VariantProps<typeof botaoVariantes>['variante']>

export type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof botaoVariantes> & {
  /** passa a aparência para o filho (um <Link>, um <a>) */
  asChild?: boolean
  /** glifo à esquerda (lucide, traço 2.5) */
  icone?: React.ReactNode
}

export const Botao = React.forwardRef<HTMLButtonElement, BotaoProps>(function Botao(
  { variante, tamanho, largura, asChild = false, icone, className, children, type, disabled, ...resto }, ref,
) {
  const classe = cn(botaoVariantes({ variante, tamanho, largura }), className)
  if (asChild && React.isValidElement(children)) {
    const filho = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>
    return React.cloneElement(filho, {
      ...(resto as Record<string, unknown>),
      'aria-disabled': disabled || undefined,
      className: cn(classe, filho.props.className),
      children: <span className="face">{icone}{filho.props.children}</span>,
    } as Partial<typeof filho.props>)
  }
  return (
    <button ref={ref} type={type ?? 'button'} disabled={disabled} className={classe} {...resto}>
      <span className="face">{icone}{children}</span>
    </button>
  )
})

/* BotaoIcone: redondo, de 40 ou 48 px, com degrau de 3 px e um glifo de 20 a 22 px. É o enviar da caixa:
   laranja com a seta em tinta; desligado, face cinza e seta apagada. `rotulo` é obrigatório (vira aria-label). */
const botaoIconeVariantes = cva(
  'degrau inline-grid shrink-0 rounded-full [--altura-degrau:3px] [&>.face]:rounded-full [&_svg]:pointer-events-none',
  {
    variants: {
      variante: {
        primario: '[--face:var(--color-laranja)] [--lado:var(--color-laranja-degrau)] text-sobre-cor',
        oficial: '[--face:var(--color-grafite)] [--lado:var(--color-grafite-degrau)] text-white',
        secundario: 'degrau-branco [--face:var(--color-white)] [--lado:var(--color-borda)] text-apoio hover:text-tinta [&>.face]:border-2 [&>.face]:border-borda',
        fantasma: '[--altura-degrau:0px] [--face:transparent] [--lado:transparent] text-sutil hover:text-tinta [&:hover>.face]:bg-fundo-suave [&:disabled>.face]:bg-transparent',
      },
      tamanho: {
        40: '[&>.face]:size-10 [&_svg]:size-5',
        44: '[&>.face]:size-11 [&_svg]:size-[22px]',
        48: '[&>.face]:size-12 [&_svg]:size-[22px]',
      },
    },
    defaultVariants: { variante: 'fantasma', tamanho: 40 },
  },
)

export type BotaoIconeProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & VariantProps<typeof botaoIconeVariantes> & {
  rotulo: string
  children: React.ReactNode
  /** mostra o rótulo como dica nativa (title) */
  dica?: boolean
}

export const BotaoIcone = React.forwardRef<HTMLButtonElement, BotaoIconeProps>(function BotaoIcone(
  { variante, tamanho, rotulo, dica = true, className, children, type, ...resto }, ref,
) {
  return (
    <button ref={ref} type={type ?? 'button'} aria-label={rotulo} title={dica ? rotulo : undefined}
      className={cn(botaoIconeVariantes({ variante, tamanho }), className)} {...resto}>
      <span className="face">{children}</span>
    </button>
  )
})

