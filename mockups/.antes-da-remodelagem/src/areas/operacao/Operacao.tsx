import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCheck, Lock, LogOut, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Marca } from '@/components/marca/Pinta'
import { NotaMockup } from '@/components/turmma/tela'
import { REDES } from '@/dados/estrutura'
import { cn } from '@/lib/utils'
import { ESCOLAS_INICIAIS, HOJE_DA_OPERACAO, type EscolaNaTela, type RedeNaTela } from './_dados'
import { DialogoConvite, DialogoNovaEscola, DialogoNovaRede, DialogoRevogar } from './_dialogos'
import { AbaEscolas, type AcaoDeConvite } from './_escolas'
import { AbaUso } from './_uso'

/* O PAINEL DA OPERAÇÃO TURMMA (/operacao) — a área da equipe Turmma, fora da casca da escola. Cria a rede
   (a prefeitura, o grupo educacional ou o colégio) e a escola, convida a primeira coordenadora e acompanha
   uso e custo por escola. Não vê dado de pessoa: nem nome de aluno ou professor, nem nota, nem conversa.
   Moldura própria no sistema do ChatGPT: barra de 56 px, abas em controle segmentado (a aba fica no endereço,
   `?aba=uso`) e a linha do cadeado, que é o argumento para o jurídico de uma rede pública. Tudo em estado local. */

type Aba = 'escolas' | 'uso'
type Dialogo =
  | { tipo: 'rede' }
  | { tipo: 'escola'; redeId?: string }
  | { tipo: 'convite'; escola: EscolaNaTela; refazer: boolean }
  | { tipo: 'revogar'; escola: EscolaNaTela }

