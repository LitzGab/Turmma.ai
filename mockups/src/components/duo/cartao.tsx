import * as React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/* O CARTÃO (11ª rodada; sistema-turmma-duolingo.md, seção 3.2).

   · De leitura: fundo branco, borda de 2 px, canto 16, 16 a 20 px por dentro, SEM degrau. Quem olha sabe que não aperta.
   · Clicável (`como="button"`, `onClick` ou `para`): a técnica do degrau (index.css) com face branca, borda de 2 px e
     degrau de 4 px na cor da borda; o hover põe fundo-suave; apertado, a face desce 2 px e o degrau fica com 2.
   · Selecionado: face azul-claro, borda e degrau azul-borda, texto principal azul-texto.
   A cor de família vai no ladrilho e no selo de dentro, nunca no fundo inteiro (a exceção é a Faixa).

   No clicável, `className` vai para a FACE (onde mora o conteúdo) e `classeCaixa` para a caixa externa. */

type Base = {
  children: React.ReactNode
  /** classes da face (o miolo: padding, layout) */
  className?: string
  /** classes da caixa externa (largura, margem); no de leitura, soma ao className */
  classeCaixa?: string
  selecionado?: boolean
  /** sem o padding padrão de 16/20 px */
  semRespiro?: boolean
  style?: React.CSSProperties
  'aria-label'?: string
  title?: string
}

export type CartaoProps = Base & (
  | { como?: 'div'; para?: undefined; onClick?: undefined }
  | { como: 'button'; para?: undefined; onClick?: React.MouseEventHandler<HTMLButtonElement>; type?: 'button' | 'submit'; disabled?: boolean }
  | { como?: 'link'; para: string; onClick?: React.MouseEventHandler<HTMLAnchorElement>; replace?: boolean }
)

const RESPIRO = 'p-4 md:p-5'

export function Cartao(props: CartaoProps) {
  const { children, className, classeCaixa, selecionado, semRespiro, style } = props
  const respiro = semRespiro ? '' : RESPIRO

  if (props.para === undefined && props.como !== 'button') {
    return (
      <div style={style} aria-label={props['aria-label']} title={props.title}
        className={cn('rounded-[16px] border-2 bg-white text-tinta',
          selecionado ? 'border-azul-borda bg-azul-claro' : 'border-borda', respiro, classeCaixa, className)}>
        {children}
      </div>
    )
  }

  const caixa = cn(
    'degrau block w-full rounded-[16px] text-left [--altura-degrau:4px] [--afunda:2px]',
    selecionado
      ? '[--face:var(--color-azul-claro)] [--lado:var(--color-azul-borda)]'
      : 'degrau-branco [--face:var(--color-white)] [--lado:var(--color-borda)]',
    classeCaixa,
  )
  const face = cn('face block rounded-[16px] border-2 text-tinta',
    selecionado ? 'border-azul-borda [&_.t-cartao]:text-azul-texto' : 'border-borda', respiro, className)

  if (props.para !== undefined) {
    return (
      <Link to={props.para} replace={props.replace} onClick={props.onClick} style={style}
        aria-label={props['aria-label']} title={props.title} aria-current={selecionado ? 'true' : undefined} className={caixa}>
        <span className={face}>{children}</span>
      </Link>
    )
  }
  return (
    <button type={props.type ?? 'button'} onClick={props.onClick} disabled={props.disabled} style={style}
      aria-label={props['aria-label']} title={props.title} aria-pressed={selecionado || undefined} className={caixa}>
      <span className={face}>{children}</span>
    </button>
  )
}
