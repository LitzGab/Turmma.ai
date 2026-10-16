import * as React from 'react'
import { CircleAlert, Eye, EyeOff, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BotaoIcone } from './botao'

/* OS CAMPOS (12ª rodada). O rótulo em 15/700 `tinta`; o campo com 48 px, borda de 2 px `borda` e canto 12; no foco, a
   borda fica `azul-borda`; a dica em `t-apoio` embaixo; o erro em `vermelho-texto`, SEMPRE com o glifo (nunca só cor).
   · Campo: a moldura (rótulo, dica, erro) para qualquer controle;
   · CampoTexto: uma linha ou várias (`linhas`);
   · CampoSenha: com o olho para mostrar;
   · Busca: a lupa, 44 px, sem rótulo visível. */

export const CLASSE_CAMPO = 'w-full rounded-[12px] border-2 border-borda bg-campo px-3.5 text-[17px] font-medium text-tinta outline-none transition-colors duration-150 placeholder:text-sutil hover:border-borda-forte focus:border-azul-borda focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-fundo-suave disabled:text-sutil aria-[invalid=true]:border-vermelho-borda'

export function Campo({ id, rotulo, dica, erro, children, className, rotuloOculto }: {
  id?: string
  rotulo: React.ReactNode
  dica?: React.ReactNode
  erro?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** o rótulo só para leitor de tela */
  rotuloOculto?: boolean
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-[15px] font-bold leading-5 text-tinta', rotuloOculto && 'sr-only')}>{rotulo}</label>
      {children}
      {erro ? (
        <p id={id ? `${id}-erro` : undefined} role="alert" className="flex items-start gap-1.5 text-[15px] font-bold leading-5 text-vermelho-texto">
          <CircleAlert aria-hidden className="mt-px size-[18px] shrink-0" strokeWidth={2.5} /> {erro}
        </p>
      ) : dica ? (
        <p id={id ? `${id}-dica` : undefined} className="t-apoio">{dica}</p>
      ) : null}
    </div>
  )
}

type CampoTextoProps = {
  rotulo: React.ReactNode
  valor: string
  aoMudar: (v: string) => void
  dica?: React.ReactNode
  erro?: React.ReactNode
  /** mais de uma linha vira caixa de texto */
  linhas?: number
  id?: string
  className?: string
  rotuloOculto?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id' | 'className'>

export const CampoTexto = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, CampoTextoProps>(function CampoTexto(
  { rotulo, valor, aoMudar, dica, erro, linhas, id, className, rotuloOculto, ...resto }, ref,
) {
  const gerado = React.useId()
  const idCampo = id ?? gerado
  const descricao = erro ? `${idCampo}-erro` : dica ? `${idCampo}-dica` : undefined
  return (
    <Campo id={idCampo} rotulo={rotulo} dica={dica} erro={erro} className={className} rotuloOculto={rotuloOculto}>
      {linhas && linhas > 1 ? (
        <textarea ref={ref as React.Ref<HTMLTextAreaElement>} id={idCampo} value={valor} rows={linhas}
          onChange={(e) => aoMudar(e.target.value)} aria-invalid={!!erro || undefined} aria-describedby={descricao}
          placeholder={resto.placeholder} disabled={resto.disabled} maxLength={resto.maxLength} autoFocus={resto.autoFocus}
          className={cn(CLASSE_CAMPO, 'min-h-24 resize-none py-3 leading-[25px]')} />
      ) : (
        <input ref={ref as React.Ref<HTMLInputElement>} id={idCampo} value={valor} onChange={(e) => aoMudar(e.target.value)}
          aria-invalid={!!erro || undefined} aria-describedby={descricao} {...resto} className={cn(CLASSE_CAMPO, 'h-12')} />
      )}
    </Campo>
  )
})

export function CampoSenha({ rotulo = 'Senha', valor, aoMudar, dica, erro, id, className, ...resto }: Omit<CampoTextoProps, 'linhas' | 'rotulo'> & { rotulo?: React.ReactNode }) {
  const [ver, setVer] = React.useState(false)
  const gerado = React.useId()
  const idCampo = id ?? gerado
  return (
    <Campo id={idCampo} rotulo={rotulo} dica={dica} erro={erro} className={className}>
      <div className="relative">
        <input id={idCampo} type={ver ? 'text' : 'password'} value={valor} onChange={(e) => aoMudar(e.target.value)}
          aria-invalid={!!erro || undefined} aria-describedby={erro ? `${idCampo}-erro` : dica ? `${idCampo}-dica` : undefined}
          autoComplete="current-password" {...resto} className={cn(CLASSE_CAMPO, 'h-12 pr-12')} />
        <BotaoIcone rotulo={ver ? 'Esconder a senha' : 'Mostrar a senha'} onClick={() => setVer((v) => !v)} className="absolute right-1 top-1/2 -translate-y-1/2">
          {ver ? <EyeOff strokeWidth={2.5} /> : <Eye strokeWidth={2.5} />}
        </BotaoIcone>
      </div>
    </Campo>
  )
}

export function Busca({ valor, aoMudar, rotulo = 'Buscar', className }: {
  valor: string
  aoMudar: (v: string) => void
  rotulo?: string
  className?: string
}) {
  return (
    <label className={cn('relative block w-full sm:w-72', className)}>
      <span className="sr-only">{rotulo}</span>
      <Search aria-hidden strokeWidth={2.5} className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-sutil" />
      <input type="search" value={valor} onChange={(e) => aoMudar(e.target.value)} placeholder={rotulo}
        className={cn(CLASSE_CAMPO, 'h-11 pl-11 text-[16px]')} />
    </label>
  )
}
