import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Balao } from './balao'
import { Botao } from './botao'
import { BarraProgresso } from './progresso'
import { Comemoracao } from './comemoracao'
import { SeloIA } from './selo'
import { TelaFoco } from './tela-foco'
import { Onca } from './onca'
import type { AgenteIA, PoseOnca } from './onca'

/* A INTRODUÇÃO, ESTILO DUOLINGO (13ª rodada, 04/10/2026; plano de painéis e introdução, seção 2.1). Uma peça só para os
   cinco papéis; cada papel escreve o roteiro dele (os passos e o fim).
   · Tela de foco (sem casca). Topo de 64 px: o X (só nos passos não obrigatórios) e a barra de progresso verde de
     16 px, até 560 px, que anda a cada passo ("Passo 2 de 5" para o leitor de tela).
   · Miolo numa coluna de 484 px, centrada: a onça (120 px; 88 no celular) à esquerda, com o nome da função e o selo IA
     embaixo quando há agente, e o balão com a FALA, que é a pergunta (h1, aria-live; o foco vai para ela a cada
     passo). O conteúdo vem embaixo, a 16 px: uma coisa por tela.
   · A reação: quando o passo fica pronto, a fala troca por meia frase ("Anotado!"), com cruzamento de 150 ms. É
     resposta, não recompensa.
   · Rodapé: CONTINUAR largo, cinza e sem degrau até o passo ficar pronto; com "Agora não", 1/3 e 2/3. Enter continua;
     Esc sai, quando pode.
   · O fim: a onça comemora (160 px; 120 no celular), a fala vira título, o resumo leva o visto verde, o conteúdo do fim
     e COMEÇAR, que leva para dentro do trabalho.
   NUNCA: pontos, XP, sequência de dias, meta, vidas, ranking ou pedido de notificação (ECA Digital, Lei 15.211/2025, e
   Decreto 12.880/2026, arts. 9º, 10 e 12 — lei). */

export type PassoIntroducao = {
  id: string
  pose: PoseOnca
  /** a pergunta é a fala: até 12 palavras */
  fala: React.ReactNode
  conteudo?: React.ReactNode
  /** CONTINUAR acende quando true (padrão true) */
  pronto?: boolean
  /** sem X e sem "Agora não" */
  obrigatorio?: boolean
  agoraNao?: boolean | { aoEscolher?: () => void }
  /** "Entendi", "Sim, estão certas" */
  rotuloContinuar?: string
  /** meia frase que troca a fala quando `pronto` vira true */
  reacao?: string
  /** grava (configura de verdade) antes de avançar */
  aoContinuar?: () => void
}

export type FimIntroducao = {
  fala: React.ReactNode
  resumo?: string[]
  conteudo?: React.ReactNode
  /** o rótulo do botão (padrão "Começar") */
  rotulo?: string
  aoComecar: () => void
}

const NOME_DO_AGENTE: Record<AgenteIA, string> = { tutor: 'Tutor', assistente: 'Assistente', analista: 'Analista' }

/** Enter num campo ou num controle que já reage ao Enter não deve avançar o passo. */
function alvoProprio(alvo: EventTarget | null) {
  const el = alvo as HTMLElement | null
  if (!el || !el.tagName) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A' || el.isContentEditable
}

