import { useEffect, useId, useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Marca, Pinta } from '@/components/marca/Pinta'
import { cn } from '@/lib/utils'

/* A moldura das páginas públicas (sem sessão): a mesma tela dividida da Entrada (11.8), que o dono aprovou.
   À esquerda o painel `bg-papel` com a Marca, a pinta laranja grande e "#aiforschools"; abaixo de 768 px ele vira
   uma faixa de 96 px. À direita a coluna do formulário, de até 420 px, no desenho da entrada do ChatGPT.
   A coluna da direita rola por dentro se precisar: a página inteira nunca rola no computador. */
export function CascaPublica({ rodape, children }: { rodape?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] md:h-svh md:grid-cols-2 md:grid-rows-1">
      <aside className="relative flex h-24 items-center bg-papel px-6 md:h-auto md:flex-col md:items-stretch md:justify-between md:p-10">
        <Marca className="text-[22px]" />
        <div className="hidden flex-1 flex-col items-center justify-center gap-10 md:flex">
          <Pinta className="h-[clamp(180px,22vw,300px)] w-[clamp(180px,22vw,300px)] text-caramelo" rotulo="Turmma" />
          <p className="text-[15px] tracking-[0.12em] text-inativo">#aiforschools</p>
        </div>
        <p className="hidden min-h-5 text-center text-[13px] text-inativo md:block">{rodape}</p>
      </aside>
      <main className="flex bg-fundo px-4 py-10 md:overflow-y-auto md:px-10">
        <div className="mx-auto w-full max-w-[420px] md:my-auto">{children}</div>
      </main>
    </div>
  )
}

/** O título da aba do navegador, devolvido ao sair da página. */
export function useTituloDaAba(titulo: string) {
  useEffect(() => {
    const antes = document.title
    document.title = titulo
    return () => { document.title = antes }
  }, [titulo])
}

export function Titulo({ titulo, linha }: { titulo: ReactNode; linha?: ReactNode }) {
  return (
    <div>
      <h1 className="text-[28px] font-normal leading-tight tracking-[-0.01em] text-tinta">{titulo}</h1>
      {linha && <p className="mt-1.5 text-base text-sutil">{linha}</p>}
    </div>
  )
}

export const classeDoCampo = 'h-12 rounded-full border-borda-campo bg-superficie px-5 text-base focus-visible:ring-1 focus-visible:ring-offset-0'
export const classeDoLink = 'text-tinta underline underline-offset-4 hover:text-sutil'

/** Campo em pílula, com rótulo em cima, dica e erro embaixo (o erro toma o lugar da dica). */
export function Campo({ rotulo, dica, erro, className, ...props }: {
  rotulo: string; dica?: string; erro?: string
} & React.ComponentProps<typeof Input>) {
  const id = useId()
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="pl-1 text-[13px] font-medium text-sutil">{rotulo}</Label>
      <Input id={id} aria-invalid={!!erro} aria-describedby={erro || dica ? `${id}-nota` : undefined}
        className={cn(classeDoCampo, erro && 'border-erro', className)} {...props} />
      {(erro || dica) && (
        <p id={`${id}-nota`} className={cn('pl-1 text-[13px] leading-snug', erro ? 'text-erro' : 'text-sutil')}>{erro || dica}</p>
      )}
    </div>
  )
}

/** Campo de senha com mostrar/ocultar dentro da pílula. */
export function CampoSenha({ rotulo, dica, erro, ...props }: {
  rotulo: string; dica?: string; erro?: string
} & Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const id = useId()
  const [visivel, setVisivel] = useState(false)
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="pl-1 text-[13px] font-medium text-sutil">{rotulo}</Label>
      <div className="relative">
        <Input id={id} type={visivel ? 'text' : 'password'} aria-invalid={!!erro} aria-describedby={erro || dica ? `${id}-nota` : undefined}
          className={cn(classeDoCampo, 'pr-14', erro && 'border-erro')} {...props} />
        <button type="button" onClick={() => setVisivel((v) => !v)} aria-label={visivel ? 'Ocultar a senha' : 'Mostrar a senha'}
          aria-pressed={visivel}
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-sutil transition-colors hover:bg-realce-suave hover:text-tinta">
          {visivel ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
      {(erro || dica) && (
        <p id={`${id}-nota`} className={cn('pl-1 text-[13px] leading-snug', erro ? 'text-erro' : 'text-sutil')}>{erro || dica}</p>
      )}
    </div>
  )
}

/** Caixa de estado: ok (verde), pendente (âmbar), erro (vermelho). */
export function Aviso({ tipo, children, className }: { tipo: 'ok' | 'pendente' | 'erro'; children: ReactNode; className?: string }) {
  const cor = { ok: 'bg-ok-cx text-ok', pendente: 'bg-pendente-cx text-pendente', erro: 'bg-erro-cx text-erro' }[tipo]
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={cn('rounded-controle px-4 py-3 text-[15px] leading-snug', cor, className)}>
      {children}
    </div>
  )
}

export const TEXTO_DA_ESCOLA_INEXISTENTE = 'Não encontramos esta escola. Confira o endereço com a escola.'

/** Endereço com uma escola que não existe. */
export function EscolaInexistente() {
  return (
    <CascaPublica>
      <Titulo titulo="Escola não encontrada" />
      <Aviso tipo="erro" className="mt-6">{TEXTO_DA_ESCOLA_INEXISTENTE}</Aviso>
    </CascaPublica>
  )
}