export function Operacao() {
  const [params, setParams] = useSearchParams()
  const aba: Aba = params.get('aba') === 'uso' ? 'uso' : 'escolas'
  const [redes, setRedes] = useState<RedeNaTela[]>(() => REDES.map(({ id, nome, tipo }) => ({ id, nome, tipo })))
  const [escolas, setEscolas] = useState<EscolaNaTela[]>(ESCOLAS_INICIAIS)
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [anuncio, setAnuncio] = useState<string | null>(null)

  const irPara = (a: Aba) => setParams(a === 'uso' ? { aba: 'uso' } : {}, { replace: true })
  const mudarEscola = (id: string, parte: Partial<EscolaNaTela>) => setEscolas((es) => es.map((e) => (e.id === id ? { ...e, ...parte } : e)))

  function aoConvite(acao: AcaoDeConvite, escola: EscolaNaTela) {
    setDialogo(acao === 'revogar' ? { tipo: 'revogar', escola } : { tipo: 'convite', escola, refazer: acao === 'refazer' })
  }

  return (
    <div className="flex h-svh min-h-0 flex-col bg-fundo text-tinta">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-linha px-4 md:px-6">
        <Link to="/operacao" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Turmma · Operação">
          <Marca className="text-[19px]" />
        </Link>
        <span aria-hidden className="h-5 w-px bg-borda-campo" />
        <span className="text-[15px] font-medium text-sutil">Operação</span>
        <div className="ml-auto flex items-center gap-2.5">
          <Avatar className="size-8"><AvatarFallback className="bg-noite text-[12px] font-semibold text-white">OT</AvatarFallback></Avatar>
          <span className="text-sm font-medium text-tinta max-sm:hidden">Operação Turmma</span>
          <Button variant="discreto" size="sm" asChild><Link to="/"><LogOut /> Sair</Link></Button>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 flex-col px-4 pb-4 pt-3 md:px-6">
        <h1 className="sr-only">Operação Turmma · {aba === 'uso' ? 'Uso' : 'Escolas'}</h1>
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div role="tablist" aria-label="Painel da operação" className="inline-flex rounded-full bg-realce-suave p-1">
            {(['escolas', 'uso'] as const).map((a) => (
              <button key={a} type="button" role="tab" aria-selected={aba === a} aria-controls="painel-operacao" onClick={() => irPara(a)}
                className={cn('h-9 rounded-full px-5 text-sm font-medium transition-colors duration-150 md:h-8',
                  aba === a ? 'bg-superficie text-tinta shadow-sm' : 'text-sutil hover:text-tinta')}>
                {a === 'uso' ? 'Uso' : 'Escolas'}
              </button>
            ))}
          </div>
          <p className="flex min-w-0 items-start gap-2 text-[13px] leading-snug text-sutil md:ml-auto md:items-center">
            <Lock className="mt-px size-3.5 shrink-0 md:mt-0" strokeWidth={2.2} />
            A operação vê rede, escola, uso e custo. Não vê nome de aluno nem de professor, nota ou conversa.
          </p>
        </div>

        {anuncio && (
          <div role="status" className="mb-3 flex items-center gap-2.5 rounded-controle bg-ok-cx px-3.5 py-2 text-sm text-ok">
            <CircleCheck className="size-4 shrink-0" strokeWidth={2.2} />
            <span className="min-w-0 flex-1">{anuncio}</span>
            <button type="button" onClick={() => setAnuncio(null)} aria-label="Fechar aviso" className="grid size-7 place-items-center rounded-full hover:bg-white/60">
              <X className="size-4" />
            </button>
          </div>
        )}

        <div id="painel-operacao" role="tabpanel" className="flex min-h-0 flex-1 flex-col">
          {aba === 'escolas'
            ? <AbaEscolas redes={redes} escolas={escolas} aoNovaRede={() => setDialogo({ tipo: 'rede' })}
                aoNovaEscola={(redeId) => setDialogo({ tipo: 'escola', redeId })} aoConvite={aoConvite} />
            : <AbaUso escolas={escolas} />}
        </div>
      </div>

      {dialogo?.tipo === 'rede' && (
        <DialogoNovaRede redes={redes} aoFechar={() => setDialogo(null)} aoCriar={(r) => {
          setRedes((rs) => [...rs, r])
          setDialogo(null)
          setAnuncio(`Rede ${r.nome} criada. Agora crie a escola dela em Nova escola.`)
        }} />
      )}
      {dialogo?.tipo === 'escola' && (
        <DialogoNovaEscola redes={redes} redeInicial={dialogo.redeId} enderecosUsados={escolas.map((e) => e.slug)}
          aoFechar={() => setDialogo(null)} aoCriar={({ nome, rede, slug, cidade }) => {
            setEscolas((es) => [...es, {
              id: `e-${slug}`, nome, slug, cidade, rede: rede.nome, tipo: rede.tipo,
              coordenacao: 'sem convite', criadaEm: HOJE_DA_OPERACAO.curta, alunos: 0,
            }])
            setDialogo(null)
            setAnuncio(`Escola ${nome} criada.`)
          }} />
      )}
      {dialogo?.tipo === 'convite' && (
        <DialogoConvite escola={dialogo.escola} refazer={dialogo.refazer} aoFechar={() => setDialogo(null)}
          aoGerar={(id, validade) => {
            mudarEscola(id, { coordenacao: 'convite em aberto', detalhe: `vale até ${validade}` })
            setAnuncio(`Convite da coordenação da ${dialogo.escola.nome} gerado. Vale até ${validade}.`)
          }} />
      )}
      {dialogo?.tipo === 'revogar' && (
        <DialogoRevogar escola={dialogo.escola} aoFechar={() => setDialogo(null)} aoConfirmar={() => {
          mudarEscola(dialogo.escola.id, { coordenacao: 'sem convite', detalhe: undefined })
          setDialogo(null)
          setAnuncio(`Convite da ${dialogo.escola.nome} revogado. O link deixou de valer.`)
        }} />
      )}

      <NotaMockup>
        Painel da operação (D76), como o produto real: rede → escola → convite da primeira coordenadora, e uso e custo por escola.
        A coordenadora convidada não aparece pelo nome na tabela; a operação vê o estado do convite. Estado local: recarregar volta ao início.
      </NotaMockup>
    </div>
  )
}