export function Introducao({ rotulo, agente, passos, fim, aoSair }: {
  /** "Introdução do aluno" (leitor de tela) */
  rotulo: string
  /** o nome da função e o selo IA embaixo da onça */
  agente?: AgenteIA
  passos: PassoIntroducao[]
  fim: FimIntroducao
  /** o X (nos passos não obrigatórios) e o Esc */
  aoSair: () => void
}) {
  const [indice, setIndice] = React.useState(0)
  const total = passos.length
  const noFim = indice >= total
  const passo = noFim ? undefined : passos[indice]
  const pronto = passo ? passo.pronto ?? true : true
  const podeSair = !!passo && !passo.obrigatorio

  const avancar = React.useCallback(() => setIndice((i) => Math.min(i + 1, total)), [total])
  const continuar = React.useCallback(() => {
    if (!passo) { fim.aoComecar(); return }
    if (!(passo.pronto ?? true)) return
    passo.aoContinuar?.()
    avancar()
  }, [passo, fim, avancar])
  const agoraNao = () => {
    if (passo && typeof passo.agoraNao === 'object') passo.agoraNao.aoEscolher?.()
    avancar()
  }

  // Enter continua (fora de campo e de botão); Esc sai, quando pode
  React.useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === 'Enter' && !alvoProprio(e.target) && pronto) { e.preventDefault(); continuar() }
      else if (e.key === 'Escape' && podeSair) { e.preventDefault(); aoSair() }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [pronto, continuar, podeSair, aoSair])

  const barra = (
    <BarraProgresso familia="verde" valor={noFim ? total + 1 : indice + 1} max={total + 1}
      rotulo={noFim ? `${rotulo}: pronto` : `Passo ${indice + 1} de ${total}`} className="max-w-[560px]" />
  )
  // a barra fica no mesmo lugar com e sem o X: um vão de 40 px de cada lado
  const vao = <span aria-hidden className="block w-10 shrink-0" />
  const topo = podeSair
    ? { voltar: aoSair, sair: true, meio: barra, acoes: vao }
    : { voltar: false as const, meio: <div className="flex w-full items-center justify-center gap-3">{vao}{barra}{vao}</div> }

  const rodape = (
    <div data-introducao="rodape" data-introducao-fim={noFim ? '' : undefined}
      className={cn('mx-auto w-full max-w-[484px]', passo?.agoraNao && 'grid grid-cols-[1fr_2fr] gap-3')}>
      {passo?.agoraNao && <Botao variante="secundario" largura="cheia" onClick={agoraNao}>Agora não</Botao>}
      <Botao largura="cheia" disabled={!pronto} onClick={continuar}>
        {noFim ? fim.rotulo ?? 'Começar' : passo?.rotuloContinuar ?? 'Continuar'}
      </Botao>
    </div>
  )

  return (
    <TelaFoco topo={topo} rodape={rodape} classeMiolo="flex">
      <section aria-label={rotulo} className="m-auto flex w-full max-w-[484px] flex-col px-4 py-6 md:py-8">
        {passo
          ? <MioloPasso key={passo.id} passo={passo} agente={agente} />
          : <MioloFim fim={fim} />}
      </section>
    </TelaFoco>
  )
}

/* ── Um passo: a onça, a fala (com a reação) e o conteúdo ───────────────────────────────────────────────── */

function MioloPasso({ passo, agente }: { passo: PassoIntroducao; agente?: AgenteIA }) {
  const pronto = passo.pronto ?? true
  // a reação: quando `pronto` passa de false a true (o padrão do React para estado derivado, sem efeito)
  const [antes, setAntes] = React.useState(pronto)
  const [reagiu, setReagiu] = React.useState(false)
  if (antes !== pronto) {
    setAntes(pronto)
    setReagiu(pronto && !!passo.reacao)
  }
  const titulo = React.useRef<HTMLHeadingElement>(null)
  React.useEffect(() => {
    titulo.current?.focus({ preventScroll: true })
    titulo.current?.closest('main')?.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="flex flex-col gap-4 animate-entra">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <Onca pose={passo.pose} tamanho={120} className="max-md:size-[88px]" />
          {agente && (
            <span className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold leading-5 text-tinta">{NOME_DO_AGENTE[agente]}</span>
              <SeloIA tamanho="p" />
            </span>
          )}
        </div>
        <Balao lado="esquerda" className="min-w-0 flex-1">
          <h1 ref={titulo} tabIndex={-1} aria-live="polite" className="outline-none">
            <span key={reagiu ? 'reacao' : 'fala'} className="block animate-in fade-in-0 duration-150">
              {reagiu ? passo.reacao : passo.fala}
            </span>
          </h1>
        </Balao>
      </div>
      {passo.conteudo && <div data-introducao="conteudo" className="min-w-0">{passo.conteudo}</div>}
    </div>
  )
}

/* ── O fim: a comemoração, o resumo e o conteúdo ────────────────────────────────────────────────────────── */

function MioloFim({ fim }: { fim: FimIntroducao }) {
  const caixa = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    caixa.current?.focus({ preventScroll: true })
    caixa.current?.closest('main')?.scrollTo({ top: 0 })
  }, [])
  return (
    <div ref={caixa} tabIndex={-1} className="flex flex-col items-center gap-5 outline-none">
      <Comemoracao titulo={fim.fala}
        ilustracao={<Onca pose="comemorando" tamanho={160} className="max-md:size-[120px]" />} />
      {fim.resumo && fim.resumo.length > 0 && (
        <ul className="mx-auto grid w-fit max-w-full justify-items-start gap-y-2 text-left">
          {fim.resumo.map((r) => (
            <li key={r} className="t-corpo flex items-center gap-2 text-tinta">
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-verde-claro text-verde-texto">
                <Check className="size-4" strokeWidth={3.5} />
              </span>
              {r}
            </li>
          ))}
        </ul>
      )}
      {fim.conteudo && <div className="w-full min-w-0">{fim.conteudo}</div>}
    </div>
  )
}
